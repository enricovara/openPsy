window.addEventListener('load', async function () {

    window.prolificErrorCode = "ERROR_000_EXPERIMENT_DATABASE_NOT_FOUND";
    window.prolificCheckpointCode = "ERROR_000_COULD_NOT_FIND_CHECKPOINT";

    window.title = document.getElementById('title');
    window.displayUsername = document.getElementById('displayUsername');
    
    // display (temp) title
    title.style.display = 'block';


    LOGIN_FORM = document.getElementById('LOGIN_FORM');
    startButton = document.getElementById('startButton');
    ENDING_SCREEN = document.getElementById('ENDING_SCREEN');
    endMessage = document.getElementById('endMessage');
    returnToProlific = document.getElementById('returnToProlific');
    
    
    // ESTABLISH RELATIONSHIT WITH CONTROL ROOM SHEET
    await getBaseExpParams();
    
    const lastStepNumber = Math.max(...Object.keys(window.expParams.stepsParams).map(Number));
        
        // window.prolificErrorCode = data.prolificErrorCode;
        // window.participant.prolificID
        
        // window.expParams.mainSheetID
        
        // window.expParams.title
        // window.expParams.stepsParams
            // .stepsParams[step].stepNum
            // .stepsParams[step].type
            // .stepsParams[step].toDo
            // .stepsParams[step].completionCode
            // .stepsParams[step].status
    

    // CYCLE THROUGH THE EXPERIMENT STEPS

    // Define a mapping of step types to their corresponding functions
    const stepTypeFunctions = {
        "InfoConsent": doInfoConsent,
        //"ScreeningQs": doScreeningQs,
        //"CheckAudio": doCheckAudio,
        //"CheckBT": doCheckBT,
        //"CheckNoise": doCheckNoise,
        //"MiscDemoQs": doMiscDemoQs,
        //"CheckAttention": doCheckAttention,
    };
    
    let participantGreeted = 0;
        
    for (const step in expParams.stepsParams) {
            
        window.step = {...window.expParams.stepsParams[step]}; // shallow copy
        window.step.number = step;
    
        // If step exists and do is Always, or if not done and do is Once:
        // call the function based on step.type using the mapping object
        try{
            
            if (Object.values(window.expParams.stepsParams).some(step => step.status)) {
                if (!participantGreeted) { // if not greeted and ^ already left a log, any log
                    let continueFromCheckpointClicked = new Promise((resolve) => {
                        startButton.addEventListener('click', () => {
                            LOGIN_FORM.style.display = 'none';
                            resolve();  // Resolve the promise when button is clicked
                        });
                    });
                    
                    startButton.textContent = 'Continue from last checkpoint';
                    startButton.style.display = 'block';
                    
                    await continueFromCheckpointClicked;
                    participantGreeted = 1;
                }
            }
        
        
            if (window.step.toDo === "Always" || (window.step.toDo === "Once" && !window.step.status)) {
            
                if (window.step.type && stepTypeFunctions[window.step.type]) {
                
                    console.log(`Launching step ${window.step.number}.`);
                    await stepTypeFunctions[window.step.type]();
                    
                } else {
                    console.log(`Step function not defined, skipping ${window.step.number}.`);
                }
                    
            } else {
                
                console.log(`Skipping step ${window.step.number}.`);

            }

        } catch (error) {
            console.log(`Could not launch step ${window.step.number}.`);
            console.error(error);
            console.log(`   Redirecting user with error code`);
            title.textContent = "Error 004";
            displayUsername.textContent = `Platform error.`;
            await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificErrorCode}`);
        }
        
        console.log(``)
        
        const lastStepNumber = Math.max(...Object.keys(window.expParams.stepsParams).map(Number));
        console.log(typeof window.step.number, typeof lastStepNumber);

        if (parseInt(window.step.number, 10) === lastStepNumber) {
            console.log(`That's all folks`);
            title.textContent = "Thank you";
            endMessage.innerHTML = `<h3>You have completed the experiment.</h3>Click the button below to return to Prolific automatically.<br>Your completion code is <strong>${window.prolificCheckpointCode}</strong>`;
            ENDING_SCREEN.style.display = 'block';
            await handleRedirection(`https://app.prolific.co/submissions/complete?cc=${window.prolificCheckpointCode}`);
        }
    }
});


  /*


    async function executeSteps(numSteps) {
      try {
        for (let step = 1; step <= numSteps; step++) {
          const response = await fetch(`/api/yourEndpoint?step=${step}`);
          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }
    
          const data = await response.json();
          // Do something with the data for each step here.
          // E.g., update the UI, manipulate DOM, etc.
        }
      } catch (error) {
        console.error(`Failed to execute steps: ${error}`);
      }
    }

    if (prolificId) {
        // Check if the prolificId exists in the consent logs
        checkConsentLogs(prolificId).then(consentLog => {
            if (consentLog && consentLog.status === 'consentGiven') {
                // logic when consent is already given
                startButton.textContent = 'Continue from last checkpoint';
                startButton.addEventListener('click', function() {
                    LOGIN_FORM.style.display = 'none';
                    successfulLogin = true
                });
                startButton.style.display = 'block';
            } else {
                // Logic when consent is NOT already given
                // Load infoSheet and consentQuestions
                updateHTMLWithInfoSheet();
                updateHTMLConsentQuestions();
    
                startButton.addEventListener('click', function() {
                    LOGIN_FORM.style.display = 'none';
                    INFO_SHEET.style.display = 'block';
                });
                startButton.style.display = 'block';
                
                infoContinueButton.addEventListener('click', function() {
                    INFO_SHEET.style.display = 'none';
                    CONSENT_FORM.style.display = 'block';
    
                    // Existing consent buttons logic, but add saving to consent log
                    consentBTN.addEventListener('click', function() {
                        CONSENT_FORM.style.display = 'none';
                        const datetime = new Date().toISOString();
                        saveConsentLog(prolificId, 'consentGiven', datetime).then((statusCode) => {
                            if (statusCode === 200) {
                                successfulLogin = true;
                            } else {
                                console.log(`saveConsentLog unexpected status code: ${statusCode}`);
    
                            }
                        }).catch((error) => {
                            console.log("Error while saving consent log: ", error);
                        });
                    });
                    noConsentBTN.addEventListener('click', function() {
                        CONSENT_FORM.style.display = 'none';
                        endMessage.innerHTML = '<h3>Thanks for considering our experiment.</h3>Click the button below to return to Prolific automatically, without completing the study.<br>Your completion code is <strong>C4Z4O72V</strong>';
                        ENDING_SCREEN.style.display = 'block';
                        returnToProlific.addEventListener('click', function() {
                            window.location.href = "https://app.prolific.co/submissions/complete?cc=C4Z4O72V";
                        });
                    });   
                });                
            }
        });
    } else {
        setTimeout(function() {
            window.location.href = "https://app.prolific.co/submissions/complete?cc=CQ2L08V9";
        }, 10000);
    }
  
    // Clear the selected classes when resetting the page
    function clearSelectedClasses(buttonGroup) {
        var selectedButtons = buttonGroup.getElementsByClassName('selected');
        while (selectedButtons.length) {
            selectedButtons[0].classList.remove('selected');
        }
    }
    
    startButton.addEventListener('click', function() {
        if (prolificId) {
            fetchVideosForUser(prolificId);
        } else {
            console.log('hi', prolificId);
        }
        document.getElementById('title').style.display = 'none'; // Hide the title
        document.getElementById('displayUsername').style.display = 'none'; // Hide the title
        startButton.style.display = 'none'; // Hide the start button once the experiment begins
    });
    
    function fetchVideosForUser(userId) {
        fetch(`/api/videos/${userId}`).then(response => {
            if (!response.ok) {
                return response.json().then(err => {throw err;});
            }
            return response.json();
        }).then(data => {
            videosArray = data;
            loadNextVideo();
        }).catch(e => {
            if (e.message === 'User not found') {
                errorMsg.style.display = 'block';
            } else {
                console.error('Error fetching videos', e);
            }
        });
    }
    
    
    function loadNextVideo() {
        // Clear selections of previous video
        clearSelectedClasses(colorButtons);
        clearSelectedClasses(letterButtons);
        clearSelectedClasses(numberButtons);
    
        // Reset selections
        selectedColor = null;
        selectedLetter = null;
        selectedNumber = null;
        
        console.log(currentVideoIndex, videosArray.length);
        
        if (currentVideoIndex < videosArray.length) {
            videoElement.src = videosArray[currentVideoIndex];
            videoElement.style.display = 'block';
            videoElement.play().then(() => console.log('Video started playing')).catch(e => console.log('Error playing video', e));
        } else {
            console.log('No more videos to play');
            endMessage.style.display = 'block'; // show the end message when there are no more videos to play
            returnToProlificButton.style.display = 'block'; // show the "Quit and Return to Prolific" button
        }
    }
    
    videoElement.onended = function() {
        console.log('Video ended');
        this.style.display = 'none';
        colorButtons.style.display = 'flex';
        letterButtons.style.display = 'flex';
        numberButtons.style.display = 'flex';
        continueButton.style.display = 'block';
        for (var i = 0; i < colorButtonElements.length; i++) {
            colorButtonElements[i].style.display = 'block';
        }
        for (var i = 0; i < letterButtonElements.length; i++) {
            letterButtonElements[i].style.display = 'block';
        }
        for (var i = 0; i < numberButtonElements.length; i++) {
            numberButtonElements[i].style.display = 'block';
        }
    };
    
    for (var i = 0; i < colorButtonElements.length; i++) {
        colorButtonElements[i].addEventListener('click', function() {
            clearSelectedClasses(colorButtons);
            this.classList.add('selected');
            selectedColor = this.textContent;
            console.log('Color selected:', selectedColor);
            checkSelections();
        });
    }
    
    for (var i = 0; i < letterButtonElements.length; i++) {
        letterButtonElements[i].addEventListener('click', function() {
            clearSelectedClasses(letterButtons);
            this.classList.add('selected');
            selectedLetter = this.textContent;
            console.log('Letter selected:', selectedLetter);
            checkSelections();
        });
    }
    
    for (var i = 0; i < numberButtonElements.length; i++) {
        numberButtonElements[i].addEventListener('click', function() {
            clearSelectedClasses(numberButtons);
            this.classList.add('selected');
            selectedNumber = this.textContent;
            console.log('Number selected:', selectedNumber);
            checkSelections();
        });
    }
    
    continueButton.addEventListener('click', function() {
        sendSelectionsToServer(selectedColor, selectedLetter, selectedNumber);
        // Reset page
        colorButtons.style.display = 'none';
        letterButtons.style.display = 'none';
        numberButtons.style.display = 'none';
        continueButton.style.display = 'none';
        continueButton.disabled = true;
        for (var j = 0; j < colorButtonElements.length; j++) {
            colorButtonElements[j].style.display = 'none';
        }
        for (var j = 0; j < letterButtonElements.length; j++) {
            letterButtonElements[j].style.display = 'none';
        }
        for (var j = 0; j < numberButtonElements.length; j++) {
            numberButtonElements[j].style.display = 'none';
        }
        currentVideoIndex++;
        loadNextVideo();
    });
    
    function checkSelections() {
        if (selectedColor && selectedLetter && selectedNumber) {
            continueButton.disabled = false;
        }
    }
    
    function sendSelectionsToServer(color, letter, number) {
        var userName = prolificId;
        console.log(`Sending color ${color}, letter ${letter} and number ${number} for user ${userName} to server.`);
        fetch('/api/selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userName, color, letter, number })
        }).then(response => {
            if (response.ok) {
                console.log('Selections sent to the server successfully.');
                selectedColor = null;  // Reset the color selection.
                selectedLetter = null;  // Reset the letter selection.
                selectedNumber = null;  // Reset the number selection.
            } else {
                console.error('Error:', response.statusText);
            }
        }).catch(e => console.error('Error sending selections to server:', e));
    }
  
  
  
    
    
    
    
    
    
    
    var consentSection = document.getElementById('consentSection');
    var consentButton = document.getElementById('consentButton');


    var videoElement = document.getElementById('myVideo');
    var colorButtons = document.getElementById('colorButtons');
    var letterButtons = document.getElementById('letterButtons');
    var numberButtons = document.getElementById('numberButtons');
    var colorButtonElements = colorButtons.getElementsByClassName('colorButton');
    var letterButtonElements = letterButtons.getElementsByClassName('letterButton');
    var numberButtonElements = numberButtons.getElementsByClassName('numberButton');
    var continueButton = document.getElementById('continueButton');
    var errorMsg = document.getElementById('errorMsg');
    var endMessage = document.getElementById('endMessage');
    var returnToProlificButton = document.getElementById('returnToProlific');



    var videosArray = [];
    var currentVideoIndex = 0;
    var selectedColor, selectedLetter, selectedNumber;
    
    // Clear the selected classes when resetting the page
    function clearSelectedClasses(buttonGroup) {
        var selectedButtons = buttonGroup.getElementsByClassName('selected');
        while (selectedButtons.length) {
            selectedButtons[0].classList.remove('selected');
        }
    }
    
    startButton.addEventListener('click', function() {
        if (prolificId) {
            fetchVideosForUser(prolificId);
        } else {
            console.log('hi', prolificId);
        }
        document.getElementById('title').style.display = 'none'; // Hide the title
        document.getElementById('displayUsername').style.display = 'none'; // Hide the title
        startButton.style.display = 'none'; // Hide the start button once the experiment begins
    });
    
    function fetchVideosForUser(userId) {
        fetch(`/api/videos/${userId}`).then(response => {
            if (!response.ok) {
                return response.json().then(err => {throw err;});
            }
            return response.json();
        }).then(data => {
            videosArray = data;
            loadNextVideo();
        }).catch(e => {
            if (e.message === 'User not found') {
                errorMsg.style.display = 'block';
            } else {
                console.error('Error fetching videos', e);
            }
        });
    }


    function loadNextVideo() {
        // Clear selections of previous video
        clearSelectedClasses(colorButtons);
        clearSelectedClasses(letterButtons);
        clearSelectedClasses(numberButtons);

        // Reset selections
        selectedColor = null;
        selectedLetter = null;
        selectedNumber = null;
        
        console.log(currentVideoIndex, videosArray.length);
        
        if (currentVideoIndex < videosArray.length) {
            videoElement.src = videosArray[currentVideoIndex];
            videoElement.style.display = 'block';
            videoElement.play().then(() => console.log('Video started playing')).catch(e => console.log('Error playing video', e));
        } else {
            console.log('No more videos to play');
            endMessage.style.display = 'block'; // show the end message when there are no more videos to play
            returnToProlificButton.style.display = 'block'; // show the "Quit and Return to Prolific" button
        }
    }
    
    videoElement.onended = function() {
        console.log('Video ended');
        this.style.display = 'none';
        colorButtons.style.display = 'flex';
        letterButtons.style.display = 'flex';
        numberButtons.style.display = 'flex';
        continueButton.style.display = 'block';
        for (var i = 0; i < colorButtonElements.length; i++) {
            colorButtonElements[i].style.display = 'block';
        }
        for (var i = 0; i < letterButtonElements.length; i++) {
            letterButtonElements[i].style.display = 'block';
        }
        for (var i = 0; i < numberButtonElements.length; i++) {
            numberButtonElements[i].style.display = 'block';
        }
    };

    for (var i = 0; i < colorButtonElements.length; i++) {
        colorButtonElements[i].addEventListener('click', function() {
            clearSelectedClasses(colorButtons);
            this.classList.add('selected');
            selectedColor = this.textContent;
            console.log('Color selected:', selectedColor);
            checkSelections();
        });
    }

    for (var i = 0; i < letterButtonElements.length; i++) {
        letterButtonElements[i].addEventListener('click', function() {
            clearSelectedClasses(letterButtons);
            this.classList.add('selected');
            selectedLetter = this.textContent;
            console.log('Letter selected:', selectedLetter);
            checkSelections();
        });
    }

    for (var i = 0; i < numberButtonElements.length; i++) {
        numberButtonElements[i].addEventListener('click', function() {
            clearSelectedClasses(numberButtons);
            this.classList.add('selected');
            selectedNumber = this.textContent;
            console.log('Number selected:', selectedNumber);
            checkSelections();
        });
    }

    continueButton.addEventListener('click', function() {
        sendSelectionsToServer(selectedColor, selectedLetter, selectedNumber);
        // Reset page
        colorButtons.style.display = 'none';
        letterButtons.style.display = 'none';
        numberButtons.style.display = 'none';
        continueButton.style.display = 'none';
        continueButton.disabled = true;
        for (var j = 0; j < colorButtonElements.length; j++) {
            colorButtonElements[j].style.display = 'none';
        }
        for (var j = 0; j < letterButtonElements.length; j++) {
            letterButtonElements[j].style.display = 'none';
        }
        for (var j = 0; j < numberButtonElements.length; j++) {
            numberButtonElements[j].style.display = 'none';
        }
        currentVideoIndex++;
        loadNextVideo();
    });

    function checkSelections() {
        if (selectedColor && selectedLetter && selectedNumber) {
            continueButton.disabled = false;
        }
    }

    function sendSelectionsToServer(color, letter, number) {
        var userName = prolificId;
        console.log(`Sending color ${color}, letter ${letter} and number ${number} for user ${userName} to server.`);
        fetch('/api/selection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userName, color, letter, number })
        }).then(response => {
            if (response.ok) {
                console.log('Selections sent to the server successfully.');
                selectedColor = null;  // Reset the color selection.
                selectedLetter = null;  // Reset the letter selection.
                selectedNumber = null;  // Reset the number selection.
            } else {
                console.error('Error:', response.statusText);
            }
        }).catch(e => console.error('Error sending selections to server:', e));
    }
    
    
    // ########################## RETURN TO PROLIFIC ##########################
    
    noConsentBTN.addEventListener('click', function() {
        window.location.href = "https://app.prolific.co/submissions/complete?cc=C157BQGO";
    });
    
    returnToProlificButton.addEventListener('click', function() {
        window.location.href = "https://app.prolific.co/submissions/complete?cc=C157BQGO";
    });
    
    */