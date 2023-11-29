// doMiscDemo.js

/*
 * 
 */

async function doMiscDemoMCQs() {
    
    let allowedAnswers = []; // Array to hold the allowed answers for comparison

    try {
        const QandA = await updateHTMLRadioQuestions("miscDemo", "default"); // Fetch and render screening questions
        console.log(`Rendered miscDemoQA questions`);

        // Extract allowed answers from QandA for comparison
        allowedAnswers = QandA.map(item => item.answer);
    } catch (error) {
        console.error(`Failed to render miscDemo questions: ${error}`);
        SCREENING_FORM.style.display = 'none';
        title.textContent = "Error 003.0.1";
        displayUsername.textContent = `Experiment flow error.`;
        handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
        return; // Return early to prevent further execution
    }

    MISCDEMO_FORM.style.display = 'block';

    let startSelections = new Promise((resolve, reject) => {
        miscDemoBTN.addEventListener('click', async () => {
            const allRadios = Array.from(document.querySelectorAll('.miscDemoRadio'));
            //let userResponses = allRadios.filter(radio => radio.checked).map(radio => radio.value);
            let userResponses = [...document.querySelectorAll('.miscDemoRadio:checked, .miscDemoTextField')].map(input => input.type === 'radio' ? input.value : input.value.trim());


            const userResponsesStr = userResponses.join(',');
            console.log(`User Responses: ${userResponsesStr}`);
            MISCDEMO_FORM.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.title.style.marginTop = '0px'; // Set the margin-top property

            try {
                await updateParticipantLog();
                await generalNewLineUpdate("miscDemoResponse", userResponses);

                // Implement the pseudocode if-statement
                const isEligible = userResponses.every((response, index) => allowedAnswers[index] === undefined || response === allowedAnswers[index]);
                console.log(isEligible)
                console.log(window.step.completionCode)
                if (window.step.completionCode && !isEligible) {
                    SCREENING_FORM.style.display = 'none';
                    endMessage.innerHTML = `<h3>Thank you.</h3>Unfortunately, your miscDemo answers do not match those provided by Prolific. Please update your Prolific profile and try again. You do not currently qualify for this experiment. Click the button below to return to Prolific automatically, without completing the study.<br>Your completion code is <strong>${window.step.completionCode}</strong>`;
                    ENDING_SCREEN.style.display = 'block';
                    await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.step.completionCode}`);
                    resolve();
                    return; // Return early to prevent further execution
                }

                resolve();
            } catch (error) {
                MISCDEMO_FORM.style.display = 'none';
                title.textContent = "Error 002.0.2";
                displayUsername.textContent = `Experiment flow error.`;
                handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
                reject(error);
            }
        }); 
    });

    window.title.style.marginTop = '600px'; // Set the margin-top property
    await startSelections;
    window.title.style.display = 'none';
    
}