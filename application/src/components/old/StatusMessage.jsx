import React from 'react';

function StatusMessage({ statusMessage, uploadTitle }) {
	return (
		statusMessage && (
			<div>
				<h2>Status</h2>
				<p>{statusMessage}</p>
				<p>{uploadTitle}</p>
			</div>
		)
	);
}

export default StatusMessage;
