
const selectedAnswers = {
    color: null,
    letter: null,
    number: null,
};


async function doStaircase() {
    console.log("Executing staircaseBlock");
    const blockResponses = {};

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

    let staircaseParams = await fetchStaircaseParams();
    
    console.log("in doStairCase(), after fetchStaircaseParams()", staircaseParams);
    
/*     if (!staircaseParams.driveFolderContents) {
        const bodyText = `${window.STR.noBlocksAvailable}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.prolificCheckpointCode}</strong>`;
        await redirectHandler(window.STR.thankYou, bodyText, window.prolificCheckpointCode);
    } */

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.15, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    blockContainer.remove();

    //Before Starting staircaseBlock, get confirmation from user
    await showMessageAndAwaitUserAction(staircaseParams.messageBeforeBlock);
    console.log("numStairs", staircaseParams.numOfStairs);

    //we start with audio 1, block is updated if successfull response 
    let block = 0;   

    //numOfStairs: how many files are presented to each participant --> 10 files  
    for (let i = 0; i < staircaseParams.numOfStairs; i++) {
        console.log("in for loop, index", i);
        
        //blockResponses[i] = [block, isCorrect, selectedAnswer]
        blockResponses[i] = await executeStaircaseBlock (staircaseParams, block);
        console.log("in doStaircase: blockResponses[i]: ", blockResponses[i] );
    
        
        //await showMessageAndAwaitUserAction(staircaseParams.messageBetweenStairs[0]);
        await updateProgressBar(
            myProgressBar, // progressBar
            (i+1)/staircaseParams.numOfStairs, // value
            0.2, // duration in seconds
            false, // removeOnComplete
        );

        await updateParticipantLog();
        await processAndSendStaircaseVal("results5", block, blockResponses[i]);

        block = blockResponses[i][0];
        console.log("after processAndSendAllBlockResponses");

    }
    window.prolificCheckpointCode = window.step.completionCode;
    await presentEndOfBlockOptions(staircaseParams.messageAfterBlock);

}

async function executeStaircaseBlock(staircaseParams, block){
    
    console.log("in executeStaircaseBlock:", staircaseParams);

    let trialsContainer = createDynContainer('trialsContainer', null, style = {alignItems: 'start'});
    let trialsFooter = createDynFooter(parentElement = trialsContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        trialsFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    let fileUrl = staircaseParams.blockAdresses[block][0]; // This is the drive download link (fails in frontend without third party cookies)
    console.log("in executeStaircaseBlock, fileUrl:", fileUrl);
    
    let blockResponse = await playMediaAndGetOutcome(staircaseParams, fileUrl);
    console.log("BlockResponse: ", blockResponse);

    if(blockResponse[1] == true){
        block = block + 1;
        console.log("in if: block:", block);
        await showMessageAndAwaitUserAction(staircaseParams.messageBetweenStairs[1]);

    }
    else{
        await showMessageAndAwaitUserAction(staircaseParams.messageBetweenStairs[2]);
    }
    let result = [
        block, 
        blockResponse[0],
        blockResponse[1],
        blockResponse[2],
    ]

    console.log("in executeStaircaseBlock: value to be returned: " , result);
    console.log("Block to be displayed: ", block);

   //blockResponses[trialNumber++] = { fileName, blockName: blockParams.blockName, trialResponse };
        
/*     await updateProgressBar(
        myProgressBar, // progressBar
        100*(trialNumber)/numberOfTrials, // value
        0.2, // duration in seconds
        false, // removeOnComplete
    ); */
    //}

    //return block;
    return result;
}
