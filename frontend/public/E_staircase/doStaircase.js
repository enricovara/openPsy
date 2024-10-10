
async function doStaircase() {

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
        20, // duration in seconds
        false, // removeOnComplete
    );

    let blockParams;
    blockParams = await fetchStairParams();
    if (!blockParams.blocks || !blockParams.blocks[0].driveFolderContents) {
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

    // Show the "Before Block" message if applicable
    if (blockParams.messageBeforeBlock !== undefined) {
        await showMessageWithOptions(blockParams.messageBeforeBlock, {
            buttons: beforeBlockButtons
        });
    }

    // Execute the main staircase logic
    await executeStaircases(blockParams);

    // Show the "After Block" message if applicable
    if (blockParams.messageAfterBlock !== undefined) {
        await showMessageWithOptions(blockParams.messageAfterBlock, {
            buttons: afterBlockButtons
        });
    }
    
}


async function executeStaircases(blockParams) {

    let trialsContainer = createDynContainer('trialsContainer', null, style = { alignItems: 'start' });
    let trialsFooter = createDynFooter(parentElement = trialsContainer);

    const blockNames = Object.values(blockParams.blocks).map(block => parseInt(block.blockName, 10));
    const minDifficultyLevel = Math.min(...blockNames);
    const maxDifficultyLevel = Math.max(...blockNames);

    // Prepare to store the last reversal difficulty levels for each staircase
    const lastReversalDifficultyLevels = [];

    // Get the startPoints and reversals from blockParams
    const startPoints = blockParams.startPoints[0];
    const reversalsToReach = blockParams.reversals[0];

    // To ve overwritten at every staircase
    let trial_response;

    // For each startPoint, run a staircase
    for (let stair_i = 0; stair_i < startPoints.length; stair_i++) {

        let currentDifficulty = parseInt(startPoints[stair_i], 10);
        let reversalsCount = 0;
        let previousDirection = null;
        let direction = null;
        let trialNumber = 0;

        // Store the reversal difficulty levels for this staircase
        let reversalDifficultyLevels = [];

        // While reversalsCount is less than required reversals
        while (reversalsCount < reversalsToReach) {

            // Select a random file from currentDifficulty level
            const matchingBlock = Object.values(blockParams.blocks).find(
                block => parseInt(block.blockName, 10) === currentDifficulty
            );
            const trialKeys = Object.keys(matchingBlock.driveFolderContents); // Get all subBlock keys
            const randomTrialKey = trialKeys[Math.floor(Math.random() * trialKeys.length)]; // Select a random trialKey
            const randomTrial = matchingBlock.driveFolderContents[randomTrialKey];
  
            const fileName = randomTrialKey;
            const fileUrl = randomTrial.downloadLink;
            const fileId = randomTrial.fileId;

            // Play the stimulus and get the response
            const trialResponse = await playMediaAndCaptureResponse(blockParams, fileName, fileId, fileUrl, trialsContainer);

            // Determine if response is correct
            const correctness = trialResponse[1].correct; // "correct" or "incorrect"

            generalNewLineUpdate("resultsStair", [currentDifficulty, trialNumber, fileName, trialResponse[0].response, trialResponse[0].reactionTime, trialResponse[1].answer, trialResponse[1].correct], window.step.version);

            // Adjust the difficulty level
            let nextDifficulty = currentDifficulty;
            if (correctness === "correct") {
                // Make task harder
                if (currentDifficulty < maxDifficultyLevel) {
                    nextDifficulty = currentDifficulty + 1;
                    console.log(`making it harder: ${currentDifficulty} -> ${nextDifficulty}`)
                } else {
                    console.log(`correct but max level: ${currentDifficulty} -> ${nextDifficulty}`)
                }
                direction = 'up';
            } else {
                // Make task easier
                if (currentDifficulty > minDifficultyLevel) {
                    nextDifficulty = currentDifficulty - 1;
                    console.log(`making it easier: ${currentDifficulty} -> ${nextDifficulty}`)
                } else {
                    console.log(`incorrect but min level: ${currentDifficulty} -> ${nextDifficulty}`)
                }
                direction = 'down';
            }

            // Check for reversal
            if (previousDirection !== null && direction !== previousDirection) {
                // Reversal has occurred
                reversalsCount++;
                reversalDifficultyLevels.push(currentDifficulty);
                console.log(`saved ${currentDifficulty} to reversals`)
            }

            // Update previousDirection and currentDifficulty
            previousDirection = direction;
            currentDifficulty = nextDifficulty;
            trialNumber ++;
        }

        // After staircase is complete, store the last reversal difficulty level
        const lastReversalDifficulty = reversalDifficultyLevels[reversalDifficultyLevels.length - 1];
        lastReversalDifficultyLevels.push(lastReversalDifficulty);

        // Display messageAfterEachStair if not the last staircase
        if (blockParams.messageAfterEachStair !== undefined && stair_i < startPoints.length - 1) {
            // Define button configurations for the "After Each Stair" message
            const afterEachStairButtons = [
                {
                    text: window.STR.continueAfterStairButtonText ?? 'Continue',
                    id: 'continueButton'
                }
            ];
            await showMessageWithOptions(blockParams.messageAfterEachStair, {
                buttons: afterEachStairButtons
            });
        }
    }

    // After all staircases are complete, calculate the average of last reversal levels
    const averageLastReversal = Math.round(
        lastReversalDifficultyLevels.reduce((sum, val) => sum + val, 0) / lastReversalDifficultyLevels.length
    );

    // Save the outcome using the appropriate endpoint
    const staircaseOutcomeData = {
        mainSheetID: window.expParams.mainSheetID,
        version: window.step.version ?? '',
        prolificID: window.participant.prolificID,
        outcome: averageLastReversal
    };
    await saveStaircaseOutcome(staircaseOutcomeData);

    console.log("All Staircase Responses:", JSON.stringify(lastReversalDifficultyLevels, null, 2));
    await updateParticipantLog();

    window.prolificCheckpointCode = window.step.completionCode;

    trialsContainer.remove();
}



