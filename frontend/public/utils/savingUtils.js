// savingUtils.js

/**
 * Updates the participant log with the current datetime or a ban timestamp.
 *
 * This function records the current UTC datetime in the participant's log by sending a POST request to the `/api/updateStepWithText` endpoint.
 * If the `ban` parameter is set to `true`, the function logs the timestamp as a ban event.
 * In case of an error during the update process, the function reports the error to the server and redirects the user with an error code.
 *
 * @async
 * @function updateParticipantLog
 * @param {boolean} [ban=false] - Indicates whether to log a ban event instead of a regular timestamp.
 * @returns {Promise<void>} A promise that resolves when the log is successfully updated or rejects if an error occurs.
 * @throws Will throw an error if the network request fails.
 */
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
 * Processes all block responses and sends them to the specified Google Sheet tab.
 *
 * This function iterates through each block in `blockResponses`, flattens the trial responses, and constructs row data.
 * After processing all blocks, it updates the Google Sheet by calling the `generalNewLineUpdate` function.
 * If an error occurs during the update, the function reports the error to the server and redirects the user with an error code.
 *
 * @async
 * @function processAndSendAllBlockResponses
 * @param {string} sheetTab - The name of the Google Sheet tab where the data should be updated.
 * @param {string} blockName - The name of the block being processed.
 * @param {Object.<string, Object>} blockResponses - An object containing responses for each block.
 *        Each block should have a `fileName` property and a `trialResponse` array with trial data.
 * @returns {Promise<void>} A promise that resolves when all block responses are processed and sent, or rejects if an error occurs.
 * @throws Will throw an error if the network request to update the Google Sheet fails.
 */
async function processAndSendAllBlockResponses(sheetTab, blockName, blockResponses) {
    let allRowData = [];
  
    // Loop through each block in blockResponses (probably only one?)
    for (const [index, block] of Object.entries(blockResponses)) {
        // Start with the blockName and filename
        let rowData = [blockName, block.fileName];
  
        // Flatten each trial's data in the trialResponse
        block.trialResponse.forEach(trial => {
            Object.values(trial).forEach(value => {
            rowData.push(`${value}`); // appending only the value of each field
            });
        });
    
        // Add the constructed rowData to the allRowData list
        allRowData.push(rowData);
    }
  
    // Call the function to update the Google Sheet with all row data at once
    try {
      await generalNewLineUpdate(sheetTab, allRowData, window.step.version);
    } catch (error) {
      reportErrorToServer(error);
      console.error('Error processing all block responses:', error);
      console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
      console.log(`   Redirecting user with error code`);
      await redirectHandler(`Error ${window.step.number}.1.4`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
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
            step: window.step?.number ? window.step.number : null,
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

