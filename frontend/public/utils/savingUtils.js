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
        console.error(`There was a problem updating the Participant Log`);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.1.0`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
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
        //console.log(rowDataList)
        
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
                version: version  ?? '',
                prolificID: window.participant.prolificID,
                dateTime: datetime,
                rowDataList: rowDataList // Renamed listOfStrToSave to rowDataList
            })
        });

        // Process the response
        const data = await response.json();
        console.log('Success in saving data:', data);
    } catch (error) {
        console.error('Error:', error);
        console.error(`There was a problem posting results`);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.1.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }
}

/**
 * Sends an error report to the server asynchronously.
 * The function captures error details along with additional context and sends this data to a specified endpoint.
 *
 * @param {Error} error - The error object that needs to be reported.
 */
async function reportErrorToServer(error) {
    try {
        const errorReport = {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            source: 'frontend',
            PID: window.participant.prolificID,
            EXP: window.expParams.mainSheetID,
            step: window.step.number,
        };

        await fetch('/api/logError', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(errorReport)
        });
    } catch (networkError) {
        console.error('Failed to report error to server:', networkError);
    }
}

