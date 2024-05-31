import React from 'react';
import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '@/components/ui/button';

function FileSelector({ setFiles }) {
	const handleSelectFiles = async () => {
		const selectedFiles = await open({ multiple: true });
		if (Array.isArray(selectedFiles)) {
			const newFiles = await Promise.all(
				selectedFiles.map(async (filePath) => {
					const { name, size } = await invoke('get_file_metadata', {
						filePath,
					});
					return {
						path: filePath,
						name,
						size,
					};
				})
			);
			setFiles((prevFiles) => [...prevFiles, ...newFiles]);
		}
	};

	return (
		<div>
			<Button onClick={handleSelectFiles}>Select Files</Button>
		</div>
	);
}

export default FileSelector;
