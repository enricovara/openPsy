// getBaseExpParams.js

/*
 * GET EXPERIMENT TITLE
 * FIND OUT IF USER EXISTS, CREATE IF NOT, OR FIND CURRENT STEP IF SO
 * FIND TITLE OF EXPERIMENT
 * FIND STEPS IN EXPERIMENT
 * UPDATE prolificErrorCode
 */
 
window.expParams = window.expParams || {};
window.participant = window.participant || {};
window.prolificErrorCode = window.prolificErrorCode || {};
window.STR = window.STR || {};

async function getBaseExpParams() {

    // CONTAINER FOR LOGIN UI
    let loginContainer = createDynContainer('loginContainer');

    let loginFooter = createDynFooter(parentElement = loginContainer);

    let title = createDynTextElement("CustomPsych", 'Title', parentElement = loginContainer, {margin: '170px'})

    // PROGRESS BAR
    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        loginFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        7, // duration in seconds
        false, // removeOnComplete
    );

    // GET MAIN SHEET AND USER ID FROM QUERY params
        // window.participant.prolificID
        // window.expParams.mainSheetID
    parseQueryParams();
    
    // communicate participant.prolificID or failure to user

    if (window.participant.prolificID && window.expParams.mainSheetID && window.STR.language) {
        console.log(`Found all required query params`);
        console.log(`   Displaying window.participant.prolificID to user`);
        displayUsername = createDynTextElement(`PID: ${window.participant.prolificID}`, 'Body', loginContainer);
    } else {
        console.error(`There was a problem with parsing the URL query params`);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error 0.0.1`, `Please communicate this error code to the experimenter`, window.prolificErrorCode, allowRetry=true);
    }

    // error logging test
    // try {
    //     if (window.expParams.mainSheetID === "18h4-JZh6e8L3F1X-1BhLPGrG5qIVd3Q1JudyXZUDFlM") {
    //         hello
    //     }
    // } catch (error) {
    //     await reportErrorToServer(error);
    // }
    
    // GET window.expParams
        // .title
        // .prolificErrorCode -> promoted to window (see below)
        // .stepsParams
            // .stepNum
            // .type
            // .toDo
            // .completionCode
            // .status     
    // GET window
        // .prolificErrorCode

    console.log(``);
    console.log(`Looking for experiment database: ${window.expParams.mainSheetID}`);
    console.log(`And attempting to login/register user: ${window.participant.prolificID}`);
    console.log(`And getting strings for language: ${window.STR.language}`);

    try {

        const data = await querySetupLogin()
        //logObject(data);
        window.expParams.title = data.expParams.expTitle;
        window.expParams.stepsParams = data.expParams.stepsParams;
        window.prolificErrorCode = data.expParams.prolificErrorCode;
        
        window.STR = data.STR; // Assign the STR object to a global variable
                        
    } catch (error) {
        console.error(`There was a problem with the fetch operation:`, error);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error 0.0.2`, `Please communicate this error code to the experimenter`, window.prolificErrorCode, allowRetry=true);
    }

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.1, // duration
        true, // removeOnComplete
        150 // removeDelay
    );    
    
    displayUsername.textContent = `${window.STR.yourParticipantIDis}: ${window.participant.prolificID}`, 'Body', loginContainer;
    title.textContent = window.expParams.title;
    title.style.display = 'block';

    console.log(``);

    await greetUser();

}



function parseQueryParams() {
    let urlParams = new URLSearchParams(window.location.search);
    window.participant.prolificID = urlParams.get('PROLIFIC_PID') ? urlParams.get('PROLIFIC_PID') : null;
    window.expParams.mainSheetID = urlParams.get('EXP') ? urlParams.get('EXP') : null;
    window.STR.language = urlParams.get('LANGUAGE') ? urlParams.get('LANGUAGE') : null;
}


async function querySetupLogin() {

    const response = await fetch("/api/doSetupAndLogin", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            mainSheetID: window.expParams.mainSheetID,
            prolificID: window.participant.prolificID,
            language: window.STR.language,
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

function logObject(data, indent = '') {
    console.log(`Found:`);
    if (Array.isArray(data)) {
        data.forEach((item, index) => {
            console.log(`${indent}[${index}]:`);
            logObject(item, indent + '    '); // Recursively log array items
        });
    } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                console.log(`${indent}${key}:`);
                logObject(value, indent + '    '); // Recursively log object properties
            } else {
                console.log(`${indent}${key}: ${value}`);
            }
        });
    } else {
        console.log(indent + data); // Handle non-object, non-array types
    }
}

async function greetUser() {
                
    startButton = createDynButton(
        window.STR.startButtonText, // buttonText
        loginContainer, // parentElement
        { display: 'none' }, // style
        { id: 'startButton' } // attributes
    );

    // if already left a log, any log
    if (Object.values(window.expParams.stepsParams).some(step => step.status)) {
        startButton.textContent = window.STR.continueLastCheckpointButtonText;
    }

    let startExp = new Promise((resolve) => {
        startButton.addEventListener('click', () => {
            loginContainer.remove();
            resolve();
        });
    });

    startButton.style.display = 'block';
    await startExp;
}