use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs::File;
use std::io::{self, Write, Read};
use tempfile::NamedTempFile;
use tokio::task;

#[derive(Serialize, Deserialize, Clone)]
pub struct ChunkResponse {
    pub index: usize,
    pub link: String,
}

#[derive(Serialize, Deserialize)]
pub struct ResponseText {
    pub chunks: Vec<ChunkResponse>,
}

pub async fn download_files(chunk_links: Vec<ChunkResponse>) -> Result<Vec<NamedTempFile>, Box<dyn Error + Send + Sync>> {
    let client = Client::new();
    let mut tasks = Vec::new();
    let mut chunk_files = Vec::new();

    for chunk in chunk_links {
        let client = client.clone();
        let link = chunk.link.clone();
        let index = chunk.index;

        let task = task::spawn(async move {
            let response = client.get(&link).send().await?;
            let bytes = response.bytes().await?;

            let mut temp_file = NamedTempFile::new()?;
            io::copy(&mut bytes.as_ref(), &mut temp_file)?;

            println!("Downloaded chunk {} from {}", index, link);
            Ok(temp_file) as Result<NamedTempFile, Box<dyn Error + Send + Sync>>
        });

        tasks.push(task);
    }

    for task in tasks {
        let temp_file = task.await??;
        chunk_files.push(temp_file);
    }

    Ok(chunk_files)
}

pub fn rebuild_file(chunk_files: Vec<NamedTempFile>) -> Result<NamedTempFile, Box<dyn Error>> {
    let mut output_file = NamedTempFile::new()?;

    for temp_file in chunk_files {
        let mut chunk_file = temp_file.reopen()?;
        let mut buffer = Vec::new();
        chunk_file.read_to_end(&mut buffer)?;
        output_file.write_all(&buffer)?;
    }

    println!("Reconstructed file from downloaded chunks");
    Ok(output_file)
}
