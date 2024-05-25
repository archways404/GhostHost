// src/chunks.rs

use std::fs::File;
use std::io::Write;
use std::error::Error;
use tempfile::NamedTempFile;

/// Splits the given data into chunks of the specified size and writes each chunk to a temporary file.
///
/// # Arguments
///
/// * `data` - A vector of bytes to be split into chunks.
/// * `chunk_size` - The size of each chunk in bytes.
///
/// # Returns
///
/// * A vector of NamedTempFile handles for each chunk.
pub fn split_into_temp_files(data: &[u8], chunk_size: usize) -> Result<Vec<NamedTempFile>, Box<dyn Error>> {
    let mut temp_files = Vec::new();

    for chunk in data.chunks(chunk_size) {
        let mut temp_file = NamedTempFile::new()?;
        temp_file.write_all(chunk)?;
        temp_files.push(temp_file);
    }

    Ok(temp_files)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_into_temp_files() {
        let data = vec![1, 2, 3, 4, 5, 6, 7, 8, 9];
        let chunk_size = 3;
        let temp_files = split_into_temp_files(&data, chunk_size).unwrap();
        assert_eq!(temp_files.len(), 3);
        
        for temp_file in temp_files {
            let mut file = temp_file.reopen().unwrap();
            let mut contents = Vec::new();
            file.read_to_end(&mut contents).unwrap();
            println!("Chunk: {:?}", contents);
        }
    }
}
