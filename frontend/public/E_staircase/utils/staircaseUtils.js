// staircaseUtils.js

//const { fancylog } = require("../../../../backend/utils");

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

async function fetchStaircaseParams() {
    let data;

    try {
        const response = await fetch(`/api/staircaseBlock?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version ?? ''}`);

        if (!response.ok) {
            throw new Error('Network response was not ok in staircaseUtils fetching /api/staircaseBlock');
        }

        data = await response.json();
        console.log('Staircase parameters: ', data);

    } catch (error) {
        console.error('Error:', error);
        console.error('There was a problem fetching block params');
        console.log('prolificID and mainSheetID:', window.participant.prolificID, window.expParams.mainSheetID);
        console.log('Redirecting user with error code');
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.2.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
    }

    return data;
}

// Helper function to validate JSON
function isValidJSON(text) {
    try {
        JSON.parse(text);
    
    } catch (error) {
        return false;
    }
}



async function playMediaAndGetOutcome(staircaseParams, currentVal, trialsContainer) {

    try {

        let currentValFolderID = staircaseParams.intIndexedFolderIDs[currentVal];
        let currentValFolderURL = staircaseParams.intIndexedFolderURLs[currentVal];

        console.log(`Picking a random file from ${currentValFolderURL}`)
        const { fileId, fileName } = await getRandomFileFromFolder(currentValFolderID);

        const playSuccess = await playStim("", fileId, fileName, trialsContainer)

        if (!playSuccess) { // playing 2 roles at once!
            throw new Error('Failed to play');
        }

        correctResponse = getGRIDfromFilename(fileName);
        console.log(correctResponse)

        const response = await respGRID(); // Present questions

        return isCorrectResponse = correctResponse[0] === response.selectedColor && correctResponse[1] === response.selectedLetter && (correctResponse[2] === 'z' ? '0' : correctResponse[2]) === response.selectedNumber;
    
    } catch (error) {
        reportErrorToServer(error);
        console.error('Error playing or recording outcome:', error);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error ${window.step.number}.2.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }

}


async function getRandomFileFromFolder(folderId) {
    let retryCount = 0;
    const maxRetries = 3; // Maximum number of retries

    while (retryCount < maxRetries) {
        try {
            // Fetch random file ID and name from the folder
            const response = await fetch(`/random-file-from-folder/${folderId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return { fileId: data.fileId, fileName: data.fileName };
        } catch (error) {
            retryCount++;
            console.error('Error fetching  from gDrive folder:', error);
            console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
            console.log(`   Redirecting user with error code`);
            reportErrorToServer(error);
            if (retryCount >= maxRetries) {
                await redirectHandler(`Error ${window.step.number}.2.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
            }
        }
    }
}


async function processAndSendAllStaircaseVals(sheetTab, blockName, blockResponses) {
  let allRowData = [];

  // Loop through each block in blockResponses
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

