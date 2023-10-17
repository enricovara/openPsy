// googleSheetOperations.js

const { getAuthenticatedClient } = require('./googleSheetAuth');
const marked = require('marked');

/**
 * FESTCHES CONSENT DATA for a given prolificId from Milestones tab
 *
 * @returns {Promise<object>} - entry corresponding to prolificId or null.
 */
async function fetchConsentLogs(prolificId) {
    const googleSheets = await getAuthenticatedClient();
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: 'participantLog!B6:B'
    });

    const rows = response.data.values || [];
    const entry = rows.find(row => row[0] === prolificId);
    return entry ? { id: entry[0], status: entry[1], datetime: entry[2] } : null;
}



/**
 * APPENDS new CONSENT entry
 *
 * @param {string} prolificId
 * @param {string} status
 * @param {string} datetime
 */
async function appendConsentLog(prolificId, status, datetime) {
    const googleSheets = await getAuthenticatedClient();
    await googleSheets.spreadsheets.values.append({
        spreadsheetId: mainSheetID,
        range: 'participantLog!B6:B',
        valueInputOption: 'RAW',
        resource: {
            values: [[prolificId, status, datetime]]
        }
    });
}


/**
 * Fetches data from tab named 'infoSheet' and converts it into Markdown format.
 * 
 * @returns {Promise<string>} - HTML content converted from Markdown.
 */
async function fetchInfoSheet() {
    const googleSheets = await getAuthenticatedClient();
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: 'infoSheet!A3:B30'
    });
    const rows = response.data.values || [];
    let markdownText = '';
    rows.forEach(row => {
        if (row.length >= 2) {
            const title = row[0].trim();
            const content = row[1].trim();
            markdownText += `## ${title}\n\n${content}\n\n`;
        }
    });

    return marked.marked(markdownText);
} 




/**
 * Fetches consent questions from tab named 'consentQs' and returns them as an array of strings.
 * 
 * @returns {Promise<string[]>} - Array of consent questions as strings.
 */
async function fetchConsentQuestions() {
    const googleSheets = await getAuthenticatedClient();
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: 'consentQs!A3:B30'
    });

    const rows = response.data.values || [];
    const consentQuestions = rows.map(row => row[0].trim());

    return consentQuestions;
}



/**
 * Fetches video data for a given username from Sheet1
 *
 * @param {string} userName - The username to fetch videos for
 * @returns {Promise<string[]>} - Array of videos or empty array.
 */
async function fetchUserVideos(userName) {
    const googleSheets = await getAuthenticatedClient();
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId: "1xkA57uRsBJcEPQFqOxwL6VeqnukOy4Wx0HvVNafqw8g",
        range: 'Sheet1'
    });
    const rows = response.data.values || [];
    const headers = rows[0];
    const userColumnIndex = headers.indexOf(userName);
    const userVideos = userColumnIndex >= 0 ? rows.slice(1).map(row => row[userColumnIndex]).filter(Boolean) : [];

    return userVideos;
}



module.exports = { fetchInfoSheet, fetchConsentQuestions, fetchConsentLogs, appendConsentLog, fetchUserVideos };
