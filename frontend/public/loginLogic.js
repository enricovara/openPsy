// login_consent.js

/*
 * Grab 
 * The sheet data is fetched from an API and injected into the HTML.
 */
 

async function doLoginLogic() {

    // GET MAIN SHEET AND USER ID FROM QUERY PARAMS
    let urlParams = new URLSearchParams(window.location.search);
    prolificID = urlParams.get('PROLIFIC_ID') ? urlParams.get('PROLIFIC_ID') : null;
    mainSheetID = urlParams.get('EXP') ? urlParams.get('EXP') : null;
    
    // COMMUNICATE USER ID OR FAILURE TO USER
    LOGIN_FORM.style.display = 'block';
    startButton.style.display = 'none';
    
    if (prolificID && mainSheetID) {
        displayUsername.textContent = `Your participant ID is: ${prolificID}`;
    } else {
        displayUsername.textContent = `No ID detected. You are being redirected to Prolific.`;
        Object.assign(displayUsername.style, {
            color: 'red',
            marginTop: '20px',
            marginBottom: '180px'
        });
        ENDING_SCREEN.style.display = 'block';
        returnToProlific.addEventListener('click', function() {
            window.location.href = "https://app.prolific.co/submissions/complete?cc=C4Z4O72V";
        });
    }
    
    // LOGIN OR CREATE USER
    await checkConsentLogs()
    
    
    
    
}