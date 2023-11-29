function respTextBox() {
    return new Promise((resolve, reject) => {
        const responseContainer = document.getElementById('responseContainer');
        const userInput = document.getElementById('userInput');
        const submitButton = document.getElementById('submitResponse');

        // Make the response elements visible
        responseContainer.style.display = 'block';

        // Event listener for the submit button
        submitButton.onclick = function() {
            resolve();
            /*
            const inputText = userInput.value;
            
            // Hide the response elements after submission
            responseContainer.style.display = 'none';

            // Send the data to the server
            fetch('/api/recordResults', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mainSheetID: window.expParams.mainSheetID,
                    prolificID: window.participant.prolificID,
                    inputText: inputText
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                resolve();
            })
            */
            .catch((error) => {
                console.error('Error:', error);
                // Adjust the error handling as per your application's logic
                title.textContent = "Error 005.1.3";
                displayUsername.textContent = `Experiment flow error.`;
                handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
                reject();
            })
            .finally(() => {
                // Reset the text input for next use
                userInput.value = '';
            });
        };
    });
}
