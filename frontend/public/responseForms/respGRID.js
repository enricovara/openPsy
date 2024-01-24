
async function respGRID() {
    try {
        const GRIDcontainer = createDynContainer('GRIDcontainer', null, { justifyContent: 'center' });
        GRIDcontainer.innerHTML = GRID_HTMLcontent();

        const styleTag = document.createElement('style');
        styleTag.innerHTML = GRID_CSScontent();
        GRIDcontainer.appendChild(styleTag);

        // Wait for user to make selections in each category
        const selectedValues = await waitForUserSelections();
        console.log('User selections:', selectedValues);
        return selectedValues;

    } catch (error) {
        console.log(error);
    }
}

function waitForUserSelections() {
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
                resolve({ selectedColor, selectedLetter, selectedNumber });
            }
        }
    });
}



function getGRIDfromFilename(filename) {
    const colourMap = {
      'b': 'Blue',
      'g': 'Green',
      'r': 'Red',
      'w': 'White'
    };
  
    // Extract the relevant parts from the filename
    const colourCode = filename.charAt(1).toLowerCase();
    const letter = filename.charAt(3).toUpperCase();
    const digit = filename.charAt(4);
  
    // Map the colour code to the actual colour
    const colour = colourMap[colourCode] || "unknown";
  
    // Return the extracted information
    return [colour, letter, digit];
  }
  