import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import DevDrawer from '../components/DevDrawer';

import { Button } from '../components/ui/button';

function Homepage() {
	return (
		<>
			<div className="flex flex-col min-h-screen">
				<main className="flex-1">
					<Navbar />
				</main>
				<footer className="py-2">
					<DevDrawer />
				</footer>
			</div>
		</>
	);
}

export default Homepage;
