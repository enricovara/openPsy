// staircaseUtils.js

//const { fancylog } = require("../../../../backend/utils");

const selectedAnswers = {
    color: null,
    letter: null,
    number: null
};

function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

async function fetchStaircaseParams() {
    let data;

    try {
        const response = await fetch(`/api/staircaseBlock?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version ?? ''}`);

        if (!response.ok) {
            throw new Error('Network response was not ok in staircaseUtils fetching /api/staircaseBlock');
        }

        data = await response.json();
        console.log('Staircase parameters: ', data);

    } catch (error) {
        console.error('Error:', error);
        console.error('There was a problem fetching block params');
        console.log('prolificID and mainSheetID:', window.participant.prolificID, window.expParams.mainSheetID);
        console.log('Redirecting user with error code');
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.2.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
    }

    return data;
}

// Helper function to validate JSON
function isValidJSON(text) {
    try {
        JSON.parse(text);

    } catch (error) {
        return false;
    }
}


async function playMediaAndGetOutcome(staircaseParams, fileUrl) {
    try {
        let currentFolderID = fileUrl.split('/').pop();
        console.log(`Picking a random file from ${fileUrl}`);
        const { fileId, fileName } = await getRandomFileFromFolder(currentFolderID);

        console.log("Random file picked: fileId:", fileId, " fileName: ", fileName);

        const playSuccess = await playAudio(fileUrl, fileId, fileName, trialsContainer);
        console.log("after playSuccess");

        const correctAnswer = getCorrectAnswer(staircaseParams, fileName);
        console.log("correct Answer;", correctAnswer)

        if (playSuccess) {
            //let endOfBlockContainer = createDynContainer('endOfBlockContainer', null, style = {justifyContent: 'center'});

            // Create containers for yes/no and GRID answers using createDynSubContainer
            const colorContainer = createDynSubContainer('colorContainer', document.body, {});
            const letterContainer = createDynSubContainer('letterContainer', document.body, {});
            const numberContainer = createDynSubContainer('numberContainer', document.body, {});
            const yesNoContainer = createDynSubContainer('yesNoContainer', document.body, {
                flexDirection: 'row',
            });


            // Create a wrapper container to hold both yes/no and color containers
            const wrapperContainer = createDynContainer('wrapperContainer', document.body, {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '20px', // Add gap between the containers
                width: '100%',
                padding: '20px'
            });

            wrapperContainer.appendChild(colorContainer);
            wrapperContainer.appendChild(letterContainer);
            wrapperContainer.appendChild(numberContainer);
            wrapperContainer.appendChild(yesNoContainer);

            staircaseParams.answers.forEach(answer => {
                const button = document.createElement('button');
                button.innerText = answer;
                button.onclick = () => handleAnswerClick(answer, correctAnswer);
                yesNoContainer.appendChild(button);
            });

            staircaseParams.answersGridColors.forEach(color => {
                const button = document.createElement('button');
                button.innerText = color;
                button.onclick = (event) => handleButtonClick(event, colorContainer, "color");
                colorContainer.appendChild(button);
            });

            staircaseParams.answersGridLetters.forEach(letter => {
                const button = document.createElement('button');
                button.innerText = letter;
                button.onclick = (event) => handleButtonClick(event, letterContainer, "letter");
                letterContainer.appendChild(button);
            });

            staircaseParams.answersGridNumbers.forEach(number => {
                const button = document.createElement('button');
                button.innerText = number;
                button.onclick = (event) => handleButtonClick(event, numberContainer, "number");
                numberContainer.appendChild(button);
            });

            // Wait for the participant to click an answer
            const isCorrect = await waitForAnswer();

            console.log('Selected Answer:', isCorrect);

            removeContainer('wrapperContainer');

            // Perform any additional actions based on the selected answer
            // return value 
            return isCorrect;
        }

    }
    catch (error) {
        reportErrorToServer(error);
        console.error('Error playing or recording outcome:', error);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error ${window.step.number}.2.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
    }
}

