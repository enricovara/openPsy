
async function respGRID(fileName) {
    try {
        const GRIDcontainer = createDynContainer('GRIDcontainer', null, { justifyContent: 'center' });
        GRIDcontainer.innerHTML = GRID_HTMLcontent();

        const styleTag = document.createElement('style');
        styleTag.innerHTML = GRID_CSScontent();
        GRIDcontainer.appendChild(styleTag);

        // **Add Start Time**
        const startTime = new Date().getTime(); // Record the start time

        // Wait for user to make selections in each category
        const selectedValues = await waitForUserSelections(startTime, GRIDcontainer); // **Pass startTime and GRIDcontainer**
        console.log('User selections:', selectedValues);

        // Get the correct response from the filename
        const correctResponse = await getGRIDfromFilename(fileName);

        // **Check if all selections are correct**
        const isColorCorrect = selectedValues.selectedColor.toLowerCase() === correctResponse[0].toLowerCase();
        const isLetterCorrect = selectedValues.selectedLetter.toUpperCase() === correctResponse[1].toUpperCase();
        const isNumberCorrect = selectedValues.selectedNumber === correctResponse[2];

        const allCorrect = isColorCorrect && isLetterCorrect && isNumberCorrect;
        const correctness = allCorrect ? "correct" : "incorrect";
        
        // **Format the Response Array**
        // Concatenate the selected values into a single response
        const concatenatedResponse = `${selectedValues.selectedColor}${selectedValues.selectedLetter}${selectedValues.selectedNumber}`;

        // Concatenate the correct answer from the filename
        const correctAnswer = `${correctResponse[0]}${correctResponse[1]}${correctResponse[2]}`;

        // Create the responses array with two objects
        const responses = [
            { response: concatenatedResponse, reactionTime: selectedValues.reactionTime },
            { answer: correctAnswer, correct: correctness }
        ];

        return responses; // **Return the formatted array**

    } catch (error) {
        console.log(error);
    }
}


function waitForUserSelections(startTime, GRIDcontainer) { // **Accept startTime and GRIDcontainer as parameters**
    return new Promise(resolve => {
        const colorButtonElements = document.querySelectorAll('.colorButton');
        const letterButtonElements = document.querySelectorAll('.letterButton');
        const numberButtonElements = document.querySelectorAll('.numberButton');

        let selectedColor, selectedLetter, selectedNumber;

        colorButtonElements.forEach(button => {
            button.addEventListener('click', function() {
                clearSelectedClasses('.colorButton');
                this.classList.add('selected');
                selectedColor = this.textContent;
                checkSelections();
            });
        });

        letterButtonElements.forEach(button => {
            button.addEventListener('click', function() {
                clearSelectedClasses('.letterButton');
                this.classList.add('selected');
                selectedLetter = this.textContent;
                checkSelections();
            });
        });

        numberButtonElements.forEach(button => {
            button.addEventListener('click', function() {
                clearSelectedClasses('.numberButton');
                this.classList.add('selected');
                selectedNumber = this.textContent;
                checkSelections();
            });
        });

        function clearSelectedClasses(selector) {
            document.querySelectorAll(selector).forEach(button => {
                button.classList.remove('selected');
            });
        }

        function checkSelections() {
            if (selectedColor && selectedLetter && selectedNumber) {
                GRIDcontainer.remove();
                
                // **Calculate Reaction Time**
                const endTime = new Date().getTime();
                const reactionTime = endTime - startTime; // Time in milliseconds
                
                // **Resolve with Selected Values and Reaction Time**
                resolve({ 
                    selectedColor, 
                    selectedLetter, 
                    selectedNumber, 
                    reactionTime 
                });
            }
        }
    });
}



function getGRIDfromFilename(fileName) {
    console.log("Full Filename:", fileName);
    
    const colourMap = {
        'b': 'Blue',
        'g': 'Green',
        'r': 'Red',
        'w': 'White'
    };
  
    // Ensure the filename is long enough to prevent errors
    if (fileName.length < 9) {
        console.error("Filename is too short to extract required information.");
        return ["unknown", "unknown", "unknown"];
    }
  
    // Method 1: Using charAt with positive indices
    const colourCode = fileName.charAt(fileName.length - 9).toLowerCase();
    const letter = fileName.charAt(fileName.length - 7).toUpperCase();
    const digit = fileName.charAt(fileName.length - 6);
  
    console.log("Colour Code:", colourCode);
    console.log("Letter:", letter);
    console.log("Digit:", digit);
  
    // Method 2: Using slice (alternative approach)
    /*
    const colourCode = fileName.slice(-9, -8).toLowerCase();
    const letter = fileName.slice(-7, -6).toUpperCase();
    const digit = fileName.slice(-6, -5);
    */
  
    // Map the colour code to the actual colour
    const colour = colourMap[colourCode] || "unknown";
  
    // Return the extracted information
    return [colour, letter, digit];
}
