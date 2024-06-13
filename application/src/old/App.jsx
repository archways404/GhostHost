import React, { useState } from 'react';
import FileSelector from '../components/old/FileSelector';
import FileList from '../components/old/FileList';
import UploadButton from '../components/old/UploadButton';
import RebuildFiles from '../components/old/RebuildFiles';
import StatusMessage from '../components/old/StatusMessage';
import { Button } from '@/components/ui/button';
import './App.css'; // Import CSS

function App() {
	const [files, setFiles] = useState([]);
	const [responseTitle, setResponseTitle] = useState('');
	const [statusMessage, setStatusMessage] = useState('');
	const [view, setView] = useState('home'); // Home, upload, rebuild

	const handleRemoveFile = (filePath) => {
		setFiles((prevFiles) => prevFiles.filter((file) => file.path !== filePath));
	};

	const renderHomeScreen = () => (
		<div className="home-screen">
			<h1 className="cool-title">GhostHost</h1>
			<Button onClick={() => setView('upload')}>Upload File(s)</Button>
			<Button onClick={() => setView('rebuild')}>Rebuild File(s)</Button>
		</div>
	);

	const renderUploadScreen = () => (
		<div className="upload-screen">
			<Button
				className="back-button"
				onClick={() => setView('home')}>
				Back to Home
			</Button>
			<h1>File Upload</h1>
			<div className="container">
				<div className="section">
					<FileList
						files={files}
						handleRemoveFile={handleRemoveFile}
					/>
					{files.length > 0 && (
						<UploadButton
							files={files}
							setResponseTitle={setResponseTitle}
							setStatusMessage={setStatusMessage}
						/>
					)}
					<FileSelector setFiles={setFiles} />
				</div>
			</div>
			<StatusMessage
				statusMessage={statusMessage}
				uploadTitle={responseTitle}
			/>
		</div>
	);

	const renderRebuildScreen = () => (
		<div className="rebuild-screen">
			<Button
				className="back-button"
				onClick={() => setView('home')}>
				Back to Home
			</Button>
			<h1>Rebuild Files</h1>
			<div className="container">
				<div className="section">
					<RebuildFiles setStatusMessage={setStatusMessage} />
				</div>
			</div>
			<StatusMessage statusMessage={statusMessage} />
		</div>
	);

	return (
		<div className="App">
			{view === 'home' && renderHomeScreen()}
			{view === 'upload' && renderUploadScreen()}
			{view === 'rebuild' && renderRebuildScreen()}
		</div>
	);
}

export default App;
