async function doSimpleBlock() {

    let blockContainer = createDynContainer('blockContainer', null, style = {alignItems: 'start'});

    let blockFooter = createDynFooter(parentElement = blockContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        blockFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    // updateProgressBar(
    //     myProgressBar, // progressBar
    //     90, // value
    //     3, // duration in seconds
    //     false, // removeOnComplete
    // );

    let blockParams;
    blockParams = await fetchBlockParams();
    if (!blockParams.driveFolderContents) {
        const bodyText = `${window.STR.noBlocksAvailable}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.prolificCheckpointCode}</strong>`;
        await redirectHandler(window.STR.thankYou, bodyText, window.prolificCheckpointCode);
    }

    // await updateProgressBar(
    //     myProgressBar, // progressBar
    //     100, // value
    //     0.15, // duration
    //     true, // removeOnComplete
    //     150 // removeDelay
    // );

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
    await executeBlock(blockParams);

    // Show the "After Block" message if applicable
    if (blockParams.messageAfterBlock !== undefined) {
        await showMessageWithOptions(blockParams.messageAfterBlock, {
            buttons: afterBlockButtons
        });
    }


}


async function executeBlock(blockParams) {

    let trialsContainer = createDynContainer('trialsContainer', null, style = {alignItems: 'start'});

    let trialsFooter = createDynFooter(parentElement = trialsContainer);

    // let myProgressBar = createDynProgressBar(
    //     {}, // style // No additional styles
    //     trialsFooter, // parentElement // Appending to the trialsContainer
    //     false // showValue // Not showing the progress value
    // );

    let numberOfTrials = Object.keys(blockParams.driveFolderContents).length;
    let trialNumber = 0;
    let blockResponses = {};
    for (const fileName in blockParams.driveFolderContents) {

        const fileUrl = blockParams.driveFolderContents[fileName].downloadLink; // This is the drive download link (fails in frontend without third party cookies)
        const fileId = blockParams.driveFolderContents[fileName].fileId; // This is the file ID

        const trialResponse = await playMediaAndCaptureResponse(blockParams, fileName, fileId, fileUrl, trialsContainer);
        blockResponses[trialNumber++] = { fileName, blockName: blockParams.blockName, trialResponse };
        
    }

    console.log("All Block Responses:", JSON.stringify(blockResponses, null, 2));
    await updateParticipantLog();
    await processAndSendAllBlockResponses("results", blockParams.blockName, blockResponses);
    await checkinOrConfirmBlock(blockParams.reservedCell, "confirm");
    window.prolificCheckpointCode = window.step.completionCode;

    trialsContainer.remove()

}


