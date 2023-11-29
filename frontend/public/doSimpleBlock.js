async function doSimpleBlock() {
    window.title.style.display = 'none';
    var mediaContainer = document.getElementById('mediaContainer');
    const blockResponses = {};
    let blockParams;

    try {
        blockParams = await fetchBlockParams();
        if (!blockParams.driveFolderContents) {
            await handleNoAvailableBlocks();
            return;
        }

        await showInitialMessageAndAwaitUserAction(blockParams.messageBeforeBlock);
        await executeTrials(blockParams, blockResponses, mediaContainer);
        await presentEndOfBlockOptions(blockParams);
    } catch (error) {
        handleError(blockParams, error, '004.0.2');
    }
}

async function fetchBlockParams() {

    const response1 = await fetch(`/api/clearOldCheckouts?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version}`);
    if (!response1.ok) {
        throw new Error('Network response was not ok');
    }

    const response2 = await fetch(`/api/simpleBlock?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version}&prolificID=${window.participant.prolificID}`);
    if (!response2.ok) {
        throw new Error('Network response was not ok');
    }
    return await response2.json();
}

async function handleNoAvailableBlocks() {
    console.log(`NO AVAILABLE BLOCKS`);
    title.textContent = "Thank you";
    endMessage.innerHTML = `<h3>You have completed the experiment.</h3>Click the button below to return to Prolific automatically.<br>Your completion code is <strong>${window.prolificCheckpointCode}</strong>`;
    ENDING_SCREEN.style.display = 'block';
    handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificCheckpointCode}`);
}

function handleError(blockParams, error, errorCode) {
    if (blockParams.reservedCell) {
        checkinOrConfirmBlock(blockParams.reservedCell, "checkin");
    }
    console.error('Error:', error);
    title.textContent = `Error ${errorCode}`;
    displayUsername.textContent = `Experiment flow error.`;
    handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
}

function createButton(text, parentElement, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    parentElement.appendChild(button);
    return button;
}

async function showInitialMessageAndAwaitUserAction(messageBeforeBlock) {
    const messageNode = document.createTextNode(messageBeforeBlock);
    document.body.appendChild(messageNode);
    await new Promise(resolve => {
        const continueButton = createButton('Start Block', document.body, () => {
            // Hide or remove the text node when the button is clicked
            messageNode.remove(); // or messageNode.style.display = 'none';
            continueButton.style.display = 'none';
            resolve();
        });
        continueButton.style.marginTop = '10px';
    });
}


async function executeTrials(blockParams, blockResponses, mediaContainer) {
    let trialNumber = 0;
    for (const fileName in blockParams.driveFolderContents) {
        const trialResponse = await playMediaAndCaptureResponse(blockParams, fileName, mediaContainer);
        blockResponses[trialNumber++] = { fileName, blockName: blockParams.blockName, trialResponse };
    }
    console.log("All Block Responses:", JSON.stringify(blockResponses, null, 2));
    await updateParticipantLog();
    await processAndSendAllBlockResponses("results", blockParams.blockName, blockResponses);
    await checkinOrConfirmBlock(blockParams.reservedCell, "confirm");
    window.prolificCheckpointCode = window.step.completionCode;
}

async function presentEndOfBlockOptions(blockParams) {
    return new Promise((resolve, reject) => {
        // Create and append the text node
        const messageNode = document.createTextNode(blockParams.messageAfterBlock);
        document.body.appendChild(messageNode);

        // Shared function to hide or remove elements
        function hideElements() {
            messageNode.remove(); // or messageNode.style.display = 'none';
            continueButton.style.display = 'none';
            quitButton.style.display = 'none';
        }

        // Create and handle 'Continue' button
        const continueButton = createButton('Continue', document.body, async () => {
            hideElements();
            resolve(); // Resolve the promise when 'Continue' is clicked
        });
        continueButton.style.marginTop = '10px';

        // Create and handle 'Quit and return to Prolific' button
        const quitButton = createButton('Quit and return to Prolific', document.body, async () => {
            hideElements();
            title.textContent = "Thank you";
            endMessage.innerHTML = `<h3>You have completed the experiment.</h3>Click the button below to return to Prolific automatically.<br>Your completion code is <strong>${window.prolificCheckpointCode}</strong>`;
            ENDING_SCREEN.style.display = 'block';
            await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificCheckpointCode}`);
            resolve(); // Resolve the promise when 'Quit and return to Prolific' is clicked
        });
        quitButton.style.marginTop = '10px';
    });
}


