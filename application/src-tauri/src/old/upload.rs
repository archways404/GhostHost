use reqwest::Client;
use serde::Serialize;
use std::error::Error;
use std::fs::File;
use std::io::{Read, Write};
use std::sync::Arc;
use tempfile::NamedTempFile;
use tokio::task;
use tokio::sync::Mutex;

#[derive(Serialize, Clone)]  // Implement Clone
struct ChunkResponse {
    index: usize,
    link: String,
}

#[derive(Serialize)]
struct ResponseText {
    chunks: Vec<ChunkResponse>,
}

pub async fn upload_chunks(chunks: Vec<NamedTempFile>) -> Result<(), Box<dyn Error>> {
    let client = Client::new();
    let mut tasks = Vec::new();
    let responses: Arc<Mutex<Vec<ChunkResponse>>> = Arc::new(Mutex::new(Vec::new()));

    for (i, chunk) in chunks.into_iter().enumerate() {
        let client = client.clone();
        let responses = Arc::clone(&responses);

        let task = task::spawn(async move {
            let mut chunk_content = Vec::new();
            let mut chunk_handle = chunk.reopen().unwrap();
            chunk_handle.read_to_end(&mut chunk_content).unwrap();

            let response = client
                .put("https://nopaste.net/")
                .body(chunk_content)
                .send()
                .await
                .unwrap();

            let response_text = response.text().await.unwrap();
            let link = extract_link(&response_text).unwrap();

            let mut responses = responses.lock().await;
            responses.push(ChunkResponse { index: i, link });
        });

        tasks.push(task);
    }

    for task in tasks {
        task.await.unwrap();
    }

    let responses = responses.lock().await;
    let response_text = ResponseText {
        chunks: responses.clone(),
    };

    let response_json = serde_json::to_string_pretty(&response_text)?;
    let mut file = File::create("response_text.json")?;
    file.write_all(response_json.as_bytes())?;

    Ok(())
}

fn extract_link(response_text: &str) -> Option<String> {
    response_text.lines().find_map(|line| {
        if line.starts_with("https://nopaste.net/") {
            Some(line.trim().to_string())
        } else {
            None
        }
    })
}
