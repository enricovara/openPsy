// doScreening.js

/*
 * 
 */

async function doScreeningQs() {

    // SCREENING ////////////////////////////////////////

    let screeningContainer = createDynContainer('screeningContainer', null, style = {alignItems: 'start'});

    let screeningFooter = createDynFooter(parentElement = screeningContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        screeningFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        3, // duration in seconds
        false, // removeOnComplete
    );

    let title = createDynTextElement(window.STR.screeningTitle, 'Title', parentElement = screeningContainer, style = {alignSelf: 'center'})

    let QandA = await fetchQuestions('screening');

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.1, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    let QAElements = await createQuestionElements(QandA, screeningContainer);

    submitButton = createDynButton(
        window.STR.submitButtonText, // buttonText
        screeningContainer, // parentElement
        {marginBottom: "50px", alignSelf: 'center'},
        { id: 'submitButton' }, // attributes
    );

    await (QandA, submitButton, 'default');
    console.log(`Rendered screening questions`);

    // Adding event listeners to each question element
    QAElements.forEach((QAElement, index) => {
        const radios = QAElement.querySelectorAll('.radioInput');
        const textFields = QAElement.querySelectorAll('.textField');
    
        // Adding click event listeners to radio inputs
        radios.forEach(radio => {
        radio.addEventListener('click', async () => {
            await toggleButton(QandA, submitButton, 'default');
            // logRadioStates('.radioInput, .textField');
        });
        });
    
        // Adding input event listeners to text fields
        textFields.forEach(textField => {
        textField.addEventListener('input', async () => {
            await toggleButton(QandA, submitButton, 'default');
            // logRadioStates('.radioInput, .textField');
        });
        });
    });


    let submission = new Promise((resolve, reject) => {
        submitButton.addEventListener('click', async () => {

            submitButton.disabled = true;
            submitButton.style.marginBottom = "100px";
            submitButton.style.backgroundColor = 'gray';
            submitButton.style.color = 'lightgray';
            submitButton.style.cursor = 'default';
            screeningContainer.style.scrollBehavior = 'smooth';
            screeningContainer.scrollTop = screeningContainer.scrollHeight;

            let myProgressBar2 = createDynProgressBar(
                {}, // style // No additional styles
                screeningFooter, // parentElement // Appending to the loginContainer
                false // showValue // Not showing the progress value
            );
            updateProgressBar(
                myProgressBar2, // progressBar
                90, // value
                10, // duration
                false, // removeOnComplete
            );

            // get list of responses to each question (radio label or text input if free text question)
            let userResponses = await getuserResponses(QAElements, QandA);

            // turn them into a comma-separated string but only after removing all commas from the strings and replacing them with ";"
            let userResponsesStr = userResponses.map(response => response.replace(/,/g, ";")).join(',');

            await generalNewLineUpdate("screeningResponse", userResponses);

            if (window.step.completionCode) {
                // Get allowed answers and Check eligibility
                const allowedAnswers = QandA.map(item => item.answer);
                const isEligible = userResponses.every((response, index) => 
                    allowedAnswers[index] === undefined || response === allowedAnswers[index]
                );
                if (!isEligible) {
                    screeningContainer.remove();
                    await updateParticipantLog(ban = true);
                    console.log("Rejecting user")
                    const bodyText = `${window.STR.doNotQualify}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.step.completionCode}</strong>`;
                    await redirectHandler(window.STR.thanksForConsidering, bodyText, window.step.completionCode);
                }
            }
            
            await updateParticipantLog();

            await updateProgressBar(
                myProgressBar2, // progressBar
                100, // value
                0.15, // duration
                true, // removeOnComplete
                350 // removeDelay
            );
            screeningContainer.remove();
            resolve();
        });
    });

    await submission;
    
}