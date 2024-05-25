use std::fs;
use std::sync::Arc;
use std::sync::mpsc::{channel, Sender, Receiver};
use openssl::symm::{Cipher, Crypter, Mode};
use base64::{encode, decode};
use crc32fast::Hasher;
use serde::{Serialize, Deserialize};
use reqwest::Client;
use serde_urlencoded;
use tokio::runtime::Runtime;
use futures::future::join_all;
use std::time::Instant;

const PASSWORD: &str = "your-secure-password";
const SALT: [u8; 16] = [0; 16]; // Replace with a secure random salt

#[derive(Serialize, Deserialize)]
struct PartData {
    lang: String,
    text: String,
    expire: String,
    password: String,
    title: String,
}

fn derive_key(password: &str, salt: &[u8]) -> Vec<u8> {
    let mut key = vec![0u8; 32];
    openssl::pkcs5::pbkdf2_hmac(password.as_bytes(), salt, 100_000, openssl::hash::MessageDigest::sha256(), &mut key).unwrap();
    key
}

fn encrypt(data: &[u8], key: &[u8]) -> String {
    let mut iv = vec![0; 16];
    openssl::rand::rand_bytes(&mut iv).unwrap();
    let mut crypter = Crypter::new(Cipher::aes_256_cbc(), Mode::Encrypt, key, Some(&iv)).unwrap();
    let mut encrypted = vec![0; data.len() + Cipher::aes_256_cbc().block_size()];
    let mut count = crypter.update(data, &mut encrypted).unwrap();
    count += crypter.finalize(&mut encrypted[count..]).unwrap();
    encrypted.truncate(count);
    let mut result = iv.to_vec();
    result.extend_from_slice(&encrypted);
    encode(&result)
}

fn decrypt(encrypted_data: &str, key: &[u8]) -> Vec<u8> {
    let data = decode(encrypted_data).unwrap();
    let (iv, encrypted_text) = data.split_at(16);
    let mut crypter = Crypter::new(Cipher::aes_256_cbc(), Mode::Decrypt, key, Some(iv)).unwrap();
    let mut decrypted = vec![0; encrypted_text.len() + Cipher::aes_256_cbc().block_size()];
    let mut count = crypter.update(encrypted_text, &mut decrypted).unwrap();
    count += crypter.finalize(&mut decrypted[count..]).unwrap();
    decrypted.truncate(count);
    decrypted
}

fn calculate_crc32(data: &[u8]) -> String {
    let mut hasher = Hasher::new();
    hasher.update(data);
    format!("{:08x}", hasher.finalize())
}

fn convert_file_to_base64_in_memory(original_file_path: &str) -> (String, String) {
    let file_content = fs::read(original_file_path).expect("Failed to read file");
    let key = derive_key(PASSWORD, &SALT);
    let encrypted_content = encrypt(&file_content, &key);
    let base64_encoded_data = encrypted_content.clone();
    let original_crc32 = calculate_crc32(&file_content);
    println!("Original CRC32: {}", original_crc32);
    println!("Original file length: {}", file_content.len());
    println!("Encrypted data length: {}", encrypted_content.len());
    (base64_encoded_data, original_crc32)
}

