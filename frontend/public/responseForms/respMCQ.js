async function respMCQ(questionsAndAnswers) {
    try {

        let MCQcontainer = createDynContainer('MCQcontainer', null, style = {justifyContent: 'center'});
        
        const responses = [];

        let startTime;
        for (const qa of questionsAndAnswers) {
            // Create question text field
            createDynTextElement(qa.question, 'none', parentElement = MCQcontainer, style = {})

            // Create response container
            const responseContainer = document.createElement('div');
            MCQcontainer.appendChild(responseContainer);

            // Check if there are non-falsy responses
            if (qa.answers && qa.answers.length > 0) {
                // Pre-create a button for each answer with initial hidden visibility
                qa.answers.forEach(answer => {
                    const answerButton = createDynButton(answer, parentElement = responseContainer, style = {fontSize: '1.5em', margin: '10px', visibility: 'hidden'}, attributes = {})

                    answerButton.onclick = () => {
                        const reactionTime = new Date().getTime() - startTime;
                        responses.push({ answer: answer, reactionTime: reactionTime });
                        resolveNextQuestion(); // Function to move to the next question
                    };
                });

                // Make buttons visible and start timer
                setTimeout(() => {
                    responseContainer.childNodes.forEach(child => {
                        if (child.tagName === 'BUTTON') {
                            child.style.visibility = 'visible'; // Make buttons visible
                        }
                    });
                    startTime = new Date().getTime();
                }, 0); // Timeout set to 0 to allow the rendering cycle to complete
            } else {
                const textField = document.createElement('input');
                textField.type = 'text';
                responseContainer.appendChild(textField);
                const submitButton = createDynButton(window.STR.submitButtonText, parentElement = responseContainer, style = {fontSize: '1.5em', margin: '10px'}, attributes = {disabled: 'true'})

                // Add event listener to the text field
                textField.addEventListener('input', () => {
                    // Toggle submit button based on text field content
                    submitButton.disabled = textField.value.trim() === '';
                });

                submitButton.onclick = () => {
                    const reactionTime = new Date().getTime() - startTime;
                    responses.push({ answer: textField.value, time: reactionTime });
                    resolveNextQuestion(); // Function to move to the next question
                };
                startTime = new Date().getTime();
            }

            // Function to wait for response before moving to next question
            await new Promise(resolve => {
                window.resolveNextQuestion = () => {
                    MCQcontainer.remove(); // Remove container after resolution
                    resolve();
                };
            });
        }

        return responses; // Return an object like: [{ answer: 'Response', reactionTime: 1234 }, ...];

    } catch (error) {
        MCQcontainer.remove();
        reportErrorToServer(error);
        console.error('Error in MCQ in simpleblock:', error);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error ${window.step.number}.2.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }
}
