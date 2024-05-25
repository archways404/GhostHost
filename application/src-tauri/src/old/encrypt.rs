// src/encrypt.rs

use aes::Aes256;
use block_modes::{BlockMode, Cbc};
use block_modes::block_padding::Pkcs7;
use hex_literal::hex;
use rand::{thread_rng, Rng};
use rand::distributions::Standard;
use rand::RngCore;
use std::fs::File;
use std::io::Write;
use std::error::Error;
use tempfile::NamedTempFile;

type Aes256Cbc = Cbc<Aes256, Pkcs7>;

const KEY: [u8; 32] = hex!("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");

/// Encrypts the given file content and writes it to a temporary file.
///
/// # Arguments
///
/// * `file_content` - A vector of bytes representing the file content.
///
/// # Returns
///
/// * A NamedTempFile handle containing the encrypted data.
pub fn encrypt_temp(file_content: &[u8]) -> Result<NamedTempFile, Box<dyn Error>> {
    let mut iv = [0u8; 16];
    thread_rng().fill_bytes(&mut iv);

    let cipher = Aes256Cbc::new_from_slices(&KEY, &iv)?;

    let ciphertext = cipher.encrypt_vec(file_content);

    let mut encrypted_temp_file = NamedTempFile::new()?;
    encrypted_temp_file.write_all(&iv)?;
    encrypted_temp_file.write_all(&ciphertext)?;
    Ok(encrypted_temp_file)
}
