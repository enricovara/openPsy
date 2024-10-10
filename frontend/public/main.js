window.addEventListener('load', async function () {

    window.prolificErrorCode = "ERROR_000_EXPERIMENT_DATABASE_NOT_FOUND";
    window.prolificCheckpointCode = "UNDEFINED";
    
    // ESTABLISH RELATIONSHIT WITH CONTROL ROOM SHEET
    await getBaseExpParams();
    const lastStepNumber = Math.max(...Object.keys(window.expParams.stepsParams).map(Number));
        
        // window.prolificErrorCode = data.prolificErrorCode;
        // window.participant.prolificID
        
        // window.expParams.mainSheetID
        
        // window.expParams.title
        // window.expParams.stepsParams
            // .stepsParams[step].stepNum
            // .stepsParams[step].type
            // .stepsParams[step].toDo
            // .stepsParams[step].completionCode
            // .stepsParams[step].status
    

    // CYCLE THROUGH THE EXPERIMENT STEPS

    // Define a mapping of step types to their corresponding functions
    const stepTypeFunctions = {
        "InfoConsent": doInfoConsent,
        "ScreeningQs": doScreeningQs,
        // "CheckNoise": checkHeadphoneUse,
        "CheckBT": checkBluetoothAudio,
        "CheckNoise": checkBackgroundNoise,
        "MiscDemoQs": doMiscDemoMCQs,
        //"CheckAttention": doCheckAttention,
        "instructionsBreak": doInstrBreak,
        "simpleBlock": doSimpleBlock,
        "staircaseBlock": doStaircase,
        "postStairBlock": doPostStairBlock,
    };


    // re-reject user if necessary
    if (Object.values(window.expParams.stepsParams).some(
        step => step.status.startsWith("banned on") && (step.toDo === "Always" || step.toDo === "Once")
    )) {
        const stepWithCode = Object.values(window.expParams.stepsParams).find(step => step.status.startsWith("banned on"));
        const bodyText = `${window.STR.doNotQualify}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${stepWithCode.completionCode}</strong>`;
        await redirectHandler(window.STR.thanksForConsidering, bodyText, stepWithCode.completionCode);
    }

    let participantGreeted = 0;
    // LOOP THROUGH THE STEPS!
    for (const step in expParams.stepsParams) {
            
        window.step = {...window.expParams.stepsParams[step]}; // shallow copy
        window.step.number = step;

        try{
            
            // EXTRACT STEP VERSION NUMBER
            if (/\d+$/.test(window.step.type)) {
                window.step.version = window.step.type.match(/\d+$/)[0]; // save version into new location
                window.step.type = window.step.type.replace(/\d+$/, ''); // update step type to remove version
            }
        
            // If step exists and DO is ALWAYS, or if not done and do is ONCE:
            if (window.step.toDo === "Always" || (window.step.toDo === "Once" && !window.step.status)) {             
            
                if (window.step.type && stepTypeFunctions[window.step.type]) {
                
                    console.log(`Launching step ${window.step.number}: ${window.step.type} (v.${window.step.version}).`);
                    // call the STEP function based on step.type using the mapping object
                    await stepTypeFunctions[window.step.type]();
                    console.log(`Done with step ${window.step.number}.`);
                    
                } else {
                    console.log("window.step,type:", window.step.type);
                    console.log("stepTypeFunctions", stepTypeFunctions[window.step.type]);
                
                    // skip if already done or not to be done
                    throw new Error(`Step function not defined for step ${window.step.number}. window.step.type: ${window.step.type}, stepTypeFunctions[window.step.type]: ${stepTypeFunctions[window.step.type]}`);
                }
            } else {
                
                // skip if already done or not to be done
                console.log(`Skipping step ${window.step.number}.`);
            }

        } catch (error) {
            console.log(`Could not launch step ${window.step.number}.`);
            console.error(error);
            await reportErrorToServer(error);
            console.log(`   Redirecting user with error code`);
            await redirectHandler(`Error ${window.step.number}.0.0`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificErrorCode, allowRetry=true);
        }
        
        console.log(``)
        const lastStepNumber = Math.max(...Object.keys(window.expParams.stepsParams).map(Number));

        if (parseInt(window.step.number, 10) === lastStepNumber) {
            console.log(`That's all folks`);
            const bodyText = `${window.STR.experimentCompleted}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.prolificCheckpointCode}</strong>`;
            await redirectHandler(window.STR.thankYou, bodyText, window.prolificCheckpointCode);
        }
    }
});

