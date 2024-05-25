// src/decrypt.rs

use aes::Aes256;
use block_modes::{BlockMode, Cbc};
use block_modes::block_padding::Pkcs7;
use hex_literal::hex;
use std::fs::File;
use std::io::{Read, Write};
use std::error::Error;
use tempfile::NamedTempFile;

type Aes256Cbc = Cbc<Aes256, Pkcs7>;

const KEY: [u8; 32] = hex!("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");

/// Decrypts the given file content from a temporary file and writes it to a temporary file.
///
/// # Arguments
///
/// * `temp_file` - A NamedTempFile handle containing the encrypted data.
///
/// # Returns
///
/// * A NamedTempFile handle containing the decrypted data.
pub fn decrypt_temp(temp_file: &NamedTempFile) -> Result<NamedTempFile, Box<dyn Error>> {
    let mut encrypted_content = Vec::new();
    let mut file_handle = temp_file.reopen()?;
    file_handle.read_to_end(&mut encrypted_content)?;

    let (iv, ciphertext) = encrypted_content.split_at(16);

    let cipher = Aes256Cbc::new_from_slices(&KEY, iv)?;

    let decrypted_content = cipher.decrypt_vec(ciphertext)?;

    let mut decrypted_temp_file = NamedTempFile::new()?;
    decrypted_temp_file.write_all(&decrypted_content)?;
    Ok(decrypted_temp_file)
}