async function playAudio(fileUrl, fileId, fileName, mediaContainer) {
    let retryCount = 0;
    const maxRetries = 5; // Maximum number of retries
    const timeoutDuration = 5000; // Increase timeout duration to 5 seconds

    while (retryCount < maxRetries) {
        let mediaElement = null;
        try {
            console.log(`Attempting to play ${fileName}, attempt ${retryCount + 1}`);
            const isVideo = fileName.endsWith('.mp4');
            const isAudio = fileName.endsWith('.wav') || fileName.endsWith('.mp3');

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            if (isVideo || isAudio) {
                mediaElement = isVideo ? document.createElement('video') : document.createElement('audio');
                mediaElement.preload = 'auto'; // Set preload to auto
                // mediaElement.src = fileUrl; // only works with 3rd party cookies activated
                mediaElement.src = `/drive-file/${fileId}`;
                mediaContainer.appendChild(mediaElement); // Add new media

                // Wrap media loading and playback in a promise with a timeout
                const operationPromise = new Promise((resolve, reject) => {
                    mediaElement.oncanplaythrough = resolve;
                    mediaElement.onerror = () => {
                        let errorMessage = 'Error loading media';
                        if (mediaElement.error) {
                            switch (mediaElement.error.code) {
                                case mediaElement.error.MEDIA_ERR_ABORTED:
                                    errorMessage += ': The fetching process for the media was aborted by the user agent at the users request.';
                                    break;
                                case mediaElement.error.MEDIA_ERR_NETWORK:
                                    errorMessage += ': A network error caused the media download to fail.';
                                    break;
                                case mediaElement.error.MEDIA_ERR_DECODE:
                                    errorMessage += ': An error occurred while decoding the media resource.';
                                    break;
                                case mediaElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                    errorMessage += ': The media resource indicated by the src attribute or assigned media provider object was not suitable.';
                                    break;
                                default:
                                    errorMessage += ': An unknown error occurred.';
                                    break;
                            }
                        }
                        reject(new Error(errorMessage));
                    };
                    // Start loading the media
                    if (mediaElement.readyState < mediaElement.HAVE_FUTURE_DATA) {
                        console.log('Starting to load media...');
                        mediaElement.load(); // Start loading the media
                    } else {
                        console.log('Media is already loading or loaded.');
                    }
                });

                // Set a timeout to reject the operation if it takes more than 5 seconds
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeoutDuration));
                // Use Promise.race to proceed with whichever promise resolves or rejects first
                await Promise.race([operationPromise, timeoutPromise]);

                // Play media and wait for it to end
                console.log(`...playing`);
                await new Promise((resolve, reject) => {
                    mediaElement.onended = resolve;
                    mediaElement.onwaiting = () => reject(new Error('Buffering detected, playback halted'));
                    mediaElement.play().then(() => console.log(`Playing ${fileName}`)).catch(reject);
                });
                console.log(`Finished playing ${fileName}`);

                if (audioCtx.outputLatency) {
                    console.log(`Estimated output latency: ${audioCtx.outputLatency} seconds`);
                } else {
                    console.log('outputLatency is not supported in this browser.');
                }

                mediaElement?.remove();
                return true; // Exit function after successful play
            } else {
                throw new Error(`Unknown file type for file: ${fileName}`);
            }
        } catch (error) {
            retryCount++;
            mediaElement?.remove();
            reportErrorToServer(error);
            console.log('Error in playAudio function:', error);
            console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
            if (retryCount >= maxRetries) {
                console.log('Max retries reached, returning failure.');
                return false; // Return false to indicate failure after all retries
            }
        }
    }
}

/* async function playMediaAndGetOutcome(staircaseParams, currentVal, trialsContainer) {

    try {

        let currentValFolderID = staircaseParams.intIndexedFolderIDs[currentVal];
        let currentValFolderURL = staircaseParams.intIndexedFolderURLs[currentVal];

        console.log(`Picking a random file from ${currentValFolderURL}`)
        const { fileId, fileName } = await getRandomFileFromFolder(currentValFolderID);

        const playSuccess = await playStim("", fileId, fileName, trialsContainer)

        if (!playSuccess) { // playing 2 roles at once!
            throw new Error('Failed to play');
        }

        correctResponse = getGRIDfromFilename(fileName);
        console.log(correctResponse)

        const response = await respGRID(); // Present questions

        return isCorrectResponse = correctResponse[0] === response.selectedColor && correctResponse[1] === response.selectedLetter && (correctResponse[2] === 'z' ? '0' : correctResponse[2]) === response.selectedNumber;
    
    } catch (error) {
        reportErrorToServer(error);
        console.error('Error playing or recording outcome:', error);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error ${window.step.number}.2.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }

} */


