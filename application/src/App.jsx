import React, { useState } from 'react';
import FileSelector from './components/FileSelector';
import FileList from './components/FileList';
import UploadButton from './components/UploadButton';
import RebuildFiles from './components/RebuildFiles';
import StatusMessage from './components/StatusMessage';
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
			<button onClick={() => setView('upload')}>Upload File(s)</button>
			<button onClick={() => setView('rebuild')}>Rebuild File(s)</button>
		</div>
	);

	const renderUploadScreen = () => (
		<div className="upload-screen">
			<button
				className="back-button"
				onClick={() => setView('home')}>
				Back to Home
			</button>
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
			<button
				className="back-button"
				onClick={() => setView('home')}>
				Back to Home
			</button>
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
