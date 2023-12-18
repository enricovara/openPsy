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

    let textMD = await getMDtext('instrBreak');

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

            okUnderstoodButton.disabled = true;
            okUnderstoodButton.style.marginBottom = "100px";
            okUnderstoodButton.style.backgroundColor = 'gray';
            okUnderstoodButton.style.color = 'lightgray';
            okUnderstoodButton.style.cursor = 'default';
            instructionsContainer.style.scrollBehavior = 'smooth';
            instructionsContainer.scrollTop = instructionsContainer.scrollHeight;

            let myProgressBar2 = createDynProgressBar(
                {}, // style // No additional styles
                instructionsFooter, // parentElement // Appending to the loginContainer
                false // showValue // Not showing the progress value
            );
            updateProgressBar(
                myProgressBar2, // progressBar
                90, // value
                5, // duration
                false, // removeOnComplete
            );

            await updateParticipantLog();

            await updateProgressBar(
                myProgressBar2, // progressBar
                100, // value
                0.1, // duration
                true, // removeOnComplete
                350 // removeDelay
            );

            instructionsContainer.remove();

            resolve();
        });
    });

    await okInstructions;
    
}
