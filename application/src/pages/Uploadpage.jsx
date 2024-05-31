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

function Uploadpage() {
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(false);

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
					{files.length > 0 && (
						<div className="w-full max-w-4xl">
							<ScrollArea className="h-[300px] w-[full] rounded-md p-1">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
									{files.map((file, index) => (
										<div
											key={index}
											className="mb-1 flex justify-between items-center p-1 bg-slate-800 border rounded">
											<span>
												<strong>{file.name}</strong> ({formatBytes(file.size)})
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
					<div className="flex-1 flex flex-col justify-end items-center w-full">
						<div className="w-full max-w-4xl flex flex-col items-center space-y-4">
							<div className="flex space-x-4">
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
								<Select>
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
								<div>
									<h3 className="text-xl font-bold mt-4 text-center">
										Total Size: {formatBytes(totalSize)}
									</h3>
									<Button
										onClick={handleSelectFiles}
										disabled={loading}>
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
							<Progress
								value={33}
								className="w-full"
							/>
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

export default Uploadpage;
