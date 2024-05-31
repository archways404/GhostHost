import React from "react";
import ReactDOM from "react-dom/client";
import Homepage from './pages/Homepage';
import Testpage from './pages/Testpage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Router>
			<Routes>
				<Route
					path="/"
					element={<Homepage />}
				/>
				<Route
					path="/Test"
					element={<Testpage />}
				/>
				{/* Add more routes as needed */}
			</Routes>
		</Router>
	</React.StrictMode>
);
