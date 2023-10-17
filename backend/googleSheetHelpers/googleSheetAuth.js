const { google } = require('googleapis');
const path = require('path');

const keyFile = '../../custompsych-2af53b8e5ef8.json';


async function getAuthenticatedClient() {

    try {
        const keyFilePath = path.resolve(__dirname, keyFile);
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const client = await auth.getClient();
        return google.sheets({ version: 'v4', auth: client });
    } catch (error) {
        console.error('Error during authentication:', error);
        throw error; // Rethrow the error to handle it in your route.
    }
}

module.exports = { getAuthenticatedClient };
