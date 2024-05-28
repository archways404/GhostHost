import React from 'react';

function FileList({ files, handleRemoveFile }) {
	return (
		<div className="file-list">
			<h2>Selected Files</h2>
			<ul>
				{files.map((file, index) => (
					<li key={index}>
						<div>
							{file.name} -{' '}
							{file.size
								? (file.size / 1024).toFixed(2) + ' KB'
								: 'Size not available'}
							<br />
							Full Path: {file.path}
						</div>
						<button onClick={() => handleRemoveFile(file.path)}>Remove</button>
					</li>
				))}
			</ul>
		</div>
	);
}

export default FileList;
