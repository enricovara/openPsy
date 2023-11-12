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

async function getBaseExpParams() {

    // GET MAIN SHEET AND USER ID FROM QUERY params
    // GET window
        // .participant.prolificID
        // .expParams.mainSheetID

    console.log(`Parsing query params`);
    let urlParams = new URLSearchParams(window.location.search);
    window.participant.prolificID = urlParams.get('PROLIFIC_PID') ? urlParams.get('PROLIFIC_PID') : null;
    window.expParams.mainSheetID = urlParams.get('EXP') ? urlParams.get('EXP') : null;
    console.log(`Found:`);
    console.log(`   Found window.participant.prolificID: ${window.participant.prolificID}`);
    console.log(`   Found window.expParams.mainSheetID:`);
    console.log(`   ${window.expParams.mainSheetID}`);
    
    // communicate participant.prolificID or failure to user
    LOGIN_FORM.style.display = 'block';
    startButton.style.display = 'none';
    
    if (window.participant.prolificID && window.expParams.mainSheetID) {
        console.log(`   Displaying window.participant.prolificID to user`);
        displayUsername.textContent = `Your participant ID is: ${window.participant.prolificID}`;
    } else {
        console.log(`   Redirecting user with error code`);
        displayUsername.textContent = `No ID or EXPERIMENT CODE detected.`;
        title.textContent = "Error 001";
        await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
    }
    console.log(``);
    
    
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

    console.log(`Looking for experiment database @`);
    console.log(`   ${window.expParams.mainSheetID}`);
    console.log(`And attempting to login/register user:`);
    console.log(`   ${window.participant.prolificID}`);

    try {
        const response = await fetch("/api/doSetupAndLogin", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mainSheetID: window.expParams.mainSheetID,
                prolificID: window.participant.prolificID,
            })
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        
        
        console.log(`Found:`);
        function logObject(data, indent = '') {
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
        logObject(data);
        
                
        window.expParams.title = data.expParams.expTitle;
        window.expParams.stepsParams = data.expParams.stepsParams;
        window.prolificErrorCode = data.expParams.prolificErrorCode;
                        
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        console.log(`   Redirecting user with error code`);
        title.textContent = "Error 002";
        displayUsername.textContent = `Could not connect to experiment.`;
        await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
    }

    // SHOW USER UPDATED TITLE
    title.textContent = window.expParams.title;
    console.log(``);

}