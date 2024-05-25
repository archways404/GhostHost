#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{command, Builder, generate_context, generate_handler};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, mpsc::{channel, Sender, Receiver}};
use base64::{encode, decode};
use serde::{Serialize, Deserialize};
use reqwest::Client;
use serde_urlencoded;
use tokio::runtime::Runtime;
use futures::future::join_all;
use tempfile::NamedTempFile;
use dirs;
use html_escape::decode_html_entities;

const CHUNK_SIZE: usize = 1 * 1024 * 1024; // 1MB

#[derive(Serialize, Deserialize)]
struct PartData {
    lang: String,
    text: String,
    expire: String,
    password: String,
    title: String,
}

#[derive(Serialize, Deserialize)]
struct FilePart {
    title: String,
}

#[derive(Serialize, Deserialize)]
struct PartLink {
    part: String,
}

async fn upload_part(client: Arc<Client>, part_path: String, tx: Sender<(usize, String)>, index: usize) {
    let part_content = match fs::read_to_string(&part_path) {
        Ok(content) => content,
        Err(e) => {
            println!("Failed to read part file {}: {}", part_path, e);
            return;
        }
    };
    let data = PartData {
        lang: "text".to_string(),
        text: part_content.clone(),
        expire: "1h".to_string(),
        password: "".to_string(),
        title: "".to_string(),
    };
    let res = client.post("https://pst.innomi.net/paste/new")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(serde_urlencoded::to_string(&data).unwrap())
        .send()
        .await;

    match res {
        Ok(response) => {
            println!("Request to https://pst.innomi.net/paste/new with part content of length {}", data.text.len());
            println!("Response Status Code: {}", response.status());
            if response.status().is_success() {
                if let Some(title) = response.text().await.ok()
                    .and_then(|body| {
                        let title = body.split("<title>").nth(1)
                            .and_then(|body| body.split("</title>").next())
                            .map(|title| title.split(" - ").next().unwrap_or("").to_string());
                        title
                    }) {
                        tx.send((index, title)).expect("Failed to send link");
                }
            } else {
                println!("Failed to upload part: {}", response.status());
            }
        }
        Err(e) => {
            println!("Error uploading part: {}", e);
        }
    }

    // Delete the part file after upload
    if let Err(e) = fs::remove_file(&part_path) {
        println!("Failed to delete part file {}: {}", part_path, e);
    }
}

fn split_into_temp_files(data: &[u8], chunk_size: usize) -> Result<Vec<(PathBuf, NamedTempFile)>, String> {
    let mut temp_files = Vec::new();
    for chunk in data.chunks(chunk_size) {
        let mut temp_file = NamedTempFile::new().map_err(|e| e.to_string())?;
        temp_file.write_all(chunk).map_err(|e| e.to_string())?;
        let temp_path = temp_file.path().to_path_buf();
        println!("Created temporary file: {}", temp_path.display());
        temp_files.push((temp_path, temp_file));
    }
    Ok(temp_files)
}

async fn process_single_file(file_path: String) -> Result<(String, Vec<serde_json::Value>), String> {
    // Read the file content
    let file_content = fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e.to_string()))?;

    // Base64 encode the file content
    let base64_encoded_data = encode(&file_content);

    // Split the base64 encoded content into 1MB chunks and write to temporary files
    let temp_files = split_into_temp_files(base64_encoded_data.as_bytes(), CHUNK_SIZE)
        .map_err(|e| format!("Splitting into temp files failed: {}", e.to_string()))?;

    // Upload the chunks
    let client = Arc::new(Client::new());
    let (tx, rx): (Sender<(usize, String)>, Receiver<(usize, String)>) = channel();
    let mut handles = vec![];

    for (index, (temp_path, _temp_file)) in temp_files.iter().enumerate() {
        let client = Arc::clone(&client);
        let tx = tx.clone();
        let part_path = temp_path.to_string_lossy().to_string();
        let handle = tokio::spawn(async move {
            upload_part(client, part_path, tx, index).await;
        });
        handles.push(handle);
    }

    join_all(handles).await;

    let mut links: Vec<(usize, String)> = vec![];
    println!("Received links:");
    for _ in 0..temp_files.len() {
        if let Ok(link) = rx.recv() {
            links.push(link);
        }
    }
    links.sort_by_key(|k| k.0);
    let formatted_links: Vec<_> = links.into_iter().map(|(index, link)| {
        let part_name = format!("part-{}", index + 1);
        serde_json::json!({ part_name: link })
    }).collect();

    let filename = PathBuf::from(file_path).file_name().unwrap().to_str().unwrap().to_string();
    Ok((filename, formatted_links))
}

async fn upload_file_data_json() -> Result<String, String> {
    let client = Client::new();
    let file_content = fs::read_to_string("file_data.json").map_err(|e| e.to_string())?;
    let data = PartData {
        lang: "text".to_string(),
        text: file_content,
        expire: "10m".to_string(),
        password: "".to_string(),
        title: "".to_string(),
    };
    let res = client.post("https://pst.innomi.net/paste/new")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(serde_urlencoded::to_string(&data).unwrap())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        if let Some(title) = res.text().await.ok()
            .and_then(|body| {
                body.split("<title>").nth(1)
                    .and_then(|body| body.split("</title>").next())
                    .map(|title| title.split(" - ").next().unwrap_or("").to_string())
            }) {
            return Ok(title);
        }
    }

    Err("Failed to upload file_data.json or parse the title".into())
}

