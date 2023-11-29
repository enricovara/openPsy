// consentFormUtils.js


/**
 * Fetch and populate the information sheet.
 * The sheet data is fetched from an API and injected into the HTML.
 */
async function updateHTMLWithMDtext(tabName) {
  try {
    const response = await fetch(`/api/getMDtext?mainSheetID=${window.expParams.mainSheetID}&tabName=${tabName}`);
    const data = await response.text();
    document.getElementById('infoSheet').innerHTML = data;

  } catch (error) {
    console.error(`Failed to fetch or populate information sheet: ${error}`);
    title.textContent = "Error 001.0.1";
    displayUsername.textContent = `Experiment flow error.`;
    await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
  }
}


/**
 * Fetches and populates questions based on the form type (e.g., consent, screening).
 * This function dynamically handles Yes/No questions, MCQs, and free text fields.
 * It also manages the enable/disable state of the form's submit button based on the formName parameter.
 * 
 * @param {string} formName - The name of the form (e.g., 'consent', 'screening').
 * @param {string} toggleLogic - The logic for enabling the submit button ('strict' for correct answers required, or 'default' for any answer).
 */
async function updateHTMLRadioQuestions(formName, toggleLogic) {
  try {
    const response = await fetch(`/api/questions?mainSheetID=${window.expParams.mainSheetID}&formType=${formName}`);
    const QandA = await response.json();
    let list = document.getElementById(`${formName}Questions`);
    
    console.log("QandA Data:", QandA);

    QandA.forEach((item, index) => {
      const { question, choices } = item;
      const listItem = document.createElement('li');
      listItem.className = "QandAItem";
    
      // Create a container for the question text
      const questionTextContainer = document.createElement('div');
      questionTextContainer.className = "questionContainer";
      questionTextContainer.textContent = question;
    
      // Create a container for the radio inputs
      const inputContainer = document.createElement('div');
      inputContainer.className = "inputContainer";
    
      if (choices && choices.length) {
        choices.forEach(choice => {
          const choiceContainer = document.createElement('div'); // New container for each choice
          choiceContainer.className = "radioContainer";
    
          const radioInput = document.createElement('input');
          radioInput.setAttribute("type", "radio");
          radioInput.setAttribute("name", `${formName}${index}`);
          radioInput.setAttribute("value", choice);
          radioInput.className = `${formName}Radio`;
    
          const label = document.createElement('label');
          label.textContent = choice;
    
          choiceContainer.appendChild(radioInput);
          choiceContainer.appendChild(label);
          inputContainer.appendChild(choiceContainer); // Add the radio button to the inputContainer
        });
      } else {
        // Handle the text field case
        const textField = document.createElement('input');
        textField.setAttribute("type", "text");
        textField.setAttribute("name", `${formName}${index}`);
        textField.className = `${formName}TextField`;
        inputContainer.appendChild(textField);
      }
    
      // Append question and input containers to the listItem
      listItem.appendChild(questionTextContainer);
      listItem.appendChild(inputContainer);
    
      // Append the listItem to the list
      list.appendChild(listItem);
    });

    list.addEventListener('click', function(event) {
      if (event.target.classList.contains(`${formName}Radio`)) {
        toggleButton(QandA, formName, toggleLogic);
        logRadioStates(`.${formName}Radio, .${formName}TextField`);
      }
    });
    
    // New text field event listener
    list.addEventListener('input', function(event) {
      if (event.target.classList.contains(`${formName}TextField`)) {
        toggleButton(QandA, formName, toggleLogic);
        logRadioStates(`.${formName}Radio, .${formName}TextField`);
      }
    });
    
    return QandA;


  } catch (error) {
    console.error(`Failed to fetch or populate ${formName} questions: ${error}`);
    title.textContent = "Error 001.1.1";
    displayUsername.textContent = `Experiment flow error.`;
    await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
  }
}


/**
 * Toggle the enable state of 'screeningBTN'.
 * The button will be enabled only when all radio buttons are answered.
 */
function toggleButton(QandA, formName, toggleLogic) {
  try {
    let allValid = true;
    QandA.forEach((item, index) => {
      const { question, choices, answer } = item;
      const inputs = document.querySelectorAll(`input[name="${formName}${index}"]`);

      if (toggleLogic === 'strict') {
        // Strict logic: Check if each input matches the allowed answer
        allValid = allValid && Array.from(inputs).some(input => input.value === answer && input.checked);
      } else {
        // Default logic: Check if each input is answered
        if (choices && choices.length) {
          allValid = allValid && Array.from(inputs).some(input => input.checked);
        } else {
          allValid = allValid && Array.from(inputs).some(input => input.value.trim() !== '');
        }
      }
    });

    const button = document.getElementById(`${formName}BTN`);
    button.disabled = !allValid;
  } catch (error) {
    console.error(`Failed to toggle the button: ${error}`);
  }
}


function logRadioStates(selector) {
  const inputs = document.querySelectorAll(selector);
  const states = Array.from(inputs).map(input => ({
    name: input.name,
    value: input.value,
    checked: input.type === 'radio' ? input.checked : undefined
  }));
  console.log(states);
}