async fn upload_part(client: Arc<Client>, part_path: String, tx: Sender<(usize, String)>, index: usize) {
    let part_content = fs::read_to_string(&part_path).expect("Failed to read part file");
    let part_crc32 = calculate_crc32(part_content.as_bytes());
    let data = PartData {
        lang: "text".to_string(),
        text: part_content.clone(),
        expire: "10m".to_string(),
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
            println!("Part CRC32 before upload: {}", part_crc32);
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
    fs::remove_file(part_path).expect("Failed to delete part file");
}

async fn download_part(client: Arc<Client>, url: String, index: usize, tx: Sender<(usize, String)>) {
    if let Ok(response) = client.get(&url).send().await {
        if let Ok(body) = response.text().await {
            if let Some(code_div_content) = body.split(r#"<div class="code" id="code">"#).nth(1)
                .and_then(|body| body.split("</div>").next()) {
                    tx.send((index, code_div_content.to_string())).expect("Failed to send downloaded part");
                    println!("Downloaded part from link: {}", url); // Added logging
            } else {
                println!("Failed to parse part content from link: {}", url); // Added logging
            }
        } else {
            println!("Failed to get response text from link: {}", url); // Added logging
        }
    } else {
        println!("Failed to fetch link: {}", url); // Added logging
    }
}

async fn main_async() {
    let start = Instant::now();

    let original_file_path = "video.mp4";
    let json_file_path = "output/response.json";
    let combined_file_path = "output/new_video.mp4";

    /*
    let original_file_path = "img.jpg";
    let json_file_path = "output/response.json";
    let combined_file_path = "output/new_img.jpg";
    */

    // Clear output directory
    fs::remove_dir_all("output").unwrap_or(());
    fs::create_dir_all("output/parts").expect("Failed to create parts directory");

    let (base64_encoded_data, original_crc32) = convert_file_to_base64_in_memory(original_file_path);
    println!("Total base64 content length: {}", base64_encoded_data.len());

    let part_size = 5 * 1024 * 1024; // 5 MB
    let part_dir = "output/parts";

    let mut part_files = vec![];
    for (i, chunk) in base64_encoded_data.as_bytes().chunks(part_size).enumerate() {
        let part_path = format!("{}/part-{}.txt", part_dir, i + 1);
        fs::write(&part_path, chunk).expect("Failed to write part file");
        part_files.push(part_path);
    }
    println!("Split into {} parts", part_files.len());

    let client = Arc::new(Client::new());
    let (tx, rx): (Sender<(usize, String)>, Receiver<(usize, String)>) = channel();
    let mut handles = vec![];

    for (index, part_path) in part_files.iter().enumerate() {
        let client = Arc::clone(&client);
        let tx = tx.clone();
        let part_path = part_path.clone();
        let handle = tokio::spawn(async move {
            upload_part(client, part_path, tx, index).await;
        });
        handles.push(handle);
    }

    join_all(handles).await;

    let mut links: Vec<(usize, String)> = vec![];
    for _ in 0..part_files.len() {
        if let Ok(link) = rx.recv() {
            links.push(link);
        }
    }
    links.sort_by_key(|k| k.0);
    let formatted_links: Vec<_> = links.into_iter().map(|(index, link)| {
        let part_name = format!("part-{}", index + 1);
        serde_json::json!({ part_name: link })
    }).collect();

    fs::write(json_file_path, serde_json::to_string_pretty(&formatted_links).unwrap()).expect("Failed to save links to file");
    println!("All links have been saved to: {}", json_file_path);

    let (tx, rx): (Sender<(usize, String)>, Receiver<(usize, String)>) = channel();
    let mut handles = vec![];

    for formatted_link in formatted_links.clone() {
        if let Some((part_name, link)) = formatted_link.as_object().unwrap().iter().next() {
            let url = format!("https://pst.innomi.net/paste/{}", link.as_str().unwrap());
            let client = Arc::clone(&client);
            let tx = tx.clone();
            let index = part_name.split('-').nth(1).unwrap().parse::<usize>().unwrap() - 1;
            let handle = tokio::spawn(async move {
                download_part(client, url, index, tx).await;
            });
            handles.push(handle);
        }
    }

    join_all(handles).await;

    let mut downloaded_parts: Vec<(usize, String)> = vec![];
    for _ in 0..formatted_links.len() {
        if let Ok(downloaded_part) = rx.recv() {
            downloaded_parts.push(downloaded_part);
        }
    }
    downloaded_parts.sort_by_key(|k| k.0);

    let combined_base64_content: String = downloaded_parts.into_iter().map(|(_, content)| content).collect();
    println!("Total combined content length: {}", combined_base64_content.len());

    let key = derive_key(PASSWORD, &SALT);
    let decrypted_data = decrypt(&combined_base64_content, &key);
    println!("Decrypted data length: {}", decrypted_data.len());

    let combined_crc32 = calculate_crc32(&decrypted_data);
    println!("Combined CRC32: {}", combined_crc32);

    if combined_crc32 != original_crc32 {
        println!("Error: CRC32 mismatch! Original: {}, Combined: {}", original_crc32, combined_crc32);
        return;
    }

    fs::write(combined_file_path, decrypted_data).expect("Failed to write combined file");
    println!("Combined file decoded and saved to: {}", combined_file_path);

    // Clean up output directory
    fs::remove_dir_all("output").expect("Failed to remove output directory");

    let duration = start.elapsed();
    println!("Time taken: {:?}", duration);
}

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(main_async());
}
