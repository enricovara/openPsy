// writingGSO.js

const { getAuthenticatedClient } = require('./00_googleSheetAuth');

const firstResultsRow = '3'
const firstResultsColumn = 'B'

/**
 * Add new lines to a specified Google Sheet tab with the given data. If rowDataList is a list of lists,
 * each sublist is treated as a separate row with the prolificID and dateTime prepended to each.
 * This function appends data to the bottom of the sheet, ensuring no existing data is overwritten.
 *
 * @param {string} mainSheetID - The ID of the main sheet.
 * @param {string} sheetTab - The tab name in the sheet to update.
 * @param {string} version - The tab name appending version number eg results1 or results2.
 * @param {string} prolificID - The participant's Prolific ID.
 * @param {string} dateTime - The date and time string.
 * @param {Array<string> | Array<Array<string>>} rowDataList - An array of strings or an array of string arrays to be saved in subsequent columns. Each element or sublist represents a new row to be added.
 * @return {void}
 */
async function generalNewLineUpdate(mainSheetID, sheetTab, version, prolificID, dateTime, rowDataList) {
    const googleSheets = await getAuthenticatedClient();

    try {
        // Check if rowDataList is a list of lists
        const isListOfLists = Array.isArray(rowDataList[0]);

        // Prepare the data for updating
        let rowData;
        if (isListOfLists) {
            // If rowDataList is a list of lists, process each sublist
            rowData = rowDataList.map(subList => [prolificID, dateTime, ...subList]);
        } else {
            // If rowDataList is a single list, process it as before
            rowData = [[prolificID, dateTime, ...rowDataList]];
        }
        
        //console.log(mainSheetID, sheetTab, prolificID, dateTime, rowData)

        // Update the sheet by appending data to the bottom
        await googleSheets.spreadsheets.values.append({
            spreadsheetId: mainSheetID,
            range: `${sheetTab}${version ? version : ''}!B2`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: rowData }
        });

    } catch (error) {
        console.error('Error in generalNewLineUpdate:', error);
        throw error;
    }
}




/**
 * UPDATE step with input text
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @param {string} prolificID - The participant's Prolific ID.
 * @param {number} stepNumber - The step number to update.
 * @param {string} inputText - The text to input into the cell.
 * @return {void}
 */
async function updateStepWithText(mainSheetID, prolificID, stepNumber, inputText) {
    const googleSheets = await getAuthenticatedClient();
    const participantLogRange = 'participantLog!';

    try {
        // Fetch participant's row index in participantLog
        const participantRowIndexResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${participantLogRange}B:B`
        });

        const participantRowIndex = participantRowIndexResponse.data.values.findIndex(row => row[0] == prolificID);

        // Throw an error if Prolific ID is not found
        if (participantRowIndex === -1) {
            throw new Error('Prolific ID not found in participantLog tab');
        }

        // Fetch step number's column index in participantLog
        const stepColumnIndexResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${participantLogRange}4:4`
        });

        const stepColumnIndex = stepColumnIndexResponse.data.values[0].findIndex(cell => cell == stepNumber);

        // Throw an error if step number is not found
        if (stepColumnIndex === -1) {
            throw new Error('Step number not found in participantLog tab');
        }

        // Update step cell with inputText in participantLog
        const stepCell = `${participantLogRange}${String.fromCharCode(65 + stepColumnIndex)}${participantRowIndex + 1}`;
        await googleSheets.spreadsheets.values.update({
            spreadsheetId: mainSheetID,
            range: stepCell,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[inputText]]
            }
        });

    } catch (error) {
        console.error('Error updating step with text:', error);
        throw error;
    }
}


//////////////////////////////////////////////////////////////////////////////

module.exports = { updateStepWithText, generalNewLineUpdate};
