console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const path = require('path');
const express = require('express');
const {google} = require('googleapis');

const { doSetupAndLogin } = require('./googleSheetHelpers/01_setupGSO');
const { getMDtext, fetchQuestionsChoicesAnswer } = require('./googleSheetHelpers/02_formsGSO');
const { updateStepWithText, generalNewLineUpdate} = require('./googleSheetHelpers/10_writingGSO');
const { fetchBlockParams, checkinOrConfirmBlock, clearOldCheckouts} = require('./googleSheetHelpers/03_simpleBlockGSO');

const { parseUserAgent } = require('./utils');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));


// SETUP //////////////////////////////////////////////////////////////////////

// Endpoint for fetching base experiment parameters and language strings
app.post('/api/doSetupAndLogin', async (req, res) => {
    try {
        const { mainSheetID, prolificID, language } = req.body; // Extract mainSheetID, prolificID, and language from the request body
        const userAgent = req.headers['user-agent'];
        const result = await doSetupAndLogin(mainSheetID, prolificID, userAgent, language); // result contains expParams and STR
        res.json(result); // Send expParams and STR
    } catch (error) {
        res.status(500).json({ message: 'Could not fetch experiment parameters and language strings', error });
    }
});



// INFOCONSENT ////////////////////////////////////////////////////////////////

// Route for Fetching Markdown from 'infoSheet'
app.get('/api/getMDtext', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        const tabName = req.query.tabName; // Extract the tabName from the query parameters
        const htmlContent = await getMDtext(mainSheetID, tabName);
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ message: 'Could not load information sheet content', error });
    }
});

// Route for Fetching Questions (Yes/No, MCQs) based on form type
app.get('/api/questions', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        const formType = req.query.formType; // Extract the form type (e.g., 'consent', 'screening', 'miscDemoQA')

        // Validate formType parameter
        if (!["consent", "screening", "miscDemo"].includes(formType)) {
            return res.status(400).json({ message: 'Invalid formType parameter' });
        }

        const questionData = await fetchQuestionsChoicesAnswer(mainSheetID, formType);
        res.json(questionData);
    } catch (error) {
        res.status(500).json({ message: 'Could not load questions', error });
    }
});



// PARTICIPANT LOG UPDATING////////////////////////////////////////////////////

// Endpoint for printing a line or lines of data to DB
app.post('/api/generalNewLineUpdate', async (req, res) => {
    try {
        const { mainSheetID, sheetTab, version, prolificID, dateTime, rowDataList } = req.body; // Extract the parameters from the request body
        // note: listOfStrToSave can be an array of strings or an array of string arrays to be saved
        //console.log(req.body)
        //console.log(mainSheetID, sheetTab, version, prolificID, dateTime, rowDataList)
        await generalNewLineUpdate(mainSheetID, sheetTab, version, prolificID, dateTime, rowDataList);
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Could not update step with text', error: error.message });
    }
});


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


// SIMPLEBLOCK ////////////////////////////////////////////////////////////////

// Endpoint for fetching block parameters and media links for the Simple Block
app.get('/api/simpleBlock', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        const prolificID = req.query.prolificID; // Extract the prolificID from the query parameters
        const version = req.query.version; // Extract the block version from the query parameters

        // Fetch block parameters and drive folder contents
        const blockParams = await fetchBlockParams(mainSheetID, prolificID, version);

        res.json(blockParams); // Respond with all block parameters and drive folder contents
    } catch (error) {
        res.status(500).json({ message: 'Error fetching block parameters and media links', error: error.message });
    }
});

// Endpoint for checking in a block
app.post('/api/checkinOrConfirmBlock', async (req, res) => {
    try {
        const { mainSheetID, version, prolificID, reservedCell, actionType } = req.body; // Extract the parameters from the request body
        await checkinOrConfirmBlock(mainSheetID, version, prolificID, reservedCell, actionType);
        res.status(200).json({ message: 'Block checked in successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Could not check in block', error: error.message });
    }
});

// Endpoint for clearing out old checked-in blocks
app.get('/api/clearOldCheckouts', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        const version = req.query.version; // Extract the block version from the query parameters
        
        await clearOldCheckouts(mainSheetID, version);
        res.status(200).json({ message: 'Block clearing in successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Could not clear blocks', error: error.message });
    }
});


// ERROR LOGGING ///////////////////////////////////////////////////////////

app.post('/api/logError', (req, res) => {
    const errorData = req.body;
    const userAgent = req.headers['user-agent'];
    const userAgentReadable = parseUserAgent(userAgent); // Ensure this function returns the expected format

    const logObject = {
        message: errorData.error,
        stack: errorData.stack,
        timestamp: errorData.timestamp,
        PID: errorData.PID, // Participant ID from frontend
        EXP: errorData.EXP, // Experiment parameter from frontend
        step: errorData.step,
        browserInfo: userAgentReadable, // Parsed user agent information
        source: errorData.source
    };

    const introStr = errorData.source === 'frontend' ? 'Frontend Error:' : 'Error reported:';
    console.error(`${introStr} ${JSON.stringify(logObject, null, 2)}`);

    res.status(200).send('Error logged');
});



// START THE SERVER ///////////////////////////////////////////////////////////
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
});