import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function UploadButton({ files, setResponseTitle, setStatusMessage }) {
	const [expiration, setExpiration] = useState('-1'); // Default to 'forever'

	const handleUpload = () => {
		const filePaths = files.map((file) => file.path);
		setStatusMessage('Uploading files...');
		invoke('process_files', { filePaths, expiration })
			.then((response) => {
				setResponseTitle(response);
				setStatusMessage('Files uploaded successfully!');
			})
			.catch((error) => {
				console.error(error);
				setStatusMessage('Failed to upload files.');
			});
	};

	return (
		<div>
			<div>
				<label htmlFor="expiration">Select Expiration Time:</label>
				<select
					id="expiration"
					value={expiration}
					onChange={(e) => setExpiration(e.target.value)}>
					<option value="-1">Forever</option>
					<option value="10m">10 Minutes</option>
					<option value="1h">1 Hour</option>
					<option value="1d">1 Day</option>
					<option value="14d">14 Days</option>
				</select>
			</div>
			<button onClick={handleUpload}>Upload Files</button>
		</div>
	);
}

export default UploadButton;
