import React from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function UploadButton({ files, setResponseTitle, setStatusMessage }) {
	const handleUpload = () => {
		const filePaths = files.map((file) => file.path);
		console.log(filePaths); // Log file paths to verify
		setStatusMessage('Uploading files...'); // Set status message before uploading
		invoke('process_files', { filePaths })
			.then((response) => {
				console.log(response);
				setResponseTitle(response);
				setStatusMessage('Files uploaded successfully!'); // Set status message after successful upload
			})
			.catch((error) => {
				console.error(error);
				setStatusMessage('Failed to upload files.'); // Set status message in case of error
			});
	};

	return (
		<button
			onClick={handleUpload}
			style={{ marginTop: '20px', padding: '10px 20px' }}>
			Upload Files
		</button>
	);
}

export default UploadButton;
