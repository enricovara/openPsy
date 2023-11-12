// doInfoConsent.js

/*
 * updateHTMLWithInfoSheet
 * updateHTMLConsentQuestions
 * 
 */

async function doInfoConsent() {

    try {
    await updateHTMLWithInfoSheet();
    await updateHTMLConsentQuestions();
    console.log(`   Rendered info sheet and consent questions`);
    } catch (error) {
        console.error(`Failed to render info sheet and consent questions: ${error}`);
    }

        
    let startInfo = new Promise((resolve) => {
        startButton.addEventListener('click', () => {
            LOGIN_FORM.style.display = 'none';
            INFO_SHEET.style.display = 'block';
            resolve();  // Resolve the promise when button is clicked
        });
    });
    
    startButton.style.display = 'block';
    
    await startInfo;
    
    
    
    let startConsent = new Promise((resolve) => {
        infoContinueButton.addEventListener('click', () => {
            INFO_SHEET.style.display = 'none';
            CONSENT_FORM.style.display = 'block';
            resolve();  // Resolve the promise when button is clicked
        });
    });
    
    await startConsent;
    
    let startSelections = new Promise((resolve) => {
        consentBTN.addEventListener('click', () => {
            CONSENT_FORM.style.display = 'none';
            const datetime = new Date().toISOString();
            fetch('/api/updateStepWithText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mainSheetID: window.expParams.mainSheetID,
                    prolificID: window.participant.prolificID,
                    stepNumber: window.step.number,
                    inputText: datetime
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                resolve();
            })
            .catch((error) => {
                console.error('Error:', error);
                CONSENT_FORM.style.display = 'none';
                title.textContent = "Error 005.1.3";
                displayUsername.textContent = `Experiment flow error.`;
                handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
            })
            .finally(() => {
                resolve(); // This ensures the promise is resolved in case of success or failure.
            });
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