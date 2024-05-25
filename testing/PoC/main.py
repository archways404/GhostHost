import base64
import os
import requests
import json
import zlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup

def calculate_crc32(data):
    return zlib.crc32(data) & 0xffffffff

def convert_file_to_base64(original_file_path, base64_file_path):
    output_directory = os.path.dirname(base64_file_path)
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
    
    with open(original_file_path, 'rb') as original_file:
        file_content = original_file.read()
        
        base64_encoded_data = base64.b64encode(file_content).decode('utf-8')
        
    with open(base64_file_path, 'w') as base64_file:
        base64_file.write(base64_encoded_data)
    
    original_crc32 = calculate_crc32(file_content)
    print(f"Original CRC32: {original_crc32}")
    return original_crc32, len(base64_encoded_data)

def split_file_to_parts(base64_file_path, part_size_mb=5):
    part_size = part_size_mb * 1024 * 1024
    output_directory = os.path.dirname(base64_file_path)
    
    with open(base64_file_path, 'r') as base64_file:
        base64_content = base64_file.read().replace('\n', '')
    
    print(f"Total base64 content length before splitting: {len(base64_content)}")
    
    part_files = []
    for i in range(0, len(base64_content), part_size):
        part_content = base64_content[i:i + part_size]
        part_file_path = os.path.join(output_directory, f'part-{i // part_size + 1}.txt')
        
        with open(part_file_path, 'w') as part_file:
            part_file.write(part_content)
        
        part_files.append(part_file_path)
        print(f"Created {part_file_path} with length {len(part_content)}")
    
    os.remove(base64_file_path)
    
    return part_files

def upload_part(file_path):
    with open(file_path, 'r') as file:
        part_content = file.read().replace('\n', '')  # Ensure no newlines in part content
    
    data = {
        'lang': 'text',
        'text': part_content,
        'expire': '-1',
        'password': '',
        'title': ''
    }
    
    response = requests.post('https://pst.innomi.net/paste/new', data=data)
    
    print(f"Request to https://pst.innomi.net/paste/new with part content of length {len(part_content)}")
    print(f"Response Status Code: {response.status_code}")
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().split(" - ")[0]
            return title
    else:
        print(f"Failed to upload {file_path}: {response.status_code}")
    return None

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

def download_and_save_parts(json_file_path, output_directory):
    with open(json_file_path, 'r') as json_file:
        parts = json.load(json_file)
    
    for part in parts:
        part_name = list(part.keys())[0]
        part_code = part[part_name]
        
        url = f"https://pst.innomi.net/paste/{part_code}"
        response = requests.get(url)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            code_div = soup.find('div', {'class': 'code', 'id': 'code'})
            if code_div:
                part_content = code_div.get_text().replace('\n', '')  # Ensure no newlines in part content
                part_file_path = os.path.join(output_directory, part_name + '.txt')
                with open(part_file_path, 'w') as part_file:
                    part_file.write(part_content)
                print(f"Saved {part_name} to {part_file_path} with length {len(part_content)}")
        else:
            print(f"Failed to download {part_name}: {response.status_code}")

def combine_parts_and_decode(output_directory, combined_file_path, original_crc32, original_base64_length):
    part_files = sorted(
        [f for f in os.listdir(output_directory) if f.startswith('part-') and f.endswith('.txt')],
        key=lambda x: int(x.split('-')[1].split('.')[0])
    )
    
    combined_content = ""
    for part_file in part_files:
        with open(os.path.join(output_directory, part_file), 'r') as file:
            part_content = file.read().replace('\n', '').strip()  # Remove newlines and extra spaces
            combined_content += part_content
            print(f"Read {part_file} with length {len(part_content)}")
    
    print(f"Total combined content length: {len(combined_content)}")
    
    if len(combined_content) != original_base64_length:
        print(f"Error: Combined base64 length mismatch! Expected: {original_base64_length}, Got: {len(combined_content)}")
        return
    
    try:
        decoded_data = base64.b64decode(combined_content)
    except Exception as e:
        print(f"Error decoding base64 content: {e}")
        return
    
    combined_crc32 = calculate_crc32(decoded_data)
    print(f"Combined CRC32: {combined_crc32}")
    
    if combined_crc32 != original_crc32:
        print(f"Error: CRC32 mismatch! Original: {original_crc32}, Combined: {combined_crc32}")
        return
    
    with open(combined_file_path, 'wb') as combined_file:
        combined_file.write(decoded_data)
    
    print(f"Combined file saved to: {combined_file_path}")

def validate_base64(base64_file_path):
    with open(base64_file_path, 'r') as base64_file:
        base64_content = base64_file.read().replace('\n', '')  # Ensure no newlines in base64 content
    try:
        decoded_data = base64.b64decode(base64_content)
    except Exception as e:
        print(f"Error decoding base64 content: {e}")
        return False
    return True

def main():
    """
    original_file_path = 'video.mp4'
    base64_file_path = 'output/video64.txt'
    json_file_path = 'output/response.json'
    output_directory = os.path.dirname(base64_file_path)
    combined_file_path = 'output/new_video.mp4'
    """

    original_file_path = 'img.jpg'
    base64_file_path = 'output/img64.txt'
    json_file_path = 'output/response.json'
    output_directory = os.path.dirname(base64_file_path)
    combined_file_path = 'output/new_img.jpg'
    

    clear_output_directory(output_directory)
    
    original_crc32, original_base64_length = convert_file_to_base64(original_file_path, base64_file_path)
    print(f"Base64-encoded file saved to: {base64_file_path}")
    
    if not validate_base64(base64_file_path):
        print("Error: Base64 validation failed after initial encoding")
        return
    
    part_files = split_file_to_parts(base64_file_path, part_size_mb=5)
    print(f"Base64-encoded file split into 5MB parts and saved in the output directory.")
    print(f"The original base64-encoded file has been removed.")
    
    links = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for part_file in part_files:
            futures.append(executor.submit(upload_part, part_file))
        
        for future in as_completed(futures):
            link = future.result()
            if link:
                links.append(link)
    
    clear_output_directory(output_directory)
    
    save_links_to_json(links, json_file_path)
    print(f"All links have been saved to: {json_file_path}")

    download_and_save_parts(json_file_path, output_directory)
    print(f"All parts have been downloaded and saved in the output directory.")
    
    combine_parts_and_decode(output_directory, combined_file_path, original_crc32, original_base64_length)
    print(f"Combined file decoded and saved to: {combined_file_path}")

if __name__ == "__main__":
    main()
