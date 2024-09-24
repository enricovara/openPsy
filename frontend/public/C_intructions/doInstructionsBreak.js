// doInstructionsBreak.js

/*
 * updateHTMLWithInfoSheet
 * updateHTMLConsentQuestions
 * 
 */

async function doInstrBreak() {

    let instructionsContainer = createDynContainer('instructionsContainer', null, style = {alignItems: 'start'});

    let instructionsFooter = createDynFooter(parentElement = instructionsContainer);

    let myProgressBar = createDynProgressBar(
        {}, // style // No additional styles
        instructionsFooter, // parentElement // Appending to the loginContainer
        false // showValue // Not showing the progress value
    );

    updateProgressBar(
        myProgressBar, // progressBar
        90, // value
        3, // duration in seconds
        false, // removeOnComplete
    );

    let title = createDynTextElement(window.STR.instructionsTitle, 'Title', parentElement = instructionsContainer, style = {alignSelf: 'center'})

    // let textMD = await getMDtext('instrBreak'); 
    let textMD = await getMDtext(`instrBreak${window.step.version || ''}`);

    await updateProgressBar(
        myProgressBar, // progressBar
        100, // value
        0.3, // duration
        true, // removeOnComplete
        150 // removeDelay
    );

    let infoText = createDynTextElement(textMD, 'None', parentElement = instructionsContainer);
    console.log(`Rendered instruction text`);

    okUnderstoodButton = createDynButton(
        window.STR.understoodButtonText, // buttonText
        instructionsContainer, // parentElement
        {marginBottom: "50px", alignSelf: 'center'},
        { id: 'okUnderstoodButton' }, // attributes
    );

    let okInstructions = new Promise((resolve) => {
        okUnderstoodButton.addEventListener('click', async () => {

            updateParticipantLog();

            instructionsContainer.remove();

            resolve();
        });
    });

    await okInstructions;
    
}
