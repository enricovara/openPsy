// savingUtils.js


// Function for posting datetime to participant log
async function updateParticipantLog(ban = false) {

    let datetime_text = new Date().toLocaleString('en-GB', { timeZone: 'UTC' }).replace(/,/g, '');
    if (ban) {
        datetime_text = "banned on " + datetime_text;
    }
    try {
        const response = await fetch('/api/updateStepWithText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mainSheetID: window.expParams.mainSheetID,
                prolificID: window.participant.prolificID,
                stepNumber: window.step.number,
                inputText: datetime_text
            })
        });
        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
        throw error;  // Rethrow the error to handle it in the calling function
    }
}


/**
 * Calls the generalNewLineUpdate endpoint to add new lines to a Google Sheet.
 * This function prepares the date and time in a specific format, and sends a POST request to the endpoint
 * with the necessary data for updating the sheet.
 *
 * @param {string} sheetTab - The tab name in the sheet to update.
 * @param {Array<string> | Array<Array<string>>} rowDataList - An array of strings or an array of string arrays to be saved in subsequent columns. Each element or sublist represents a new row to be added.
 * @return {Promise<void>}
 */
async function generalNewLineUpdate(sheetTab, rowDataList, version = undefined) {
    try {
        console.log(rowDataList)
        // Prepare the date and time in 'en-GB' format without commas
        const datetime = new Date().toLocaleString('en-GB', { timeZone: 'UTC' }).replace(/,/g, '');

        // Send a POST request to the endpoint
        const response = await fetch('/api/generalNewLineUpdate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mainSheetID: window.expParams.mainSheetID,
                sheetTab: sheetTab,
                version: version,
                prolificID: window.participant.prolificID,
                dateTime: datetime,
                rowDataList: rowDataList // Renamed listOfStrToSave to rowDataList
            })
        });

        // Process the response
        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

