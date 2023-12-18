// doMiscDemo.js

/*
 * 
 */

async function doMiscDemoMCQs() {

    // MISCDEMO ////////////////////////////////////////

    let miscDemoContainer = createDynContainer('miscDemoContainer', null, style = {alignItems: 'start'});

    let miscDemoFooter = createDynFooter(parentElement = miscDemoContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        miscDemoFooter, // parentElement
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        3, // duration in seconds
        false, // removeOnComplete
    );

    let title = createDynTextElement(window.STR.miscDemoTitle, 'Title', parentElement = miscDemoContainer, style = {alignSelf: 'center'})

    let QandA = await fetchQuestions('miscDemo');

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.1, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    let QAElements = await createQuestionElements(QandA, miscDemoContainer);

    submitButton = createDynButton(
        window.STR.submitButtonText, // buttonText
        miscDemoContainer, // parentElement
        {marginBottom: "50px", alignSelf: 'center'},
        { id: 'submitButton' }, // attributes
    );

    await toggleButton(QandA, submitButton, 'default');
    console.log(`Rendered miscDemo questions`);

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
            miscDemoContainer.style.scrollBehavior = 'smooth';
            miscDemoContainer.scrollTop = miscDemoContainer.scrollHeight;


            let myProgressBar2 = createDynProgressBar(
                {}, // style // No additional styles
                miscDemoFooter, // parentElement // Appending to the loginContainer
                false // showValue // Not showing the progress value
            );
            updateProgressBar(
                myProgressBar2, // progressBar
                90, // value
                3, // duration
                false, // removeOnComplete
            );

            // get list of responses to each question (radio label or text input if free text question)
            let userResponses = await getuserResponses(QAElements, QandA);

            // turn them into a comma-separated string but only after removing all commas from the strings and replacing them with ";"
            let userResponsesStr = userResponses.map(response => response.replace(/,/g, ";")).join(',');

            await generalNewLineUpdate("miscDemoResponse", userResponses);

            // if (window.step.completionCode) {
            //     // Get allowed answers and Check eligibility
            //     const allowedAnswers = QandA.map(item => item.answer);
            //     const isEligible = userResponses.every((response, index) => 
            //         allowedAnswers[index] === undefined || response === allowedAnswers[index]
            //     );
            //     if (!isEligible) {
            //         miscDemoContainer.remove();
            //         await updateParticipantLog(ban = true);
            //         console.log("Rejecting user")
            //         const bodyText = `${window.STR.doNotQualify}.<br>${window.STR.clickToReturnToProlific}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.step.completionCode}</strong>`;
            //         await redirectHandler(window.STR.thanksForConsidering, bodyText, window.step.completionCode);
            //     }
            // }
            
            await updateParticipantLog();

            await updateProgressBar(
                myProgressBar2, // progressBar
                100, // value
                0.1, // duration
                true, // removeOnComplete
                350 // removeDelay
            );
            miscDemoContainer.remove();
            resolve();
        });
    });

    await submission;
    
}