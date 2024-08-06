

async function doStaircase() {
    console.log("Executing staircaseBlock")

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

    let staircaseParams;

    staircaseParams = await fetchStaircaseParams();
    
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
        
        var x = await executeStaircaseBlock (staircaseParams, block);
        block = x;
        //variableValues[i] = await executeStaircase(staircaseParams, i);
        
        await showMessageAndAwaitUserAction(staircaseParams.messageBetweenStairs);
    }

    //let meanValue = Math.round(variableValues.slice(-staircaseParams.numSaverage).reduce((acc, val) => acc + val, 0) / N);

    //updateParticipantLog();
    window.prolificCheckpointCode = window.step.completionCode;
    await presentEndOfBlockOptions(staircaseParams.messageAfterBlock);

}

async function executeStaircaseBlock(staircaseParams, block){
    
    console.log("in executeStaircaseBlock:", staircaseParams, block);

    let trialsContainer = createDynContainer('trialsContainer', null, style = {alignItems: 'start'});
    let trialsFooter = createDynFooter(parentElement = trialsContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        trialsFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    //let numberOfTrials = Object.keys(blockParams.driveFolderContents).length;
    //let trialNumber = 0;
    //for (const fileName in blockParams.driveFolderContents) {

    let fileUrl = staircaseParams.blockAdresses[block][0]; // This is the drive download link (fails in frontend without third party cookies)
    console.log("in executeStaircaseBlock, fileUrl:", fileUrl);
    
    let blockResponse = await playMediaAndGetOutcome(staircaseParams, fileUrl);
    console.log("BlockResponse: ", blockResponse);

    if(blockResponse == true){
        block = block + 1;
        console.log("in if: block:", block);
    }
    console.log("Block to be displayed: ", block);


    //const fileId = blockParams.driveFolderContents[fileName].fileId; // This is the file ID

   //blockResponses[trialNumber++] = { fileName, blockName: blockParams.blockName, trialResponse };
        
/*     await updateProgressBar(
        myProgressBar, // progressBar
        100*(trialNumber)/numberOfTrials, // value
        0.2, // duration in seconds
        false, // removeOnComplete
    ); */
    //}

    //if result correct --> return block + 1
    //else return same block, as sent  
    return block;

}

async function executeStaircase(staircaseParams) {


    let trialsContainer = createDynContainer('trialsContainer', null, style = {alignItems: 'start'});

    let trialsFooter = createDynFooter(parentElement = trialsContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        trialsFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    // determine starting val
    //let minVal = Math.min(...staircaseParams.startValueRange);
    //let maxVal = Math.max(...staircaseParams.startValueRange);
    //let currentVal = (minVal === maxVal) ? minVal : Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

    //let allVals = [];
    //let reversalCount = 0;
    //let reversalVals = [];    
    //let direction = 0;
    //let correct = null;
    while (reversalCount < staircaseParams.numReversals) {

        allVals.push(currentVal);
        correct = await playMediaAndGetOutcome(staircaseParams, currentVal, trialsContainer);
    
        console.log("correct", correct)
        if (correct) {
            newVal = currentVal + staircaseParams.stepCorrect;
        } else {
            newVal = currentVal + staircaseParams.stepIncorrect;
        }
    
        let newDirection = Math.sign(newVal - currentVal);
        if (direction !== 0 && newDirection !== direction) {
            reversalCount += 1;
            reversalVals.push(currentVal);
            await updateProgressBar(
                myProgressBar, // progressBar
                100*(reversalCount)/staircaseParams.numReversals, // value
                0.2, // duration in seconds
                false, // removeOnComplete
            );
        }

        direction = newDirection;
        currentVal = newVal;
        
    }

    console.log(reversalVals)
    let meanR = Math.round(reversalVals.slice(-staircaseParams.numRaverage).reduce((acc, val) => acc + val, 0) / N);

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

    !!!!!!!!!!
    //await processAndSendAllStaircaseVals("results", blockParams.blockName, blockResponses);
    
    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.15, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    trialsContainer.remove()

}
