const path = require('path');
const express = require('express');
const {google} = require('googleapis');

const { fetchInfoSheet, fetchConsentQuestions, fetchConsentLogs, appendConsentLog } = require('./googleSheetHelpers/googleSheetOperations');
const keyFile = require('../custompsych-88cecf1d90b5.json');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));


// LOGIN AND Consent

// Route for Fetching Markdown from 'infoSheet'
app.get('/api/infoSheet', async (req, res) => {
    try {
        const htmlContent = await fetchInfoSheet();
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ message: 'Could not load information sheet content', error });
    }
});

// Route for Fetching Consent Questions from 'consentQuestions'
app.get('/api/consentQuestions', async (req, res) => {
    try {
        const questions = await fetchConsentQuestions();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Could not load consent questions', error });
    }
});

// Route for Fetching Consent Logs from 'participantLog'
app.get('/api/getConsentLogs/:prolificID/:mainSheetID', async (req, res) => {
    try {
        const prolificID = req.params.prolificID;
        const mainSheetID = req.params.mainSheetID;
        const data = await fetchConsentLogs(prolificID, mainSheetID);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Could not load consent logs', error });
    }
});

// Route for Posting Consent Logs to 'consentLogs'
app.post('/api/appendConsentLog', async (req, res) => {
    try {
        const {prolificId, status, datetime} = req.body;
        await appendConsentLog(prolificId, status, datetime);
        //res.sendStatus(200);
    } catch (error) {
        res.status(500).json({ message: 'Could not append consent log', error });
    }
});





app.get('/api/videos/:username', async (req, res) => {
    try {
        const userName = req.params.username;
        const userVideos = await fetchUserVideos(userName);
        
        if (userVideos.length === 0) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.json(userVideos);
        }
    } catch (error) {
        res.status(500).json({ message: 'Could not load user videos', error });
    }
});



// Route for Fetching Videos by Username
/*
app.get('/api/videos/:username', async (req, res) => {
    const userName = req.params.username;
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFile,//path.join(__dirname, process.env.KEY_FILE),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({version: 'v4', auth: client});
    const spreadsheetId = MAIN_SHEET_ID;
    const response = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: 'Sheet1'
    });
    const rows = response.data.values;
    const headers = rows[0];
    const userColumnIndex = headers.indexOf(userName);
    const userVideos = userColumnIndex >= 0 ? rows.slice(1).map(row => row[userColumnIndex]).filter(Boolean) : [];

    if(userVideos.length === 0) {
        res.status(404).json({message: 'User not found'});
    } else {
        res.send(userVideos);
    }
});

// Route for Appending Selection to Sheet
app.post('/api/selection', async (req, res) => {
    const {color, letter, number, userName} = req.body;
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFile,//path.join(__dirname, process.env.KEY_FILE),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({version: 'v4', auth: client});
    const spreadsheetId = MAIN_SHEET_ID;
    await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: 'Sheet1',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[new Date().toLocaleString(), userName, color, letter, number]]
        }
    });
    res.sendStatus(200);
});
*/
// Start the Server
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
