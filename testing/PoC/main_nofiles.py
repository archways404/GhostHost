import base64
import os
import requests
import json
import zlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from bs4 import BeautifulSoup

# Replace with a secure password
PASSWORD = b'your-secure-password'
SALT = b'\x00' * 16  # Replace with a secure random salt

def derive_key(password, salt):
    kdf = Scrypt(
        salt=salt,
        length=32,
        n=2**14,
        r=8,
        p=1,
        backend=default_backend()
    )
    return kdf.derive(password)

def encrypt(data, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(data) + padder.finalize()
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    return iv + encrypted_data

def decrypt(encrypted_data, key):
    iv = encrypted_data[:16]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_padded_data = decryptor.update(encrypted_data[16:]) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    decrypted_data = unpadder.update(decrypted_padded_data) + unpadder.finalize()
    return decrypted_data

def calculate_crc32(data):
    return zlib.crc32(data) & 0xffffffff

def convert_file_to_base64_in_memory(original_file_path):
    with open(original_file_path, 'rb') as original_file:
        file_content = original_file.read()
        
    key = derive_key(PASSWORD, SALT)
    encrypted_content = encrypt(file_content, key)
    base64_encoded_data = base64.b64encode(encrypted_content).decode('utf-8')
    original_crc32 = calculate_crc32(file_content)
    print(f"Original CRC32: {original_crc32}")
    return base64_encoded_data, original_crc32

def split_base64_content_to_parts_in_memory(base64_content, part_size_mb=5):
    part_size = part_size_mb * 1024 * 1024
    parts = [base64_content[i:i + part_size] for i in range(0, len(base64_content), part_size)]
    print(f"Total base64 content length: {len(base64_content)}")
    print(f"Split into {len(parts)} parts")
    return parts

def upload_part(part_content):
    part_crc32 = calculate_crc32(part_content.encode('utf-8'))
    data = {
        'lang': 'text',
        'text': part_content,
        'expire': '-1',
        'password': '',
        'title': ''
    }
    
    response = requests.post('https://pst.innomi.net/paste/new', data=data)
    
    print(f"Request to https://pst.innomi.net/paste/new with part content of length {len(part_content)}")
    print(f"Part CRC32 before upload: {part_crc32}")
    print(f"Response Status Code: {response.status_code}")
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().split(" - ")[0]
            return title
    else:
        print(f"Failed to upload part: {response.status_code}")
    return None

def download_part(part_code):
    url = f"https://pst.innomi.net/paste/{part_code}"
    response = requests.get(url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        code_div = soup.find('div', {'class': 'code', 'id': 'code'})
        if code_div:
            part_content = code_div.get_text().replace('\n', '')
            part_crc32 = calculate_crc32(part_content.encode('utf-8'))
            print(f"Downloaded part CRC32: {part_crc32}")
            return part_content
    else:
        print(f"Failed to download part {part_code}: {response.status_code}")
    return None

def combine_parts_and_decode(parts, combined_file_path, original_crc32):
    combined_content = ''.join(parts)
    print(f"Total combined content length: {len(combined_content)}")
    
    try:
        encrypted_data = base64.b64decode(combined_content)
        key = derive_key(PASSWORD, SALT)
        decoded_data = decrypt(encrypted_data, key)
        print(f"Decrypted data length: {len(decoded_data)}")
    except Exception as e:
        print(f"Error decrypting base64 content: {e}")
        return
    
    combined_crc32 = calculate_crc32(decoded_data)
    print(f"Combined CRC32: {combined_crc32}")
    
    if combined_crc32 != original_crc32:
        print(f"Error: CRC32 mismatch! Original: {original_crc32}, Combined: {combined_crc32}")
        return
    
    with open(combined_file_path, 'wb') as combined_file:
        combined_file.write(decoded_data)
    
    print(f"Combined file saved to: {combined_file_path}")

def save_links_to_json(links, json_file_path):
    formatted_links = [{"part-{}".format(i + 1): link} for i, link in enumerate(links)]
    with open(json_file_path, 'w') as json_file:
        json.dump(formatted_links, json_file, indent=4)

def clear_output_directory(output_directory):
    for file_name in os.listdir(output_directory):
        file_path = os.path.join(output_directory, file_name)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")

def main():
    original_file_path = 'video.mp4'  # Replace with your file's path
    combined_file_path = 'output/new_video.mp4'  # Path to save the combined file
    json_file_path = 'output/response.json'  # Path to save the response JSON file

    # Ensure the output directory exists
    output_directory = os.path.dirname(combined_file_path)
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    # Convert file to base64 and split into parts
    base64_content, original_crc32 = convert_file_to_base64_in_memory(original_file_path)
    parts = split_base64_content_to_parts_in_memory(base64_content, part_size_mb=5)

    # Upload parts and get links
    links = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(upload_part, part) for part in parts]
        for future in as_completed(futures):
            link = future.result()
            if link:
                links.append(link)
    
    # Save links to JSON
    save_links_to_json(links, json_file_path)
    print(f"All links have been saved to: {json_file_path}")

    # Download parts and combine them
    downloaded_parts = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(download_part, link) for link in links]
        for future in as_completed(futures):
            part = future.result()
            if part:
                downloaded_parts.append(part)
    
    combine_parts_and_decode(downloaded_parts, combined_file_path, original_crc32)

if __name__ == "__main__":
    main()
