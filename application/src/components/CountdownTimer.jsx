import React, { useState, useEffect } from 'react';

function CountdownTimer({ expiration, timestamp }) {
	const [timeRemaining, setTimeRemaining] = useState('');

	useEffect(() => {
		if (expiration === '-1') {
			setTimeRemaining('Does not expire');
			return;
		}

		const interval = setInterval(() => {
			const duration = parseDuration(expiration);
			if (duration === null) {
				setTimeRemaining('Invalid expiration');
				clearInterval(interval);
				return;
			}

			const expirationDate = new Date(new Date(timestamp).getTime() + duration);
			const now = new Date();

			const diff = expirationDate - now;

			if (diff <= 0) {
				setTimeRemaining('Expired');
				clearInterval(interval);
			} else {
				setTimeRemaining(formatTime(diff));
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [expiration, timestamp]);

	const parseDuration = (duration) => {
		if (!duration) return null;
		const value = parseInt(duration.slice(0, -1), 10);
		switch (duration.slice(-1)) {
			case 'm':
				return value * 60 * 1000;
			case 'h':
				return value * 60 * 60 * 1000;
			case 'd':
				return value * 24 * 60 * 60 * 1000;
			case '-':
				return Number.MAX_SAFE_INTEGER;
			default:
				return null;
		}
	};

	const formatTime = (milliseconds) => {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const days = Math.floor(totalSeconds / (24 * 60 * 60));
		const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
		const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
		const seconds = totalSeconds % 60;

		return `${days}d ${hours}h ${minutes}m ${seconds}s`;
	};

	return <div>{timeRemaining}</div>;
}

export default CountdownTimer;
