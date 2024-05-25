import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

function App() {
	const [files, setFiles] = useState([]);
	const [responseTitle, setResponseTitle] = useState('');
	const [rebuildTitle, setRebuildTitle] = useState('');

	const onDrop = useCallback((acceptedFiles) => {
		const newFiles = acceptedFiles.map((file) => ({
			path: file.path,
			name: file.name,
			size: file.size,
		}));
		setFiles((prevFiles) => [...prevFiles, ...newFiles]);
	}, []);

	const { getRootProps, getInputProps } = useDropzone({ onDrop });

	const handleUpload = () => {
		const filePaths = files.map((file) => file.path);
		console.log(filePaths); // Log file paths to verify
		invoke('process_files', { filePaths })
			.then((response) => {
				console.log(response);
				setResponseTitle(response);
			})
			.catch((error) => console.error(error));
	};

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

	const handleRebuild = () => {
		invoke('rebuild_files', { title: rebuildTitle })
			.then(() => {
				console.log(`Rebuilding files for title: ${rebuildTitle}`);
			})
			.catch((error) => console.error(error));
	};

	return (
		<div className="App">
			<h1>File Upload</h1>
			<div
				{...getRootProps()}
				style={{
					border: '2px dashed #888',
					padding: '20px',
					textAlign: 'center',
				}}>
				<input {...getInputProps()} />
				<p>Drag & drop a file here, or click to select a file</p>
			</div>
			<button onClick={handleSelectFiles}>Select Files</button>
			<div>
				<h2>Selected Files</h2>
				<ul>
					{files.map((file, index) => (
						<li key={index}>
							{file.name} -{' '}
							{file.size
								? (file.size / 1024).toFixed(2) + ' KB'
								: 'Size not available'}
							<br />
							Full Path: {file.path}
						</li>
					))}
				</ul>
			</div>
			<button
				onClick={handleUpload}
				style={{ marginTop: '20px', padding: '10px 20px' }}>
				Upload Files
			</button>
			{responseTitle && (
				<div>
					<h2>Response Title</h2>
					<p>{responseTitle}</p>
				</div>
			)}
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
		</div>
	);
}

export default App;
