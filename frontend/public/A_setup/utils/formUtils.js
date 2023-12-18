// consentFormUtils.js


/**
 * Fetches formatted markdown text from a specified tab in a sheet.
 * 
 * This asynchronous function sends a GET request to a server-side API and retrieves markdown text data.
 * The text data is intended for injection into HTML content. In case of an error, it logs the error,
 * reports it to the server, and redirects the user with an error message.
 * 
 * @param {string} tabName - The name of the tab in the sheet from which the markdown text is fetched.
 * @returns {Promise<string>} A promise that resolves to the markdown text data as a string. 
 * 
 */
async function getMDtext(tabName) {
  try {
    const response = await fetch(`/api/getMDtext?mainSheetID=${window.expParams.mainSheetID}&tabName=${tabName}`);
    const data = await response.text();
    return data

  } catch (error) {
    console.error(`Failed to fetch or populate information sheet: ${error}`);
    await reportErrorToServer(error);
    console.log(`   Redirecting user with error code`);
    await redirectHandler(`Error ${window.step.number}.1.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
  }
}


/**
 * Fetches questions for a specific form type.
 * The function makes an API call to retrieve questions and their corresponding choices 
 * based on the form name provided. It handles any errors during the fetch process and 
 * ensures proper error reporting and user redirection in case of failure.
 *
 * @param {string} formName - The name of the form for which questions are to be fetched.
 * @returns {Promise<Object[]>} A promise that resolves to an array of questions and choices.
 */
async function fetchQuestions(formName) {
  try {
    const response = await fetch(`/api/questions?mainSheetID=${window.expParams.mainSheetID}&formType=${formName}`);
    const questions = await response.json();
    return questions;
  } catch (error) {
    console.error(`Failed to fetch ${formName} questions: ${error}`);
    await reportErrorToServer(error);
    console.log(`   Redirecting user with error code`);
    await redirectHandler(`Error ${window.step.number}.1.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
  }
}

/**
 * Creates dynamic HTML elements for a set of questions.
 * The function generates HTML elements for each question and its choices (if any), 
 * and appends them to a specified parent container. It returns the created HTML 
 * elements for further manipulation outside the function.
 *
 * @param {Object[]} questions - An array of question objects, each with a question text and an array of choices.
 * @param {HTMLElement} parentContainer - The parent HTML element to which the question elements will be appended.
 * @returns {HTMLElement[]} An array of the created list item elements.
 */
async function createQuestionElements(questions, parentContainer) {
  try {
    let createdElements = [];

    questions.forEach((item, index) => {
      const { question, choices } = item;
      const listItem = document.createElement('ul');
      listItem.className = "QandAItem";
    
      // Create a container for the question text
      const questionTextContainer = document.createElement('div');
      questionTextContainer.className = "questionContainer";
      questionTextContainer.innerHTML = question;
    
      // Create a container for the inputs
      const inputContainer = document.createElement('div');
      inputContainer.className = "inputContainer";
    
      if (choices && choices.length) {
        choices.forEach(choice => {
          const radioInput = document.createElement('input');
          radioInput.setAttribute("type", "radio");
          radioInput.setAttribute("name", `question${index}`);
          radioInput.setAttribute("value", choice);
          radioInput.className = `radioInput`;
    
          const label = document.createElement('label');
          label.textContent = choice;
    
          inputContainer.appendChild(radioInput);
          inputContainer.appendChild(label);
        });
      } else {
        // Handle the text field case
        const textField = document.createElement('input');
        textField.setAttribute("type", "text");
        textField.setAttribute("name", `question${index}`);
        textField.className = `textField`;
        inputContainer.appendChild(textField);
      }
    
      // Append question and input containers to the listItem
      listItem.appendChild(questionTextContainer);
      listItem.appendChild(inputContainer);
    
      // Append the listItem to the parent container
      parentContainer.appendChild(listItem);

      // Add the listItem to the array of created elements
      createdElements.push(listItem);
    });

    return createdElements;

  } catch (error) {
    console.error(`Failed to fetch create question elements: ${error}`);
    await reportErrorToServer(error);
    console.log(`   Redirecting user with error code`);
    await redirectHandler(`Error ${window.step.number}.1.3`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
  } 
}


/**
 * Toggles the enabled state of a specified button based on the answers to questions.
 * The function iterates through the provided questions and answers, checking if the
 * conditions specified by the toggle logic are met. If all conditions are satisfied,
 * the button is enabled; otherwise, it is disabled.
 *
 * @param {Object[]} QandA - An array of question objects, each with a question text, an array of choices, and the correct answer.
 * @param {HTMLElement} button - The button element to be toggled.
 * @param {string} toggleLogic - The logic for enabling the button ('strict' for correct answers required, or 'default' for any answer).
 */
async function toggleButton(QandA, button, toggleLogic) {
  try {
    // console.log(`toggleButton called with QandA:`, QandA, `button:`, button, `toggleLogic:`, toggleLogic);

    let allValid = true;
    let conditionChecks = [];

    QandA.forEach((item, index) => {
      const { choices, answer } = item;
      const inputs = document.querySelectorAll(`input[name="question${index}"]`);
      // console.log(`Checking question ${index} with choices:`, choices, `and answer:`, answer, `found inputs:`, inputs);

      if (toggleLogic === 'strict') {
        let isAnswerValid;
        if (choices && choices.length) { // Handling for radio buttons
          isAnswerValid = Array.from(inputs).some(input => input.value === answer && input.checked);
        } else { // Handling for text inputs
          isAnswerValid = inputs[0].value.trim() === answer; // Assuming there's only one text input per question
        }
        // console.log(`Question ${index} answer valid:`, isAnswerValid);
        conditionChecks.push(isAnswerValid);
        allValid = allValid && isAnswerValid;
      } else { // Handling for 'default' logic
        let isQuestionAnswered;
        if (choices && choices.length) { // Check if at least one radio button is selected
          isQuestionAnswered = Array.from(inputs).some(input => input.checked);
        } else { // Check if the text input is not empty
          isQuestionAnswered = inputs[0].value.trim() !== ''; // Assuming there's only one text input per question
        }
        // console.log(`Question ${index} answered:`, isQuestionAnswered);
        conditionChecks.push(isQuestionAnswered);
        allValid = allValid && isQuestionAnswered;
      }
    });

    // console.log(`Condition checks:`, conditionChecks);
    // console.log(`Final decision - allValid:`, allValid);
    // console.log(`Button's actual disabled status:`, button.disabled);
    button.disabled = !allValid;

  // Style updates for disabled/enabled states
  if (button.disabled) {
    button.style.backgroundColor = 'gray';
    button.style.color = 'lightgray';
    button.style.cursor = 'default';
  } else {
    button.style.backgroundColor = 'blue'; // original color
    button.style.color = 'white'; // original text color
    button.style.cursor = 'pointer'; // original cursor
  }

  } catch (error) {
    console.error(`Failed to toggle the button: ${error}`);
    await reportErrorToServer(error);
    console.log(`   Redirecting user with error code`);
    await redirectHandler(`Error ${window.step.number}.1.4`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
  }
}


/**
 * Logs the states of input elements (radio buttons or text fields) to the console.
 * This function is primarily used for debugging purposes to monitor the current state of form inputs.
 * 
 * @param {string} selector - A CSS selector string used to target the input elements.
 */
function logRadioStates(selector) {
  const inputs = document.querySelectorAll(selector);
  const states = Array.from(inputs).map(input => {
    let state = {
      name: input.name,
      value: input.value
    };

    if (input.type === 'radio') {
      state.checked = input.checked;
    } else if (input.type === 'text') {
      state.filledIn = input.value.trim() !== '';  // Check if the text input is not empty
    }

    return state;
  });

  console.log("Input States:", states);
}


/**
 * Retrieves user responses from a set of questions.
 * This function collects the responses for both radio button inputs and text fields.
 * It's typically used to gather data from surveys or forms.
 *
 * @returns {Array<string>} An array of strings representing the user responses. For radio inputs, it returns the value of the selected radio button; for text inputs, it returns the entered text.
 */
async function getuserResponses(QAElements, QandA) {

  try {

    const userResponses = QAElements.map((QAElement, index) => {
      const inputType = QandA[index].choices ? 'radio' : 'text';
      if (inputType === 'radio') {
      const selectedRadio = QAElement.querySelector('.radioInput:checked');
      return selectedRadio ? selectedRadio.value : '';
      } else {
      const textField = QAElement.querySelector('.textField');
      return textField ? textField.value : '';
      }
    })

    return userResponses;
  } catch {
    console.error('Error:', error);
    console.error(`There was a problem gettng user responses`);
    console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
    console.log(`   Redirecting user with error code`);
    reportErrorToServer(error);
    await redirectHandler(`Error ${window.step.number}.1.4`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
  }
}
