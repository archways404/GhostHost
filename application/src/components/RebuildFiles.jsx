import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import CountdownTimer from './CountdownTimer';

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

	const handleCopy = async (event, title) => {
		event.stopPropagation(); // Prevent the card click event from being triggered
		try {
			await navigator.clipboard.writeText(title);
			alert('ID copied to clipboard');
		} catch (error) {
			console.error('Failed to copy ID:', error);
			alert('Failed to copy ID');
		}
	};

	const isExpired = (expiration, timestamp) => {
		if (expiration === '-1') return false;

		const expirationDuration = parseDuration(expiration);
		if (expirationDuration === null) return true;

		const expirationDate = new Date(
			new Date(timestamp).getTime() + expirationDuration
		);
		return expirationDate <= new Date();
	};

	const parseDuration = (duration) => {
		const value = parseInt(duration.slice(0, -1), 10);
		switch (duration.slice(-1)) {
			case 'm':
				return value * 60 * 1000;
			case 'h':
				return value * 60 * 60 * 1000;
			case 'd':
				return value * 24 * 60 * 60 * 1000;
			case '-':
				return Number.MAX_SAFE_INTEGER;
			default:
				return null;
		}
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
						className={`card ${
							isExpired(entry.expiration, entry.timestamp) ? 'expired' : ''
						}`}
						onClick={() =>
							!isExpired(entry.expiration, entry.timestamp) &&
							handleRebuild(entry.title)
						}
						style={{
							cursor: isExpired(entry.expiration, entry.timestamp)
								? 'not-allowed'
								: 'pointer',
						}}>
						<h3>{entry.title}</h3>
						<ul>
							{entry.file_names.map((fileName, idx) => (
								<li key={idx}>{fileName}</li>
							))}
						</ul>
						<CountdownTimer
							expiration={entry.expiration}
							timestamp={entry.timestamp}
						/>
						<button onClick={(event) => handleCopy(event, entry.title)}>
							Copy ID
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

export default RebuildFiles;
