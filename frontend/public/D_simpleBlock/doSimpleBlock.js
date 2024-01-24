async function doSimpleBlock() {

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
        3, // duration in seconds
        false, // removeOnComplete
    );

    const blockResponses = {};
    let blockParams;

    blockParams = await fetchBlockParams();
    if (!blockParams.driveFolderContents) {
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

    await showMessageAndAwaitUserAction(blockParams.messageBeforeBlock);

    await executeTrials(blockParams, blockResponses);

    await presentEndOfBlockOptions(blockParams.messageAfterBlock);
}


async function executeTrials(blockParams, blockResponses) {

    let trialsContainer = createDynContainer('trialsContainer', null, style = {alignItems: 'start'});

    let trialsFooter = createDynFooter(parentElement = trialsContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        trialsFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    let numberOfTrials = Object.keys(blockParams.driveFolderContents).length;
    let trialNumber = 0;
    for (const fileName in blockParams.driveFolderContents) {

        const fileUrl = blockParams.driveFolderContents[fileName].downloadLink; // This is the drive download link (fails in frontend without third party cookies)
        const fileId = blockParams.driveFolderContents[fileName].fileId; // This is the file ID

        const trialResponse = await playMediaAndCaptureResponse(blockParams, fileName, fileId, fileUrl, trialsContainer);
        blockResponses[trialNumber++] = { fileName, blockName: blockParams.blockName, trialResponse };
        
        await updateProgressBar(
            myProgressBar, // progressBar
            100*(trialNumber)/numberOfTrials, // value
            0.2, // duration in seconds
            false, // removeOnComplete
        );
    }

    await updateProgressBar(
        myProgressBar, // progressBar
        0, // value
        0.1, // duration in seconds
        false, // removeOnComplete
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        3, // duration in seconds
        false, // removeOnComplete
    );

    console.log("All Block Responses:", JSON.stringify(blockResponses, null, 2));
    await updateParticipantLog();
    await processAndSendAllBlockResponses("results", blockParams.blockName, blockResponses);
    await checkinOrConfirmBlock(blockParams.reservedCell, "confirm");
    window.prolificCheckpointCode = window.step.completionCode;

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.15, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    trialsContainer.remove()

}


