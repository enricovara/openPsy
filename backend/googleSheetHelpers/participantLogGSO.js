// participantLogGSO.js

const { getAuthenticatedClient } = require('./googleSheetAuth');
const marked = require('marked');


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

module.exports = { updateStepWithText };
