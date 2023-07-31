const axios = require('axios');
const fs = require('fs');

let anthropic_api_keys = [];

console.log('Enter 1 to input Anthropic keys manually.');
console.log('Enter 2 to read Anthropic keys from a key.txt.');

const readline = require("readline");
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question('', function(option) {
	if (option == '1') {
			console.log('\nEnter your Anthropic API keys (separated by newlines, press enter twice when done):');
			rl.on("line", function(line) {
		if (!line) {
	rl.close();
	return;
}
anthropic_api_keys.push(line.trim());
});
} else if (option == '2') {
	const fileName = 'keys.txt';
			console.log(`Attempting to read keys from ${fileName}`);
			const data = fs.readFileSync(fileName, 'utf8');
		anthropic_api_keys = data.split(/\r?\n/).filter(line => line.trim() !== '');
		console.log(`Successfully read ${anthropic_api_keys.length} keys from ${fileName}`);
	rl.close();
}
});

rl.on("close", async function() {

const data = `
	{
	"model": "claude-1",
	"prompt": "\\n\\nHuman: Hello, world!\\n\\nAssistant:",
	"max_tokens_to_sample": 256,
	"stream": false
}
`;

let valid_keys = [];
let revoked_keys = [];
let invalid_keys= [];


for (const api_key of anthropic_api_keys) {
	console.log(`Testing API key ${api_key}...`);

try {
	const response = await axios.post(
		'https://api.anthropic.com/v1/complete',
		JSON.parse(data),
		{ headers: { 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'x-api-key': api_key } }
	);

valid_keys.push(api_key);

console.log(`Response data :${response.data}`);
} catch (error) {

if (error.response && error.response.hasOwnProperty('data') && error.response['data']['error'] &&
	error.response['data']['error']['type'] === "authentication_error") {

if (error.response['data']['error']['message'] === "Invalid API Key") {
	invalid_keys.push(api_key);
} else if (error.response['data']['error']['message'] === "This account is not authorized to use the API. Please check with Anthropic support if you think this is in error.") {
	revoked_keys.push(api_key);
} else {
	valid_keys.push(api_key);
			}
		}
	}
}

fs.writeFileSync('./validclaude.txt',valid_keys.join("\n"),'utf8');
fs.writeFileSync('./revokedclaude.txt',revoked_keys.join("\n"), 'utf8');

console.log('\nSaved valid and revoked keys to Validclaude.txt and Revokedclaude.txt respectively.');

console.log("\nValid API keys:");
	valid_keys.forEach(valid_key => {console.log(valid_key);});

console.log("\nRevoked API keys:");
	revoked_keys.forEach(revoked_key => {console.log(revoked_key);});

console.log("\nInvalid API keys:")
	invalid_keys.forEach(invalid_key=>{console.log(invalid_key)});
})