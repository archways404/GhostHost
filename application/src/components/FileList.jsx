import React from 'react';

function formatSize(sizeInBytes) {
	if (sizeInBytes >= 1024 ** 3) {
		return (sizeInBytes / 1024 ** 3).toFixed(2) + ' GB';
	} else if (sizeInBytes >= 1024 ** 2) {
		return (sizeInBytes / 1024 ** 2).toFixed(2) + ' MB';
	} else {
		return (sizeInBytes / 1024).toFixed(2) + ' KB';
	}
}

function FileList({ files, handleRemoveFile }) {
	// Calculate total file size in bytes
	const totalSizeBytes = files.reduce((total, file) => total + file.size, 0);

	return (
		<div className="file-list">
			<h2>Selected Files</h2>
			<ul>
				{files.map((file, index) => (
					<li key={index}>
						<div>
							{file.name} -{' '}
							{file.size ? formatSize(file.size) : 'Size not available'}
							<br />
						</div>
						<button onClick={() => handleRemoveFile(file.path)}>Remove</button>
					</li>
				))}
			</ul>
			<div className="total-size">
				<strong>Total Size: {formatSize(totalSizeBytes)}</strong>
			</div>
		</div>
	);
}

export default FileList;
