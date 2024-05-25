const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const crc = require('crc');
const qs = require('qs');

const PASSWORD = 'your-secure-password';
const SALT = Buffer.alloc(16, 0); // Replace with a secure random salt

function deriveKey(password, salt) {
	return crypto.scryptSync(password, salt, 32);
}

function encrypt(data, key) {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
	return Buffer.concat([iv, encrypted]).toString('base64');
}

function decrypt(encryptedData, key) {
	const buffer = Buffer.from(encryptedData, 'base64');
	const iv = buffer.slice(0, 16);
	const encryptedText = buffer.slice(16);
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
	const decrypted = Buffer.concat([
		decipher.update(encryptedText),
		decipher.final(),
	]);
	return decrypted;
}

function calculateCRC32(data) {
	return crc.crc32(data).toString(16);
}

function convertFileToBase64InMemory(originalFilePath) {
	const fileContent = fs.readFileSync(originalFilePath);
	const key = deriveKey(PASSWORD, SALT);
	const encryptedContent = encrypt(fileContent, key);
	const base64EncodedData = Buffer.from(encryptedContent).toString('utf-8');
	const originalCRC32 = calculateCRC32(fileContent);
	console.log(`Original CRC32: ${originalCRC32}`);
	console.log(`Original file length: ${fileContent.length}`);
	console.log(`Encrypted data length: ${encryptedContent.length}`);
	return { base64EncodedData, originalCRC32 };
}

async function uploadPart(partContent) {
	const partCRC32 = calculateCRC32(Buffer.from(partContent));

	const data = {
		lang: 'text',
		text: partContent,
		expire: '-1',
		password: '',
		title: '',
	};

	try {
		const response = await axios.post(
			'https://pst.innomi.net/paste/new',
			qs.stringify(data),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);
		console.log(
			`Request to https://pst.innomi.net/paste/new with part content of length ${partContent.length}`
		);
		console.log(`Part CRC32 before upload: ${partCRC32}`);
		console.log(`Response Status Code: ${response.status}`);
		if (response.status === 200) {
			const title = response.data
				.match(/<title>(.*?)<\/title>/)[1]
				.split(' - ')[0];
			return title;
		} else {
			console.log(`Failed to upload part: ${response.status}`);
			return null;
		}
	} catch (error) {
		console.error(`Error uploading part: ${error}`);
		return null;
	}
}

async function main() {
  console.time('main');
	const originalFilePath = 'video.mp4';
	const base64FilePath = 'output/video64.txt';
	const jsonFilePath = 'output/response.json';
	const combinedFilePath = 'output/new_video.mp4';

	const { base64EncodedData, originalCRC32 } =
		convertFileToBase64InMemory(originalFilePath);
	console.log(`Total base64 content length: ${base64EncodedData.length}`);

	const partSize = 5 * 1024 * 1024; // 5 MB
	const partContents = [];
	for (let i = 0; i < base64EncodedData.length; i += partSize) {
		const partContent = base64EncodedData.slice(i, i + partSize);
		partContents.push(partContent);
	}
	console.log(`Split into ${partContents.length} parts`);

	const links = [];
	for (const partContent of partContents) {
		const link = await uploadPart(partContent);
		if (link) {
			links.push(link);
		}
	}

	fs.writeFileSync(jsonFilePath, JSON.stringify(links, null, 4));
	console.log(`All links have been saved to: ${jsonFilePath}`);

	const downloadedParts = [];
	for (const link of links) {
		const url = `https://pst.innomi.net/paste/${link}`;
		const response = await axios.get(url);
		if (response.status === 200) {
			const codeDivContent = response.data.match(
				/<div class="code" id="code">(.*?)<\/div>/
			)[1];
			downloadedParts.push(codeDivContent);
		}
	}

	const combinedBase64Content = downloadedParts.join('');
	console.log(`Total combined content length: ${combinedBase64Content.length}`);

	const key = deriveKey(PASSWORD, SALT);
	const decryptedData = decrypt(combinedBase64Content, key);
	console.log(`Decrypted data length: ${decryptedData.length}`);

	const combinedCRC32 = calculateCRC32(decryptedData);
	console.log(`Combined CRC32: ${combinedCRC32}`);

	if (combinedCRC32 !== originalCRC32) {
		console.log(
			`Error: CRC32 mismatch! Original: ${originalCRC32}, Combined: ${combinedCRC32}`
		);
		return;
	}

	fs.writeFileSync(combinedFilePath, decryptedData);
	console.log(`Combined file decoded and saved to: ${combinedFilePath}`);
  console.timeEnd('main');
}

main().catch(console.error);
