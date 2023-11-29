// doInstructionsBreak.js

/*
 * updateHTMLWithInfoSheet
 * updateHTMLConsentQuestions
 * 
 */

async function doInstrBreak() {

    try {
        await updateHTMLWithMDtext("InstrBreak");
        console.log(`Rendered instruction sheet`);
    } catch (error) {
        console.error(`Failed to render info sheet and consent questions: ${error}`);
        CONSENT_FORM.style.display = 'none';
        title.textContent = "Error 001.0.1";
        displayUsername.textContent = `Experiment flow error.`;
        handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
    }
    
    INFO_SHEET.style.display = 'block';
    startButton.style.display = 'block';

    let startInfo = new Promise((resolve) => {
        infoContinueButton.addEventListener('click', () => {
            INFO_SHEET.style.display = 'none';
            startButton.style.display = 'none';
            resolve();
        });
    });
    
    await startInfo;
    
    await updateParticipantLog();
    window.title.style.marginTop = '0px'; // Set the margin-top property

}
