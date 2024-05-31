import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DevDrawer from '../components/DevDrawer';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import CountdownTimer from '../components/CountdownTimer';

function Downloadpage() {
	const [rebuildTitle, setRebuildTitle] = useState('');
	const [history, setHistory] = useState([]);
	const [statusMessage, setStatusMessage] = useState('');

	const loadHistory = async () => {
		try {
			const historyContent = await invoke('get_history');
			const parsedHistory = JSON.parse(historyContent);
			setHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
		} catch (error) {
			console.error('Failed to load history:', error);
			setHistory([]); // Ensure history is set to an empty array on error
		}
	};

	useEffect(() => {
		loadHistory();
	}, []);

	const handleRebuild = (title) => {
		setRebuildTitle(title);
		setStatusMessage('Rebuilding files...');
		invoke('rebuild_files', { title })
			.then(() => {
				console.log(`Rebuilding files for title: ${title}`);
				setStatusMessage('Files rebuilt successfully!');
			})
			.catch((error) => {
				console.error(error);
				setStatusMessage('Failed to rebuild files.');
			});
	};

	const handleCopy = async (event, title) => {
		event.stopPropagation();
		try {
			await navigator.clipboard.writeText(title);
			alert('ID copied to clipboard');
		} catch (error) {
			console.error('Failed to copy ID:', error);
			alert('Failed to copy ID');
		}
	};

	const isExpired = (expiration, timestamp) => {
		if (!expiration || expiration === '-1') return false;
		const expirationDuration = parseDuration(expiration);
		if (expirationDuration === null) return true;
		const expirationDate = new Date(
			new Date(timestamp).getTime() + expirationDuration
		);
		return expirationDate <= new Date();
	};

	const parseDuration = (duration) => {
		if (!duration) return null;
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
		<>
			<div className="dark flex flex-col min-h-screen">
				<header className="flex-none">
					<Navbar />
				</header>
				<div className="flex-none p-4">
					<h1 className="text-4xl pt-2 font-bold text-center">
						Download and Rebuild Files
					</h1>
				</div>
				<main className="flex-1 flex flex-col items-center p-4">
					<div className="w-full max-w-2xl mt-4">
						<div className="flex justify-center mb-2">
							<input
								type="text"
								value={rebuildTitle}
								onChange={(e) => setRebuildTitle(e.target.value)}
								placeholder="Enter code"
								className="p-2 border rounded w-1/2 bg-black text-white"
							/>
							<Button
								onClick={() => handleRebuild(rebuildTitle)}
								className="ml-2">
								Download
							</Button>
						</div>
						{statusMessage && (
							<p className="mt-2 text-center">{statusMessage}</p>
						)}
						<div className="history-cards mt-4 w-full">
							<ScrollArea className="h-[400px] w-full rounded-md p-1">
								{history.length > 0 ? (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										{history.map((entry, index) => (
											<div
												key={index}
												className={`card ${
													isExpired(entry.expiration, entry.timestamp)
														? 'expired'
														: ''
												} p-4 mb-2 border rounded`}
												onClick={() =>
													!isExpired(entry.expiration, entry.timestamp) &&
													handleRebuild(entry.title)
												}
												style={{
													cursor: isExpired(entry.expiration, entry.timestamp)
														? 'not-allowed'
														: 'pointer',
												}}>
												<h3 className="font-bold">{entry.title}</h3>
												<ul className="mb-2">
													{entry.file_names.map((fileName, idx) => (
														<li key={idx}>{fileName}</li>
													))}
												</ul>
												<CountdownTimer
													expiration={entry.expiration}
													timestamp={entry.timestamp}
													entryId={entry.id}
													onHistoryUpdate={loadHistory}
												/>
												<Button
													onClick={(event) => handleCopy(event, entry.title)}
													className="mt-2">
													Copy ID
												</Button>
											</div>
										))}
									</div>
								) : (
									<p>No history available.</p>
								)}
							</ScrollArea>
						</div>
					</div>
				</main>
				<footer className="flex-none py-2">
					<DevDrawer />
				</footer>
			</div>
		</>
	);
}

export default Downloadpage;
