// consentFormUtils.js

/**
 * Fetch and populate the information sheet.
 * The sheet data is fetched from an API and injected into the HTML.
 */
async function updateHTMLWithInfoSheet() {
  try {
    const response = await fetch(`/api/infoSheet`);
    const data = await response.text();
    document.getElementById('infoSheet').innerHTML = data;

  } catch (error) {
    console.error(`Failed to fetch or populate information sheet: ${error}`);
  }
}
      
      

/**
 * Fetch and populate the consent questions along with associated Yes/No radio buttons.
 * Also manages the enable/disable state of the 'consentBTN'.
 */
async function updateHTMLConsentQuestions() {
  try {
    const response = await fetch(`/api/consentQuestions`);
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    const list = document.getElementById('consentQuestions');
    data.forEach((question, index) => {
      const listItem = document.createElement('li');
      listItem.className = "consentItem";
      listItem.innerHTML = `
        <div class="questionContainer">
          <div class="questionText">${question}</div>
          <div class="radioContainer">
            <input type="radio" name="consent${index}" value="Y" class="consentRadio"> Y
            <input type="radio" name="consent${index}" value="N" class="consentRadio"> N
          </div>
        </div>`;
      list.appendChild(listItem);
    });

    // Event listener to toggle the enable state of 'consentBTN'
    list.addEventListener('click', function(event) {
      if (event.target.classList.contains('consentRadio')) {
        toggleConsentButton();
      }
    });

  } catch (error) {
    console.error(`Failed to fetch or populate consent questions: ${error}`);
  }
}



/**
 * Toggle the enable state of 'consentBTN'.
 * The button will be enabled only when all radio buttons are set to 'Y'.
 */
function toggleConsentButton() {
  try {
    const allRadios = Array.from(document.querySelectorAll('.consentRadio'));
    const checkedYs = allRadios.filter(radio => radio.checked && radio.value === 'Y');
    const consentBtn = document.getElementById('consentBTN');
    
    // Enable or disable 'consentBTN' based on whether all radios are checked as 'Y'
    consentBtn.disabled = checkedYs.length !== allRadios.length / 2;

  } catch (error) {
    console.error(`Failed to toggle the consent button: ${error}`);
  }
}


/**
 * Fetch from or Post to consent log tab
 */
async function checkConsentLogs() {
    const response = await fetch(`/api/getConsentLogs/${prolificID}/${mainSheetID}`);
    const data = await response.json();
    return data;
}
async function saveConsentLog(prolificId, status, datetime) {
    await fetch('/api/appendConsentLog', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prolificId, status, datetime})
    });
}