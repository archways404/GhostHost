# GhostHost

GhostHost is a Rust-based application designed to handle large file uploads by splitting them into smaller chunks, uploading each chunk to a remote server, and then providing the ability to rebuild the original files from the uploaded chunks. This ensures efficient and reliable file transfer, even for very large files. The application uses Tauri for the frontend, making it lightweight and easy to deploy.

## Features

- **Chunked File Uploads:** Splits large files into 1MB chunks and uploads each chunk individually.
- **Base64 Encoding:** Encodes file content in Base64 before upload for safer transmission.
- **Temporary Files:** Utilizes temporary files for intermediate storage during the upload process.
- **JSON Metadata Management:** Maintains metadata about the uploaded files in JSON format.
- **Rebuilding Files:** Supports downloading and rebuilding original files from uploaded chunks.
- **History Management:** Keeps a history of uploaded files and their metadata.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Rust installed on your machine. If not, you can install it from [here](https://www.rust-lang.org/tools/install).
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your operating system.
- Internet connection for downloading dependencies and uploading files.

## Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/yourusername/ghosthost.git
   cd ghosthost
   cd application
   ```

2. **Install Dependencies**

   ```sh
   npm install
   ```

## Usage

**Running the Application**

To start the application, use the following command:

  ```sh
  npm run tauri dev
  ```

**Building the Application**

To start the application, use the following command:

  ```sh
  npm run tauri build
  ```

## Contributing

Contributions are always welcome! If you have any suggestions or find a bug, please open an issue or a pull request.

1. Fork the Project

2. Create your Feature Branch ```(git checkout -b feature/AmazingFeature)```

3. Commit your Changes ```(git commit -m 'Add some AmazingFeature')```

4. Push to the Branch ```(git push origin feature/AmazingFeature)```

5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

[archways](mailto:archways@gmx.us)
[Git repository](https://github.com/archways404/GhostHost)