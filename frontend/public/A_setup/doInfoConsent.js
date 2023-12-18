// doInfoConsent.js

/*
 * updateHTMLWithInfoSheet
 * updateHTMLConsentQuestions
 * 
 */

async function doInfoConsent() {

    // INFO SHEET ////////////////////////////////////////
    let infoContainer = createDynContainer('infoContainer', null, style = {alignItems: 'start'});

    let infoFooter = createDynFooter(parentElement = infoContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        infoFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        3, // duration in seconds
        false, // removeOnComplete
    );

    let title = createDynTextElement(window.STR.infoTitle, 'Title', parentElement = infoContainer, style = {alignSelf: 'center'})

    let textMD = await getMDtext('infoSheet');
    
    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.3, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    //let subContainer = createDynContainer('subContainer', parentElement = infoContainer);
    let infoText = createDynTextElement(textMD, 'None', parentElement = infoContainer);
    console.log(`Rendered info text`);

    okInfoButton = createDynButton(
        window.STR.okInfoButtonText, // buttonText
        infoContainer, // parentElement
        {marginBottom: "50px", alignSelf: 'center'},
        { id: 'okInfoButton' }, // attributes
    );

    let okInfo = new Promise((resolve) => {
        okInfoButton.addEventListener('click', () => {
            infoContainer.remove();
            resolve();
        });
    });

    await okInfo;



    // CONSENT ////////////////////////////////////////

    let consentContainer = createDynContainer('consentContainer', null, style = {alignItems: 'start'});

    let consentFooter = createDynFooter(parentElement = consentContainer);

    let myProgressBar2 = createDynProgressBar(
        {}, // style // No additional styles
        consentFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar2, // progressBar
        90, // value
        3, // duration in seconds
        false, // removeOnComplete
    );

    let title2 = createDynTextElement(window.STR.consentTitle, 'Title', parentElement = consentContainer, style = {alignSelf: 'center'})

    const QandA = await fetchQuestions('consent');

    await updateProgressBar(
        myProgressBar2, // progressBar
        100, // value
        0.1, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    const QAElements = await createQuestionElements(QandA, consentContainer);

    let consentButtonsContainer = createDynContainer('consentButtonsContainer', consentContainer, style = {display: 'flex', flexDirection: 'row', alignSelf: 'center', minHeight: '130px'});// margin: "50px"

    consentButton = createDynButton(
        window.STR.consentButtonText, // buttonText
        consentButtonsContainer, // parentElement
        {marginBottom: "50px", alignSelf: 'center'},
        { id: 'consentButton' }, // attributes
    );
    noconsentButton = createDynButton(
        window.STR.quitAndReturnToProlific, // buttonText
        consentButtonsContainer, // parentElement
        {marginBottom: "50px", alignSelf: 'center'},
        { id: 'noconsentButton' }, // attributes
    );

    await toggleButton(QandA, consentButton, 'strict');
    console.log(`Rendered consent questions`);

    // Adding event listeners to each question element
    QAElements.forEach((QAElement, index) => {
        const radios = QAElement.querySelectorAll('.radioInput');
        const textFields = QAElement.querySelectorAll('.textField');
    
        // Adding click event listeners to radio inputs
        radios.forEach(radio => {
        radio.addEventListener('click', async () => {
            await toggleButton(QandA, consentButton, 'strict');
            // logRadioStates('.radioInput, .textField');
        });
        });
    
        // Adding input event listeners to text fields
        textFields.forEach(textField => {
        textField.addEventListener('input', async () => {
            await toggleButton(QandA, consentButton, 'strict');
            // logRadioStates('.radioInput, .textField');
        });
        });
    });


    let consentOrNot = new Promise((resolve, reject) => {
        consentButton.addEventListener('click', async () => {
            consentButtonsContainer.remove();
            QAElements.forEach(element => element.remove());

            updateParticipantLog(); // NOTE: not awaiting!

            consentContainer.remove();
            resolve();
        });

        noconsentButton.addEventListener('click', async function() {
            consentContainer.remove();
            bodyText = `${window.STR.clickToReturnNoStudyText}.<br>${window.STR.yourCompletionCodeIs} <strong>${window.step.completionCode}</strong>`;
            await redirectHandler(window.STR.thanksForConsidering, bodyText, window.step.completionCode, allowRetry=true);
        }); 
    });

    await consentOrNot;

}
