const { google } = require('googleapis');
const path = require('path');


async function getAuthenticatedClient() {

    try {
        const keyFilePath = path.resolve(process.env.KEY_FILE);
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


async function getAuthenticatedDriveClient() {
    try {
        const keyFilePath = path.resolve(process.env.KEY_FILE);
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            // Include the scopes for both Google Sheets and Google Drive
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        });
        const client = await auth.getClient();
        return google.drive({ version: 'v3', auth: client });
    } catch (error) {
        console.error('Error during authentication:', error);
        throw error; // Rethrow the error to handle it in your application.
    }
}


module.exports = { getAuthenticatedClient, getAuthenticatedDriveClient };
