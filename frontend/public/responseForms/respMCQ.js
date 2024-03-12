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
                        clearTimeout(autoSubmitTimeout);
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

                // Auto-submit timeout setup
                let autoSubmitTimeout = setTimeout(() => {
                    responses.push({ answer: "TIMED_OUT", reactionTime: 20000 });
                    resolveNextQuestion();
                }, 20000); // 20 seconds

            } else {
                const textField = document.createElement('input');
                textField.style.width = '600px';  // Set the width as needed
                textField.type = 'text';
                responseContainer.appendChild(textField);
                const submitButton = createDynButton(window.STR.submitButtonText, parentElement = responseContainer, style = {fontSize: '1.5em', margin: '10px'}, attributes = {disabled: 'true'})
                toggleButtonMCQ(textField, submitButton); // Toggle submit button based on text field content

                // Add event listener to the text field
                textField.addEventListener('input', () => {
                    toggleButtonMCQ(textField, submitButton); // Toggle submit button based on text field content
                });

                // Auto-submit timeout setup
                let autoSubmitTimeout = setTimeout(() => {
                    responses.push({ answer: textField.value || "TIMED_OUT", reactionTime: 20000 });
                    resolveNextQuestion();
                }, 20000); // 20 seconds

                // Add keypress event listener to the text field for Enter key
                textField.addEventListener('keypress', (event) => {
                    if (event.key === "Enter" && textField.value.trim() !== '') {
                        event.preventDefault(); // Prevent the default action
                        clearTimeout(autoSubmitTimeout);
                        const reactionTime = new Date().getTime() - startTime;
                        responses.push({ answer: textField.value.trim(), time: reactionTime });
                        resolveNextQuestion(); // Function to move to the next question
                    }
                });

                submitButton.onclick = () => {
                    clearTimeout(autoSubmitTimeout);
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


/**
 * Toggles the enabled state of a specified button based on the answers to questions.
 * The function iterates through the provided questions and answers, checking if the
 * conditions specified by the toggle logic are met. If all conditions are satisfied,
 * the button is enabled; otherwise, it is disabled.
 *
 * @param {Object[]} textField
 * @param {HTMLElement} button - The button element to be toggled.
 */
async function toggleButtonMCQ(textField, button) {

    button.disabled = textField.value.trim() === '';
    if (button.disabled) {
        button.style.backgroundColor = 'gray';
        button.style.color = 'lightgray';
        button.style.cursor = 'default';
    } else {
        button.style.backgroundColor = 'blue'; // original color
        button.style.color = 'white'; // original text color
        button.style.cursor = 'pointer'; // original cursor
    }

}