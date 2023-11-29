async function respMCQ(questionsAndAnswers) {
    try {
        window.title.style.marginBottom = '-400px'; // Set the margin-top property
        const responses = [];
        const container = document.createElement('div');
        container.id = 'questionContainer';
        document.body.appendChild(container);
        container.style.display = 'block';

        let startTime;
        for (const qa of questionsAndAnswers) {
            // Create question text field
            const questionText = document.createElement('p');
            questionText.textContent = qa.question;
            container.appendChild(questionText);

            // Create response container
            const responseContainer = document.createElement('div');
            container.appendChild(responseContainer);

            // Check if there are non-falsy responses
            if (qa.answers && qa.answers.length > 0) {
                // Pre-create a button for each answer with initial hidden visibility
                qa.answers.forEach(answer => {
                    const answerButton = document.createElement('button');
                    answerButton.textContent = answer;
                    answerButton.style.fontSize = '1.5em';
                    answerButton.style.marginLeft = '10px';
                    answerButton.style.marginRight = '10px';
                    answerButton.style.visibility = 'hidden'; // Initially hidden
                    responseContainer.appendChild(answerButton);

                    answerButton.onclick = () => {
                        const reactionTime = new Date().getTime() - startTime;
                        responses.push({ answer: answer, reactionTime: reactionTime });
                        responseContainer.style.display = 'none';
                        questionText.style.display = 'none';
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

                const submitButton = document.createElement('button');
                submitButton.textContent = 'Submit';
                submitButton.style.fontSize = '1.5em';
                submitButton.style.marginLeft = '10px';
                submitButton.style.marginRight = '10px';
                submitButton.disabled = true; // Initially disable the submit button

                // Add event listener to the text field
                textField.addEventListener('input', () => {
                    // Toggle submit button based on text field content
                    submitButton.disabled = textField.value.trim() === '';
                });

                submitButton.onclick = () => {
                    const reactionTime = new Date().getTime() - startTime;
                    responses.push({ answer: textField.value, time: reactionTime });
                    responseContainer.style.display = 'none';
                    questionText.style.display = 'none';
                    resolveNextQuestion(); // Function to move to the next question
                };
                responseContainer.appendChild(submitButton);
            }

            // Function to wait for response before moving to next question
            await new Promise(resolve => {
                window.resolveNextQuestion = resolve;
            });
        }

        return responses; // Return an object like: [{ answer: 'Response', reactionTime: 1234 }, ...];

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('questionContainer').style.display = 'none';
        title.textContent = "Error 006.0.3";
        displayUsername.textContent = `Experiment flow error.`;
        handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
    }
}
