// googleSheetOperations.js

const { getAuthenticatedClient } = require('./googleSheetAuth');
const marked = require('marked');


/**
 * FETCH experiment TITLE, general PROLIFIC ERROR CODE, and the LAST STEP NUMBER
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @return {Object} An object containing the experiment title, last step number, and general prolific error code.
 */
async function getBaseExpParams(mainSheetID) {
    const googleSheets = await getAuthenticatedClient();
    
    // Define the starting row for the lastStep range
    const lastStepStartRow = 17;
    const controlRoomRange = 'controlRoom!';
    const lastStepColumn = 'E';
    const titleAndErrorCodeRanges = [`${controlRoomRange}B5`, `${controlRoomRange}J5`];

    // Prepare the batchGet request
    const ranges = [...titleAndErrorCodeRanges, `${controlRoomRange}${lastStepColumn}${lastStepStartRow}:${lastStepColumn}`];

    // getting title, generalProlificErrorCode, and lastStep;
    const response = await googleSheets.spreadsheets.values.batchGet({
        spreadsheetId: mainSheetID,
        ranges: ranges
    });

    // Parse response
    const [title, generalProlificErrorCode, stepsColumn] = response.data.valueRanges;

    // Extracting the experiment title and general prolific error code directly
    const expTitle = title.values[0][0];
    const errorCode = generalProlificErrorCode.values[0][0];

    // Calculate the last step based on the last non-empty cell in the specified steps column
    const lastNonEmptyStepValue = stepsColumn.values.filter(row => row.length > 0).pop();
    const lastStepIndex = stepsColumn.values.indexOf(lastNonEmptyStepValue);
    const lastStepCellRange = `${controlRoomRange}B${lastStepStartRow + lastStepIndex}`;
    
    // Fetch the corresponding last step value
    const lastStepResponse = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: lastStepCellRange
    });

    const lastStep = lastStepResponse.data.values[0][0];

    // Return the extracted data
    return {
        title: expTitle,
        generalProlificErrorCode: errorCode,
        lastStep: Number(lastStep) // Assuming lastStep is a number
    };
}


/**
 * FETCH step details
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @param {string} prolificID - The participant's Prolific ID.
 * @param {number} stepNumber - The step number to get details for.
 * @return {Object} An object containing the step type, fail exit code, success exit code, step do, and step status.
 */
async function getStepDetails(mainSheetID, prolificID, stepNumber) {
    const googleSheets = await getAuthenticatedClient();
    const controlRoomRange = 'controlRoom!';
    const participantLogRange = 'participantLog!';
    let stepDetails = {
        type: null,
        failExitCode: null,
        successExitCode: null,
        do: null,
        status: null
    };

    try {
        // Fetch all values in column B of controlRoom to find the row index
        const stepIndexResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${controlRoomRange}B:B`
        });

        const stepIndex = stepIndexResponse.data.values.findIndex(row => row[0] == stepNumber);

        if (stepIndex === -1) throw new Error('Step number not found in controlRoom tab');

        // Fetch step details from the controlRoom tab
        const stepDetailsRange = `${controlRoomRange}E${stepIndex + 1}:H${stepIndex + 1}`;
        const stepDetailsResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: stepDetailsRange
        });

        [stepDetails.type, stepDetails.do, stepDetails.failExitCode, stepDetails.successExitCode] = stepDetailsResponse.data.values[0];

        // Fetch participant's row index in participantLog
        const participantRowIndexResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${participantLogRange}B:B`
        });

        const participantRowIndex = participantRowIndexResponse.data.values.findIndex(row => row[0] == prolificID);
        
        // If Prolific ID not found, append it to the first empty row in participantLog
        if (participantRowIndex === -1) {
            const lastRowIndex = participantRowIndexResponse.data.values.length;
            // Append the new Prolific ID to column B
            await googleSheets.spreadsheets.values.append({
                spreadsheetId: mainSheetID,
                range: `${participantLogRange}B${lastRowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[prolificID]]
                }
            });
            
            // Set participantRowIndex to the new row index
            participantRowIndex = lastRowIndex;
        }
        
        // Fetch step number's column index in participantLog
        const stepColumnIndexResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${participantLogRange}4:4`
        });

        const stepColumnIndex = stepColumnIndexResponse.data.values[0].findIndex(cell => cell == stepNumber);

        if (stepColumnIndex === -1) throw new Error('Step number not found in participantLog tab');

        // Fetch step status from participantLog
        const stepStatusCell = `${participantLogRange}${String.fromCharCode(65 + stepColumnIndex)}${participantRowIndex + 1}`;
        const stepStatusResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: stepStatusCell
        });

        stepDetails.status = stepStatusResponse.data.values[0][0] || null;

        return stepDetails;
    } catch (error) {
        console.error('Error fetching step details:', error);
        throw error;
    }
}


