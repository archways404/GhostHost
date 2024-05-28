import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function RebuildFiles({ setStatusMessage }) {
	const [rebuildTitle, setRebuildTitle] = useState('');

	const handleRebuild = () => {
		setStatusMessage('Rebuilding files...'); // Set status message before rebuilding
		invoke('rebuild_files', { title: rebuildTitle })
			.then(() => {
				console.log(`Rebuilding files for title: ${rebuildTitle}`);
				setStatusMessage('Files rebuilt successfully!'); // Set status message after successful rebuild
			})
			.catch((error) => {
				console.error(error);
				setStatusMessage('Failed to rebuild files.'); // Set status message in case of error
			});
	};

	return (
		<div style={{ marginTop: '20px' }}>
			<h2>Rebuild Files</h2>
			<input
				type="text"
				value={rebuildTitle}
				onChange={(e) => setRebuildTitle(e.target.value)}
				placeholder="Enter response title"
			/>
			<button onClick={handleRebuild}>Rebuild Files</button>
		</div>
	);
}

export default RebuildFiles;
