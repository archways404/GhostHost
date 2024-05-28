import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function RebuildFiles({ setStatusMessage }) {
	const [rebuildTitle, setRebuildTitle] = useState('');
	const [history, setHistory] = useState([]);

	useEffect(() => {
		const loadHistory = async () => {
			try {
				const historyContent = await invoke('get_history');
				const parsedHistory = JSON.parse(historyContent);
				setHistory(parsedHistory);
			} catch (error) {
				console.error('Failed to load history:', error);
			}
		};

		loadHistory();
	}, []);

	const handleRebuild = (title) => {
		setRebuildTitle(title);
		setStatusMessage('Rebuilding files...'); // Set status message before rebuilding
		invoke('rebuild_files', { title })
			.then(() => {
				console.log(`Rebuilding files for title: ${title}`);
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
			<button onClick={() => handleRebuild(rebuildTitle)}>Rebuild Files</button>
			<div className="history-cards">
				{history.map((entry, index) => (
					<div
						key={index}
						className="card"
						onClick={() => handleRebuild(entry.title)}>
						<h3>{entry.title}</h3>
						<ul>
							{entry.file_names.map((fileName, idx) => (
								<li key={idx}>{fileName}</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
}

export default RebuildFiles;
