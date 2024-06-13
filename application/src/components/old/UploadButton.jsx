import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

function UploadButton({ files, setResponseTitle, setStatusMessage }) {
	const [expiration, setExpiration] = useState('-1'); // Default to 'forever'

	const handleUpload = () => {
		const filePaths = files.map((file) => file.path);
		setStatusMessage('Uploading files...');
		invoke('process_files', { filePaths, expiration })
			.then((response) => {
				console.log(response);
				setResponseTitle(response);
				setStatusMessage('Files uploaded successfully!');
			})
			.catch((error) => {
				console.error(error);
				setStatusMessage('Failed to upload files.');
			});
	};

	const handleSelectExpiration = (value) => {
		setExpiration(value);
	};

	return (
		<div>
			<div>
				<Select onValueChange={handleSelectExpiration}>
					<SelectTrigger className="w-[180px] text-white bg-slate-700 hover:bg-slate-600">
						<SelectValue placeholder="Expiration" />
					</SelectTrigger>
					<SelectContent className="bg-slate-800 text-white">
						<SelectItem
							value="-1"
							className="hover:bg-slate-600">
							Forever
						</SelectItem>
						<SelectItem
							value="10m"
							className="hover:bg-slate-600">
							10 Minutes
						</SelectItem>
						<SelectItem
							value="1h"
							className="hover:bg-slate-600">
							1 Hour
						</SelectItem>
						<SelectItem
							value="1d"
							className="hover:bg-slate-600">
							1 Day
						</SelectItem>
						<SelectItem
							value="14d"
							className="hover:bg-slate-600">
							14 Days
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<button
				onClick={handleUpload}
				className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
				Upload Files
			</button>
		</div>
	);
}

export default UploadButton;
