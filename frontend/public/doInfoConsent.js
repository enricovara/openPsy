// doInfoConsent.js

/*
 * updateHTMLWithInfoSheet
 * updateHTMLConsentQuestions
 * 
 */

async function doInfoConsent() {

    try {
        await updateHTMLWithMDtext("infoSheet");
        await updateHTMLRadioQuestions("consent", "strict");
        console.log(`Rendered info sheet and consent questions`);
    } catch (error) {
        console.error(`Failed to render info sheet and consent questions: ${error}`);
        CONSENT_FORM.style.display = 'none';
        title.textContent = "Error 001.0.1";
        displayUsername.textContent = `Experiment flow error.`;
        handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
    }
    

    let startInfo = new Promise((resolve) => {
        startButton.addEventListener('click', () => {
            LOGIN_FORM.style.display = 'none';
            INFO_SHEET.style.display = 'block';
            resolve();
        });
    });
    
    startButton.style.display = 'block';
    await startInfo;
    window.title.style.marginTop = '0px'; // Set the margin-top property


    let startConsent = new Promise((resolve) => {
        infoContinueButton.addEventListener('click', () => {
            INFO_SHEET.style.display = 'none';
            CONSENT_FORM.style.display = 'block';
            resolve();
        });
    });

    await startConsent;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.title.style.marginTop = '400px'; // Set the margin-top property

    let startSelections = new Promise((resolve, reject) => {
        consentBTN.addEventListener('click', async () => {
            CONSENT_FORM.style.display = 'none';
            window.title.style.marginTop = '0px'; // Set the margin-top property
            window.scrollTo({ top: 0, behavior: 'smooth' });
            try {
                await updateParticipantLog();
                resolve();
            } catch (error) {
                CONSENT_FORM.style.display = 'none';
                title.textContent = "Error 001.0.2";
                displayUsername.textContent = `Experiment flow error.`;
                handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
                reject(error);
            }
        });

        noConsentBTN.addEventListener('click', async function() {
            CONSENT_FORM.style.display = 'none';
            endMessage.innerHTML = `<h3>Thanks for considering our experiment.</h3>Click the button below to return to Prolific automatically, without completing the study.<br>Your completion code is <strong>${window.step.completionCode}</strong>`;
            ENDING_SCREEN.style.display = 'block';
            await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.step.completionCode}`);
            resolve();
        }); 
    });

    await startSelections;

}
