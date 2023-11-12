console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const path = require('path');
const express = require('express');
const {google} = require('googleapis');

const { doSetupAndLogin } = require('./googleSheetHelpers/setupGSO');
const { fetchInfoSheet, fetchConsentQuestions} = require('./googleSheetHelpers/infoConsentGSO');
const { updateStepWithText} = require('./googleSheetHelpers/participantLogGSO');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));


// SETUP //////////////////////////////////////////////////////////////////////

// Endpoint for fetching base experiment parameters
app.post('/api/doSetupAndLogin', async (req, res) => {
    try {
        const { mainSheetID, prolificID } = req.body; // Extract the mainSheetID from the request body
        const expParams = await doSetupAndLogin(mainSheetID, prolificID);
        res.json(expParams);
    } catch (error) {
        res.status(500).json({ message: 'Could not fetch base experiment parameters', error });
    }
});


// INFOCONSENT ////////////////////////////////////////////////////////////////

// Route for Fetching Markdown from 'infoSheet'
app.get('/api/infoSheet', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        console.log(mainSheetID)
        const htmlContent = await fetchInfoSheet(mainSheetID);
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ message: 'Could not load information sheet content', error });
    }
});

// Route for Fetching Consent Questions from 'consentQuestions'
app.get('/api/consentQuestions', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        const questions = await fetchConsentQuestions(mainSheetID);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Could not load consent questions', error });
    }
});


// PARTICIPANT LOG UPDATING////////////////////////////////////////////////////

// Endpoint for updating a step with input text
app.post('/api/updateStepWithText', async (req, res) => {
    try {
        const { mainSheetID, prolificID, stepNumber, inputText } = req.body; // Extract the parameters from the request body
        await updateStepWithText(mainSheetID, prolificID, stepNumber, inputText);
        res.status(200).json({ message: 'Step updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Could not update step with text', error: error.message });
    }
});


// START THE SERVER ///////////////////////////////////////////////////////////
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
});