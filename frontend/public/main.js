window.addEventListener('load', async function () {

    window.prolificErrorCode = "ERROR_000_EXPERIMENT_DATABASE_NOT_FOUND";
    window.prolificCheckpointCode = "UNDEFINED";

    window.title = document.getElementById('title');
    window.displayUsername = document.getElementById('displayUsername');
    
    // display (temp) title
    title.style.display = 'block';


    LOGIN_FORM = document.getElementById('LOGIN_FORM');
    startButton = document.getElementById('startButton');
    ENDING_SCREEN = document.getElementById('ENDING_SCREEN');
    endMessage = document.getElementById('endMessage');
    returnToProlific = document.getElementById('returnToProlific');
    
    
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
        "MiscDemoQs": doMiscDemoMCQs,
        //"CheckBT": doCheckBT,
        //"CheckNoise": doCheckNoise,
        //"MiscDemoQs": doMiscDemoQs,
        //"CheckAttention": doCheckAttention,
        "simpleBlock": doSimpleBlock,
        "instructionsBreak": doInstrBreak,
    };
    
    let participantGreeted = 0;
        
    for (const step in expParams.stepsParams) {
            
        window.step = {...window.expParams.stepsParams[step]}; // shallow copy
        window.step.number = step;
    
        // If step exists and do is Always, or if not done and do is Once:
        // call the function based on step.type using the mapping object
        try{
            
            if (Object.values(window.expParams.stepsParams).some(step => step.status)) {
                if (!participantGreeted) { // if not greeted and ^ already left a log, any log
                    let continueFromCheckpointClicked = new Promise((resolve) => {
                        startButton.addEventListener('click', () => {
                            LOGIN_FORM.style.display = 'none';
                            resolve();  // Resolve the promise when button is clicked
                        });
                    });
                    
                    startButton.textContent = 'Continue from last checkpoint';
                    startButton.style.display = 'block';
                    
                    await continueFromCheckpointClicked;
                    participantGreeted = 1;

                }
            }
            
            if (window.step.status.startsWith("banned on")) {
                endMessage.innerHTML = `<h3>Thanks for considering our experiment.</h3>Unfortunately you do not qualify for this study.<br>Click the button below to return to Prolific automatically.<br>Your completion code is <strong>${window.step.completionCode}</strong>`;
                ENDING_SCREEN.style.display = 'block';
                await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.step.completionCode}`);
            }
            
            // EXTRACT VERSION NUMBER
            if (/\d+$/.test(window.step.type)) {
                window.step.version = window.step.type.match(/\d+$/)[0]; // save version into new location
                window.step.type = window.step.type.replace(/\d+$/, ''); // update step type to remove version
            }

        
            if (window.step.toDo === "Always" || (window.step.toDo === "Once" && !window.step.status)) {
                                   
                if (window.step.type && stepTypeFunctions[window.step.type]) {
                
                    console.log(`Launching step ${window.step.number}.`);
                    await stepTypeFunctions[window.step.type]();
                    console.log(`Done with step ${window.step.number}.`);
                    
                } else {
                    console.log(`Step function not defined, skipping ${window.step.number}.`);
                }
                    
            } else {
                
                console.log(`Skipping step ${window.step.number}.`);

            }

        } catch (error) {
            console.log(`Could not launch step ${window.step.number}.`);
            console.error(error);
            console.log(`   Redirecting user with error code`);
            title.textContent = "Error 000.0.0";
            displayUsername.textContent = `Platform error.`;
            await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
        }
        
        console.log(``)
        
        const lastStepNumber = Math.max(...Object.keys(window.expParams.stepsParams).map(Number));

        if (parseInt(window.step.number, 10) === lastStepNumber) {
            console.log(`That's all folks`);
            title.textContent = "Thank you";
            endMessage.innerHTML = `<h3>You have completed the experiment.</h3>Click the button below to return to Prolific automatically.<br>Your completion code is <strong>${window.prolificCheckpointCode}</strong>`;
            ENDING_SCREEN.style.display = 'block';
            await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificCheckpointCode}`);
        }
    }
});