async function getRandomFileFromFolder(folderId) {
    let retryCount = 0;
    const maxRetries = 3; // Maximum number of retries

    while (retryCount < maxRetries) {
        try {
            // Fetch random file ID and name from the folder
            const response = await fetch(`/random-file-from-folder/${folderId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            return { fileId: data.fileId, fileName: data.fileName };
        } catch (error) {
            retryCount++;
            console.error('Error fetching  from gDrive folder:', error);
            console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
            console.log(`   Redirecting user with error code`);
            reportErrorToServer(error);
            if (retryCount >= maxRetries) {
                await redirectHandler(`Error ${window.step.number}.2.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
            }
        }
    }
}

function handleAnswerClick(answer, correctAnswer) {
    console.log("in handleAnswerClick");
    
    let isCorrect = compareAnswers(correctAnswer);

    const event = new CustomEvent('answerSelected', { detail: isCorrect });
    document.dispatchEvent(event);
}

function compareAnswers(correctAnswer) {
    let correctBoolean = null;
    console.log("Correct Answer:", correctAnswer);
    answerCombination = selectedAnswers.color + "," + selectedAnswers.letter + "," + selectedAnswers.number;
    console.log("participant Answer: ", answerCombination );

    if (correctAnswer == answerCombination){
        // update block number +1 
        console.log("in compareAnswers // in if ");
        correctBoolean = true;
    }
    else {
        // keep same block number
        console.log("in compareAnswers // in else");
        correctBoolean = false;
    }

    return correctBoolean;
}

function handleButtonClick(event, container, answerType) {
    console.log("in handleButtonClick");
    const buttons = container.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    selectedAnswers[answerType] = event.target.innerText;
    event.target.classList.add('selected');
    console.log(`Selected ${answerType}:`, selectedAnswers[answerType]);
}

// Function to get correct answer
function getCorrectAnswer(staircaseParams, fileName) {
    let correctAnswer = null;
    console.log('get correct answer for file:', fileName);

    for (let i = 0; i < staircaseParams.fileNamesAndAnswers.length; i++) {
        let filenameToCompare = staircaseParams.fileNamesAndAnswers[i].fileName;
        if (filenameToCompare == fileName) {
            correctAnswer = staircaseParams.fileNamesAndAnswers[i].answer;
            console.log("in if; updating correctAnswer: ", correctAnswer);
        }
    }
    return correctAnswer;
}

// Function to wait for an answer
function waitForAnswer() {
    return new Promise(resolve => {
        document.addEventListener('answerSelected', function handler(event) {
            document.removeEventListener('answerSelected', handler);
            resolve(event.detail);
        });
    });
}

// Function to remove the answer container after the participant confirmed answer
function removeContainer(containerID) {
    const container = document.getElementById(containerID);
    if (container) {
        container.remove();
    }
}

async function processAndSendAllStaircaseVals(sheetTab, blockName, blockResponses) {
    let allRowData = [];

    // Loop through each block in blockResponses
    for (const [index, block] of Object.entries(blockResponses)) {
        // Start with the blockName and filename
        let rowData = [blockName, block.fileName];

        // Flatten each trial's data in the trialResponse
        block.trialResponse.forEach(trial => {
            Object.values(trial).forEach(value => {
                rowData.push(`${value}`); // appending only the value of each field
            });
        });

        // Add the constructed rowData to the allRowData list
        allRowData.push(rowData);
    }

    // Call the function to update the Google Sheet with all row data at once
    try {
        await generalNewLineUpdate(sheetTab, allRowData, window.step.version);
    } catch (error) {
        reportErrorToServer(error);
        console.error('Error processing all block responses:', error);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error ${window.step.number}.1.4`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry = true);
    }
}

