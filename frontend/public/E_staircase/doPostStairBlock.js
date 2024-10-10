async function doPostStairBlock() {

    let blockContainer = createDynContainer('blockContainer', null, style = {alignItems: 'start'});

    let blockFooter = createDynFooter(parentElement = blockContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        blockFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        12, // duration in seconds
        false, // removeOnComplete
    );

    let blockParams;
    blockParams = await fetchPostStairParams();
    console.log(blockParams)
    console.log(blockParams.blocks)
    console.log(blockParams)
    if (!blockParams.blocks) {
        const bodyText = `${window.STR.noBlocksAvailable}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.prolificCheckpointCode}</strong>`;
        await redirectHandler(window.STR.thankYou, bodyText, window.prolificCheckpointCode);
    }

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.15, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    blockContainer.remove();

    // Define button configurations for the "Before Block" message
    const beforeBlockButtons = [
        {
            text: window.STR.messageBeforeBlockButtonText,
            id: 'okButton'
        }
    ];

    // Define button configurations for the "After Block" message, with conditional inclusion of the "Stop Here" button
    const afterBlockButtons = [
        {
            text: window.STR.continueAfterBlockButtonText,
            id: 'continueButton'
        }
    ];

    // Conditionally add the "Stop Here" button if the parameter is set
    if (blockParams.giveEndAfterBlockOption) {
        afterBlockButtons.push({
            text: window.STR.stopHereButtonText,
            id: 'stopHereButton',
            action: async () => {
                const bodyText = `
                    ${window.STR.experimentCompleted}.<br>
                    ${window.STR.clickToReturnToProlific}.<br>
                    ${window.STR.yourCompletionCodeIs} <strong>${window.step.completionCode}</strong>
                `;
                await redirectHandler(
                    window.STR.thankYou,
                    bodyText,
                    window.prolificCheckpointCode
                );
            }
        });
    }

    // Show the "Before Block" message if applicable
    if (blockParams.messageBeforeBlock !== undefined) {
        await showMessageWithOptions(blockParams.messageBeforeBlock, {
            buttons: beforeBlockButtons
        });
    }

    // Execute the block
    await executePostStairBlocks(blockParams);

    // Show the "After Block" message if applicable
    if (blockParams.messageAfterBlock !== undefined) {
        await showMessageWithOptions(blockParams.messageAfterBlock, {
            buttons: afterBlockButtons
        });
    }


}


function getRandomElements(array, n) {
    // Shuffle the array and return the first n elements
    const shuffledArray = array.slice(); // Create a copy
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray.slice(0, n);
}

async function executePostStairBlocks(blockParams) {
    // Extract parameters
    const blocksPerParticipant = parseInt(blockParams.blocksPerParticipant, 10);
    const sentencesPerSubBlock = parseInt(blockParams.sentencesPerSubBlock, 10);

    // Randomly select n blocks
    const selectedBlocks = getRandomElements(blockParams.blocks, blocksPerParticipant);

    const afterEachSubBlockButtons = [
        {
            text: window.STR.continueAfterStairButtonText ?? 'Continue',
            id: 'continueButton'
        }
    ];

    let blockNumber = 0;
    for (const [index, block] of selectedBlocks.entries()) {
        console.log(`Processing Block ${index + 1}:`, block);

        blockNumber++;

        // Get trials and responses
        const trials = Object.entries(block.driveFolderContents);
        const numberOfTrials = trials.length;
        let trialNumber = 0;

        // Play sentences in groups
        for (const [fileName, fileData] of trials) {

            let trialsContainer = createDynContainer('trialsContainer', null, { alignItems: 'start' });
            let trialsFooter = createDynFooter(trialsContainer);

            trialNumber++; // Increment the counter

            const fileUrl = fileData.downloadLink;
            const fileId = fileData.fileId;

            const trialResponse = await playMediaAndCaptureResponse(
                blockParams,
                fileName,
                fileId,
                fileUrl,
                trialsContainer
            );

            console.log(selectedBlocks)

            generalNewLineUpdate("postStairRes", [block.blockName, trialNumber, fileName, trialResponse[0].response, trialResponse[0].reactionTime, trialResponse[1].answer, trialResponse[1].correct], window.step.version);

            if (trialNumber % sentencesPerSubBlock === 0) {
                // Display messageAfterSubBlock if not the last group
                if (blockParams.messageAfterSubBlock !== undefined &&  trialNumber < numberOfTrials) {
                    // Define button configurations for the "After Each SubBlock" message
                    await showMessageWithOptions(blockParams.messageAfterSubBlock, {
                        buttons: afterEachSubBlockButtons
                    });
                }
            }
            // Remove trials container after each sub block
            trialsContainer.remove();
        }

        // Display messageAfterSubBlock if not the last group
        if (blockParams.messageAfterSubBlock !== undefined && blockNumber < blocksPerParticipant) {
            // Define button configurations for the "After Each SubBlock" message
            await showMessageWithOptions(blockParams.messageAfterSubBlock, {
                buttons: afterEachSubBlockButtons
            });
        }
    }

    // Set the checkpoint code
    await updateParticipantLog();
    window.prolificCheckpointCode = window.step.completionCode;
}



