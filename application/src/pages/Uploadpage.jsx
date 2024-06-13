import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import DevDrawer from '../components/DevDrawer';

import { open } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

function Uploadpage() {
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [uploadStarted, setUploadStarted] = useState(false);
	const [progress, setProgress] = useState(0);
	const [code, setCode] = useState('');
	const [expire, setExpire] = useState('-1');

	const handleSelectFiles = async () => {
		setLoading(true);
		const selectedFiles = await open({ multiple: true });
		if (Array.isArray(selectedFiles)) {
			const newFiles = await Promise.all(
				selectedFiles.map(async (filePath) => {
					const { name, size } = await invoke('get_file_metadata', {
						filePath,
					});
					return {
						path: filePath,
						name,
						size,
					};
				})
			);
			setFiles((prevFiles) => [...prevFiles, ...newFiles]);
		}
		setLoading(false);
	};

	const handleDeleteFile = (filePath) => {
		setFiles((prevFiles) => prevFiles.filter((file) => file.path !== filePath));
	};

	const handleUploadFiles = async () => {
		setUploadStarted(true);
		setProgress(0);
		// Call the Tauri command to process files
		try {
			const response = await invoke('process_files', {
				filePaths: files.map((file) => file.path),
				expiration: expire,
			});
			console.log('Upload response:', response);
			setCode(response);
			// Update progress to 100% after successful upload
			setProgress(100);
		} catch (error) {
			console.error('Error uploading files:', error);
		}
	};

	const formatBytes = (bytes) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const totalSize = files.reduce((acc, file) => acc + file.size, 0);

	return (
		<>
			<div className="dark flex flex-col min-h-screen">
				<header className="flex-none">
					<Navbar />
				</header>
				<div className="flex-none p-4">
					<h1 className="text-4xl pt-2 font-bold text-center">Upload files</h1>
				</div>
				<main className="flex-1 flex flex-col items-center p-4">
					{!uploadStarted ? (
						<>
							{files.length > 0 && (
								<div className="w-full max-w-4xl">
									<ScrollArea className="h-[300px] w-full rounded-md p-1">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											{files.map((file, index) => (
												<div
													key={index}
													className="mb-1 flex justify-between items-center p-1 bg-slate-800 border rounded">
													<span>
														<strong>{file.name}</strong> (
														{formatBytes(file.size)})
													</span>
													<Button
														variant="outline"
														className="ml-4 bg-slate-800 hover:bg-red-500"
														onClick={() => handleDeleteFile(file.path)}>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
										</div>
									</ScrollArea>
								</div>
							)}
							<div className="flex space-x-4 mt-4">
								<Button
									onClick={handleSelectFiles}
									disabled={loading}>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Please wait
										</>
									) : (
										'Select Files'
									)}
								</Button>
								<Select onValueChange={(value) => setExpire(value)}>
									<SelectTrigger className="w-[100px]">
										<SelectValue placeholder="Expire" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="-1">Never</SelectItem>
										<SelectItem value="10m">10m</SelectItem>
										<SelectItem value="1h">1h</SelectItem>
										<SelectItem value="1d">1d</SelectItem>
										<SelectItem value="14d">14d</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{files.length > 0 && (
								<div className="mt-4">
									<h3 className="text-xl font-bold text-center">
										Total Size: {formatBytes(totalSize)}
									</h3>
									<Button
										onClick={handleUploadFiles}
										disabled={loading}
										className="mt-4">
										{loading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Please wait
											</>
										) : (
											'Upload Files'
										)}
									</Button>
								</div>
							)}
						</>
					) : (
						<>
							<div className="mt-20 mb-20">
								<p className="mb-4 text-center font-bold">Your code</p>
								{code ? (
									<p className="text-center text-2xl font-bold">{code}</p>
								) : (
									<Skeleton className="w-[200px] h-[20px] rounded-full" />
								)}
							</div>
							{code ? (
								<h3 className="text-xl mt-4 text-center">Upload complete!</h3>
							) : (
								<h3 className="text-xl font-bold mt-4 text-center">
									Uploading...
								</h3>
							)}

							<Progress
								value={progress}
								className="w-1/2 mt-4"
							/>
							<h3 className="text-xl mt-4 mb-4 text-center">
								Total Size:{' '}
								<span className="font-bold">{formatBytes(totalSize)}</span>
							</h3>
						</>
					)}
				</main>
				<footer className="flex-none py-2">
					<DevDrawer />
				</footer>
			</div>
		</>
	);
}

export default Uploadpage;
