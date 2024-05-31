import React from 'react';
import Navbar from '../components/Navbar';
import DevDrawer from '../components/DevDrawer';
import Acc from '../components/Acc';

function Homepage() {
	return (
		<>
			<div className="dark flex flex-col min-h-screen">
				<header className="flex-none">
					<Navbar />
				</header>
				<div className="flex-none p-4">
					<h1 className="text-4xl pt-24 font-bold text-center">
						Welcome to GhostHost
					</h1>
					<p className="text-md pt-5 px-28">
						<span className="font-bold">GhostHost</span> is a simple and
						easy-to-use file hosting service. Upload your files and share them
						with others. No registration required.
					</p>
				</div>
				<main className="flex-1 flex justify-center items-center p-4">
					<div className="w-full mx-10 max-w-4xl">
						<Acc />
					</div>
				</main>
				<footer className="flex-none py-2">
					<DevDrawer />
				</footer>
			</div>
		</>
	);
}

export default Homepage;
