// simpleBlockUtils.js


// Media playback and capturing response

async function playMediaAndCaptureResponse(blockParams, fileName, mediaContainer) {
    try {

        const fileUrl = blockParams.driveFolderContents[fileName];
        const isVideo = fileName.endsWith('.mp4');
        const isAudio = fileName.endsWith('.wav');
        let mediaElement;
    
        if (isVideo || isAudio) {
            mediaElement = isVideo ? document.createElement('video') : document.createElement('audio');
            mediaElement.src = fileUrl;
            mediaContainer.innerHTML = ''; // Clear previous media
            mediaContainer.appendChild(mediaElement); // Add new media
    
            await new Promise((resolve, reject) => {
                mediaElement.onended = () => {
                    console.log(`Finished playing ${fileName}`);
                    resolve();
                };
                mediaElement.onerror = (e) => {
                    console.log('Error playing media', e);
                    reject(e);
                };
                console.log(`Playing ${fileName}`);
                mediaElement.play().then(() => console.log('Media started playing')).catch(e => console.log('Error playing media', e));
            });
        }
    
        trialResponse = await respMCQ(blockParams.questionsAndAnswers);
    
        // Assume respMCQ returns a list of answers: one for each question in questionsAndAnswers
        return trialResponse
        
    } catch (error) {
        console.error('Error:', error);
        MISCDEMO_FORM.style.display = 'none';
        title.textContent = "Error 006.0.2";
        displayUsername.textContent = `Experiment flow error.`;
        handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
    }
        
}



async function checkinOrConfirmBlock(reservedCell, actionType) {
    try {
        const mainSheetID = window.expParams.mainSheetID;
        const prolificID = window.participant.prolificID;
        const version = window.step.version;
        const response = await fetch('/api/checkinOrConfirmBlock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mainSheetID, version, prolificID, reservedCell, actionType })
        });

        if (!response.ok) {
            throw new Error('Server responded with an error!');
            console.log(response)
        }

        const result = await response.json();
        console.log(result.message); // Success message
    } catch (error) {
        console.error('Error checking in block:', error);
    }
}



async function processAndSendAllBlockResponses(sheetTab, blockName, blockResponses) {
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
    console.error('Error processing all block responses:', error);
  }
}
