// getBaseExpParams.js

/*
 * GET EXPERIMENT TITLE
 * FIND OUT IF USER EXISTS, CREATE IF NOT, OR FIND CURRENT STEP IF SO
 * FIND TITLE OF EXPERIMENT
 * FIND NUMBER OF STEPS IN EXPERIMENT
 * UPDATE generalProlificErrorCode
 */
 
window.expParams = window.expParams || {};
window.participant = window.participant || {};
window.generalProlificErrorCode = window.generalProlificErrorCode || {};

async function getBaseExpParams() {

    // GET MAIN SHEET AND USER ID FROM QUERY PARAMS
    console.log(`Parsing query params`);
    let urlParams = new URLSearchParams(window.location.search);
    window.participant.prolificID = urlParams.get('PROLIFIC_PID') ? urlParams.get('PROLIFIC_PID') : null;
    window.expParams.mainSheetID = urlParams.get('EXP') ? urlParams.get('EXP') : null;
    console.log(`   Found window.participant.prolificID: ${window.participant.prolificID}`);
    console.log(`   Found window.expParams.mainSheetID: ${window.expParams.mainSheetID}`);
    
    // communicate participant.prolificID or failure to user
    LOGIN_FORM.style.display = 'block';
    startButton.style.display = 'none';
    
    if (window.participant.prolificID && window.expParams.mainSheetID) {
        console.log(`   Displaying window.participant.prolificID to user`);
        displayUsername.textContent = `Your participant ID is: ${window.participant.prolificID}`;
    } else {
        console.log(`   Redirecting user with error code`);
        displayUsername.textContent = `No ID or EXPERIMENT CODE detected. You are being redirected to Prolific.`;
        Object.assign(displayUsername.style, {
            color: 'red',
            marginTop: '20px',
            marginBottom: '180px'
        });
        ENDING_SCREEN.style.display = 'block';
        returnToProlific.addEventListener('click', function() {
            window.location.href = `https://app.prolific.co/submissions/complete?cc=${window.generalProlificErrorCode}`;
        });
    }
    
    
    // GET expParams.title, expParams.lastStep and generalProlificErrorCode

    console.log(`Looking for experiment database using ${window.expParams.mainSheetID}`);
    console.log(`... and attempting login for ${window.participant.prolificID}`);
    try {
        const response = await fetch("/api/getBaseExpParams", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mainSheetID: window.expParams.mainSheetID
            })
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data = await response.json();
        window.expParams.title = data.title;
        window.expParams.lastStep = data.lastStep;
        window.generalProlificErrorCode = data.generalProlificErrorCode;
    
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        console.log(`   Redirecting user with error code`);
        returnToProlific.addEventListener('click', function() {
            window.location.href = `https://app.prolific.co/submissions/complete?cc=${window.generalProlificErrorCode}`;
        });
    }

    // SHOW USER UPDATED TITLE
    title.textContent = window.expParams.title;

}