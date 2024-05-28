import React from 'react';
import { open } from '@tauri-apps/api/dialog';

function FileSelector({ setFiles }) {
	const handleSelectFiles = async () => {
		const selectedFiles = await open({ multiple: true });
		if (Array.isArray(selectedFiles)) {
			const newFiles = selectedFiles.map((filePath) => ({
				path: filePath,
				name: filePath.split('/').pop(), // Extract the file name
				size: 0, // Optionally, you can fetch the file size
			}));
			setFiles((prevFiles) => [...prevFiles, ...newFiles]);
		}
	};

	return (
		<div>
			<button onClick={handleSelectFiles}>Select Files</button>
		</div>
	);
}

export default FileSelector;