fn update_history(title: &str, file_names: Vec<String>) -> Result<(), String> {
    let history_file = "history.json";
    let mut history: Vec<serde_json::Value> = if PathBuf::from(history_file).exists() {
        let file = File::open(history_file).map_err(|e| e.to_string())?;
        serde_json::from_reader(file).map_err(|e| e.to_string())?
    } else {
        vec![]
    };

    history.push(serde_json::json!({
        "title": title,
        "file_names": file_names,
    }));

    let history_json = serde_json::to_string_pretty(&history).map_err(|e| e.to_string())?;
    fs::write(history_file, history_json).map_err(|e| e.to_string())?;

    Ok(())
}

async fn download_json(client: Arc<Client>, url: &str) -> Result<String, String> {
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if res.status().is_success() {
        let text = res.text().await.map_err(|e| e.to_string())?;
        println!("Downloaded HTML from {}: {}", url, text); // Log the HTML response

        // Extract JSON from <div class="code" id="code">
        if let Some(code_div_content) = text.split(r#"<div class="code" id="code">"#).nth(1)
            .and_then(|body| body.split("</div>").next()) {
            // Decode HTML entities
            let decoded_content = decode_html_entities(&code_div_content).to_string();
            // Clean and format JSON
            let cleaned_content = decoded_content.replace("&#34;", "\"").replace("\n", "").trim().to_string();
            return Ok(cleaned_content);
        } else {
            println!("Failed to find <div class=\"code\" id=\"code\"> in the HTML from {}", url);
            return Err("Failed to extract JSON from HTML".to_string());
        }
    } else {
        println!("Failed to download HTML from {}: {}", url, res.status()); // Log the error
        Err("Failed to download JSON".to_string())
    }
}

async fn download_and_rebuild_part(client: Arc<Client>, url: String, tx: Sender<(usize, Vec<u8>)>, index: usize) {
    println!("Downloading part from link: {}", url);

    if let Ok(response) = client.get(&url).send().await {
        if let Ok(body) = response.text().await {
            if let Some(code_div_content) = body.split(r#"<div class="code" id="code">"#).nth(1)
                .and_then(|body| body.split("</div>").next()) {
                    let decoded_content = decode_html_entities(&code_div_content).to_string();
                    if let Ok(decoded_data) = decode(&decoded_content) {
                        tx.send((index, decoded_data)).expect("Failed to send downloaded part");
                        println!("Downloaded part from link: {}", url);
                    } else {
                        println!("Failed to decode part content from link: {}", url);
                    }
            } else {
                println!("Failed to parse part content from link: {}", url);
            }
        } else {
            println!("Failed to get response text from link: {}", url);
        }
    } else {
        println!("Failed to fetch link: {}", url);
    }
}

async fn download_and_rebuild_files(title: String) -> Result<(), String> {
    let client = Arc::new(Client::new());
    let initial_url = format!("https://pst.innomi.net/paste/{}", title);
    let initial_json = download_json(Arc::clone(&client), &initial_url).await?;

    println!("Initial JSON: {}", initial_json);

    let files: HashMap<String, Vec<HashMap<String, String>>> = serde_json::from_str(&initial_json).map_err(|e| {
        println!("Failed to parse JSON from {}: {}", initial_url, e);
        e.to_string()
    })?;

    for (filename, file_parts) in files {
        let (tx, rx): (Sender<(usize, Vec<u8>)>, Receiver<(usize, Vec<u8>)>) = channel();
        let mut handles = vec![];

        // Iterate over the parts
        for (index, part_map) in file_parts.iter().enumerate() {
            let part_url = part_map.values().next().unwrap();
            let client = Arc::clone(&client);
            let tx = tx.clone();
            let part_url = format!("https://pst.innomi.net/paste/{}", part_url);
            let handle = tokio::spawn(async move {
                download_and_rebuild_part(client, part_url, tx, index).await;
            });
            handles.push(handle);
        }

        join_all(handles).await;

        let mut part_data: Vec<(usize, Vec<u8>)> = vec![];
        for _ in 0..file_parts.len() {
            if let Ok(part) = rx.recv() {
                part_data.push(part);
            }
        }
        part_data.sort_by_key(|k| k.0);
        let combined_data: Vec<u8> = part_data.into_iter().flat_map(|(_, data)| data).collect();

        let download_path = dirs::download_dir().unwrap().join(&filename);
        let mut file = File::create(&download_path).map_err(|e| e.to_string())?;
        file.write_all(&combined_data).map_err(|e| e.to_string())?;

        println!("Rebuilt file saved to {}", download_path.display());
    }

    Ok(())
}


#[command]
async fn process_files(file_paths: Vec<String>) -> Result<String, String> {
    let mut all_files: HashMap<String, Vec<serde_json::Value>> = HashMap::new();
    let file_names: Vec<String> = file_paths.iter().map(|path| {
        PathBuf::from(path).file_name().unwrap().to_str().unwrap().to_string()
    }).collect();

    for file_path in file_paths {
        // Process each file separately
        match process_single_file(file_path.clone()).await {
            Ok((filename, links)) => {
                all_files.insert(filename, links);
            },
            Err(e) => return Err(e),
        }
    }

    // Save all files to file_data.json
    let file_data_json = serde_json::to_string_pretty(&all_files).unwrap();
    fs::write("file_data.json", &file_data_json).expect("Failed to save file_data.json");

    // Upload file_data.json and get its title
    let file_data_title = upload_file_data_json().await?;
    println!("file_data.json Response Title: {}", file_data_title);

    // Update history.json
    update_history(&file_data_title, file_names)?;

    Ok(file_data_title)
}

#[command]
async fn rebuild_files(title: String) -> Result<(), String> {
    download_and_rebuild_files(title).await
}

fn main() {
    let _rt = Runtime::new().unwrap();
    Builder::default()
        .invoke_handler(generate_handler![process_files, rebuild_files])
        .run(generate_context!())
        .expect("error while running tauri application");
}
