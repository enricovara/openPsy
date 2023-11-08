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

module.exports = { getBaseExpParams, getStepDetails };
