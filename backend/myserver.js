console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const path = require('path');
const express = require('express');
const {google} = require('googleapis');

const { getAuthenticatedDriveClient } = require('./googleSheetHelpers/00_googleSheetAuth');
const { doSetupAndLogin } = require('./googleSheetHelpers/01_setupGSO');
const { getMDtext, fetchQuestionsChoicesAnswer } = require('./googleSheetHelpers/02_formsGSO');
const { fetchBlockParams, checkinOrConfirmBlock, clearOldCheckouts} = require('./googleSheetHelpers/03_simpleBlockGSO');
const { fetchStaircaseParams } = require('./googleSheetHelpers/04_staircaseGSO');
const { updateStepWithText, generalNewLineUpdate} = require('./googleSheetHelpers/10_writingGSO');

const { parseUserAgent, fancylog } = require('./utils');

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

// STAIRCASE ////////////////////////////////////////////////////////////////

// Endpoint for fetching staircase parameters and media links
app.get('/api/staircaseBlock', async (req, res) => {
    try {
        const mainSheetID = req.query.mainSheetID; // Extract the mainSheetID from the query parameters
        const version = req.query.version; // Extract the block version from the query parameters

        // Fetch block parameters and drive folder contents
        const staircaseParams = await fetchStaircaseParams(mainSheetID, version);

        res.json(staircaseParams); // Respond with all block parameters and drive folder contents
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staircase parameters and media links', error: error.message });
    }
});


// ERROR LOGGING ///////////////////////////////////////////////////////////

app.post('/api/logError', (req, res) => {
    const errorData = req.body;
    const userAgent = req.headers['user-agent'];
    const userAgentReadable = parseUserAgent(userAgent); // Assume this function returns the expected format

    // Combine the error data with the user agent info
    const logObject = {
        ...errorData,
        browserInfo: userAgentReadable
    };

    // Log using fancylog.error
    fancylog.error(logObject);

    res.status(200).send('Error logged');
});



// PLAYBACK SERVER-SIDE /////////////////////////////////////////////////////
// TO AVOID THIRD PARTY COOKIES IN GDRIVE DOWNLOAD

// this version doesn't work for wav files in safari
app.get('/drive-file-old/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const drive = await getAuthenticatedDriveClient();

        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media'
        }, {
            responseType: 'stream'
        });

        response.data.pipe(res); // Stream the file data directly to the client
    } catch (error) {
        res.status(500).json({ message: 'Could not stream stimulus file', error: error.message });
    }
});

// this is the fix: https://chat.openai.com/c/092a14ae-b41b-454a-aa9c-f3a2c8f121ea
app.get('/drive-file/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const drive = await getAuthenticatedDriveClient();

        // Fetch file metadata for size and mimeType
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'size, mimeType'
        });

        const fileSize = fileMetadata.data.size;
        const mimeType = fileMetadata.data.mimeType;

        // Handle Range header if present
        const range = req.headers.range;
        let start, end;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            start = parseInt(parts[0], 10);
            end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            res.status(206); // Partial content
        } else {
            start = 0;
            end = fileSize - 1;
            res.status(200); // OK
        }

        // Set appropriate headers
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', end - start + 1);
        res.setHeader('Content-Type', mimeType);

        // Request the file with range if specified
        const response = await drive.files.get({
            fileId: fileId,
            alt: 'media',
            headers: range ? { Range: `bytes=${start}-${end}` } : {}
        }, {
            responseType: 'stream'
        });

        // Handle the streaming
        response.data
            .on('end', () => {
                console.log('Finished streaming file.');
                res.end();
            })
            .on('error', err => {
                console.error('Error during streaming:', err);
                res.status(500).send(err.toString());
            })
            .on('data', chunk => {
                if (!res.write(chunk)) {
                    response.data.pause();
                }
            });

        res.on('drain', () => {
            response.data.resume();
        });

    } catch (error) {
        res.status(500).json({ message: 'Could not stream file', error: error.message });
    }
});






app.get('/random-file-from-folder/:folderID', async (req, res) => {
    try {
        const folderID = req.params.folderID;
        const drive = await getAuthenticatedDriveClient();

        // List files in the folder
        const fileListResponse = await drive.files.list({
            q: `'${folderID}' in parents`,
            fields: 'files(id, name)'
        });

        const files = fileListResponse.data.files;
        if (!files.length) {
            return res.status(404).json({ message: 'No files found in folder' });
        }

        // Select a random file
        const randomFile = files[Math.floor(Math.random() * files.length)];

        // Return the file ID and name
        res.json({ fileId: randomFile.id, fileName: randomFile.name });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving file from folder', error: error.message });
    }
});




// START THE SERVER ///////////////////////////////////////////////////////////
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
});