// src/encode.rs

use base64::encode;
use std::fs::File;
use std::io::Write;
use std::error::Error;
use tempfile::NamedTempFile;

/// Encodes the given file content to a Base64 string and writes it to a temporary file.
///
/// # Arguments
///
/// * `file_content` - A vector of bytes representing the file content.
///
/// # Returns
///
/// * A NamedTempFile handle containing the Base64 encoded data.
pub fn encode_to_base64_temp(file_content: &[u8]) -> Result<NamedTempFile, Box<dyn Error>> {
    let encoded_content = encode(file_content);
    let mut temp_file = NamedTempFile::new()?;
    temp_file.write_all(encoded_content.as_bytes())?;
    Ok(temp_file)
}
