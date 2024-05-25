// src/decode.rs

use base64::decode;
use std::fs::File;
use std::io::{Read, Write};
use std::error::Error;
use tempfile::NamedTempFile;

/// Decodes a Base64 encoded string from a temporary file to bytes and writes it to a temporary file.
///
/// # Arguments
///
/// * `temp_file` - A NamedTempFile handle containing the Base64 encoded data.
///
/// # Returns
///
/// * A NamedTempFile handle containing the decoded data.
pub fn decode_from_base64_temp(temp_file: &NamedTempFile) -> Result<NamedTempFile, Box<dyn Error>> {
    let mut file_content = String::new();
    let mut file_handle = temp_file.reopen()?;
    file_handle.read_to_string(&mut file_content)?;
    
    let decoded_content = decode(file_content)?;
    let mut decoded_temp_file = NamedTempFile::new()?;
    decoded_temp_file.write_all(&decoded_content)?;
    Ok(decoded_temp_file)
}