//////////////////////////////////////////////////////////////////////////////



/**
 * FESTCHES EXP PARAMS from mainSheetID
 *
 * @returns {Promise<object>}
 */
async function fetchExpParams(mainSheetID) {
    const googleSheets = await getAuthenticatedClient();
    const ranges = [
        'controlRoom!B8:B', 'controlRoom!F8:F',
        'controlRoom!G8:G14', 'controlRoom!H8:H14',
        'controlRoom!G16:G28', 'controlRoom!H16:H28',
        'controlRoom!B5', 'controlRoom!C5'
    ];
    const response = await googleSheets.spreadsheets.values.batchGet({
        spreadsheetId: mainSheetID,
        ranges: ranges
    });

    let dataObject = {};
    for (let i = 0; i < response.data.valueRanges.length; i += 2) {
        const keys = response.data.valueRanges[i].values || [];
        const values = response.data.valueRanges[i + 1].values || [];
        keys.forEach((key, index) => {
            if (key[0] && values[index] && key[0] !== "None" && values[index][0] !== "None") {
                dataObject[key[0]] = values[index][0];
            }
        });
    }
    return dataObject;
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
 * FESTCHES CONSENT DATA for a given prolificId from participantLog tab
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
 * Updates the progress of a participant in a Google Sheet based on the provided step value and participant ID.
 *
 * The function will search through row 4 in the 'participantLog' sheet to find the correct column corresponding
 * to the stepValue and then update the cell in the identified column and row with the current datetime.
 *
 * @async
 * @param {string} prolificId - The identifier for the participant whose step progress needs to be updated.
 * @param {number} stepValue - The step number, used to identify the correct column for updating the progress.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete or rejects if any step fails.
 * 
 * @example
 * updateStepProgress('1234ABCD', 1)
 *   .then(() => console.log('Update complete'))
 *   .catch(err => console.log('An error occurred:', err));
 */

async function updateStepProgress(prolificId, stepValue) {
    //console.log("Step 1: Initiating Google Sheets API client authentication.");
    const googleSheets = await getAuthenticatedClient();

    //console.log("Fetching existing data from column B to identify the row for the given prolificId.");
    let response = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: 'participantLog!B6:B'
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === prolificId);
    if (rowIndex === -1) {
        //console.log("prolificId not found. Adding to first empty line.");
        rowIndex = rows.length;
        await googleSheets.spreadsheets.values.update({
            spreadsheetId: mainSheetID,
            range: `participantLog!B${rowIndex + 6}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[prolificId]]
            }
        });
    }

    //console.log("Fetching data for the identified row to find the next empty step.");
    const stepRow = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: `participantLog!A${rowIndex + 6}:${rowIndex + 6}`
    });

    const headerRow = response.data.values[0] || [];
    const columnIndex = headerRow.findIndex(cell => cell === `Step ${stepValue}`);
    if (columnIndex === -1) {
        //console.log("Step 5: stepValue not found in header row. Exiting function.");
        return;
    }

    const datetime = new Date().toISOString();
    //console.log(`Step 6: Updating Google Sheet with datetime: ${datetime}`);
    await googleSheets.spreadsheets.values.update({
        spreadsheetId: mainSheetID,
        range: `participantLog!${String.fromCharCode(65 + columnIndex)}${rowIndex + 6}`,
        valueInputOption: 'RAW',
        resource: {
            values: [[datetime]]
        }
    });

    //console.log("Step 7: Update complete.");
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



module.exports = { getBaseExpParams, getStepDetails };
