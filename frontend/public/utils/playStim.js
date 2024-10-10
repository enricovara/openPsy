async function playStim(fileUrl, fileId, fileName, mediaContainer) {
    let retryCount = 0;
    const maxRetries = 5; // Maximum number of retries

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

                mediaElement.style.marginTop = "50px"; // Lowers the video on the screen
                mediaElement.style.width = "800px"; // Set the width of the video
                mediaElement.style.height = "450px"; // Set the height of the video            

                // mediaElement.src = fileUrl; // only works with 3rd party cookies activated
                mediaElement.src = `/drive-file/${fileId}`;
                mediaContainer.appendChild(mediaElement); // Add new media
                
                // Wrap media loading and playback in a promise with a timeout
                const operationPromise = new Promise(async (resolve, reject) => {

                    if (mediaElement.readyState < mediaElement.HAVE_FUTURE_DATA) {
                        console.log('Starting to load media...');
                        mediaElement.load(); // Start loading the media
                    } else {
                        console.log('Media is already loading or loaded.');
                    }

                    // Wait for media to be ready
                    // mediaElement.oncanplaythrough = resolve;
                    mediaElement.oncanplay = resolve;

                    //mediaElement.onerror = () => reject(new Error('Error loading media'));
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
                        console.log(errorMessage);
                        reject(new Error(errorMessage));
                    };
                    
                });

                // Set a timeout to reject the operation if it takes more than 20 seconds
                const TIMEOUT_LIMIT = 20 // seconds
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${TIMEOUT_LIMIT} seconds`)), TIMEOUT_LIMIT * 1000));
                // Use Promise.race to proceed with whichever promise resolves or rejects first
                await Promise.race([operationPromise, timeoutPromise]);

                // Play media and wait for it to end
                // console.log(`...playing`);
                // await new Promise((resolve, reject) => {
                //     mediaElement.onended = resolve;
                //     // mediaElement.onwaiting = () => reject(new Error('Buffering detected, playback halted'));
                //     mediaElement.play().then(() => console.log(`Playing ${fileName}`)).catch(reject);
                // });
                // console.log(`Finished playing ${fileName}`);

                console.log(`...playing`);
                await new Promise((resolve, reject) => {
                    mediaElement.play().then(() => {
                        console.log(`Playing ${fileName}`);
                        // Pause immediately to allow further loading
                        mediaElement.pause();
                        
                        // Wait for 2 seconds before resuming playback
                        setTimeout(() => {
                            mediaElement.play().then(() => {
                                console.log(`Resuming playback after preloading`);
                                mediaElement.onended = resolve;
                            }).catch(reject);
                        }, 500); // 2000 milliseconds = 2 seconds

                    }).catch(reject);
                });


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
            console.log('Error in playStim function:', error);
            console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
            if (retryCount >= maxRetries) {
                console.log('Max retries reached, returning failure.');
                return false; // Return false to indicate failure after all retries
            }
        }
    }
}




async function playMediaAndCaptureResponse(blockParams, fileName, fileId, fileUrl, trialsContainer) {

    switch (blockParams.responseType) {
        case "Questions (below)":
            if (blockParams.questionsPresentationLogic === "STIMULUS, Q1, STIMULUS, Q2, ..."){
                trialResponse = [];
                for (const qa of blockParams.questionsAndAnswers) {
                    console.log("   ", qa)
                    const playSuccess = await playStim(fileUrl, fileId, fileName, trialsContainer);
                    if (!playSuccess) {
                        trialResponse.push({outcome: "error", latency: 0}); // Record default outcome on failure
                        continue; // Skip to next iteration
                    }
                    const response = await respMCQ([qa]); // Present one question and capture response
                    trialResponse.push(...response); // Spread operator to flatten responses
                }
            } else if (blockParams.questionsPresentationLogic === "STIMULUS, Q1, Q2, ..."){
                const playSuccess = await playStim(fileUrl, fileId, fileName, trialsContainer);
                if (!playSuccess) {
                    trialResponse = blockParams.questionsAndAnswers.map(() => ({outcome: "error", latency: 0})); // Create an error response for each question
                } else {
                    trialResponse = await respMCQ(blockParams.questionsAndAnswers);
                }
            } else {
                let error = new Error(`Unknown questionsPresentationLogic: ${blockParams.questionsPresentationLogic}`);
                reportErrorToServer(error);
                console.log(error)
                console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
                console.log(`   Redirecting user with error code`);
                await redirectHandler(`Error ${window.step.number}.1.3`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
            }
            return trialResponse;
        
        case "GRID":
            const playSuccess = await playStim(fileUrl, fileId, fileName, trialsContainer);
            if (!playSuccess) {
                trialResponse = blockParams.questionsAndAnswers.map(() => ({outcome: "error", latency: 0})); // FIX THIS
            } else {
                trialResponse = await respGRID(fileName);
            }
            return trialResponse;
    
        default:
            let error = new Error(`Unknown questionsPresentationLogic: ${blockParams.questionsPresentationLogic}`);
            reportErrorToServer(error);
            console.log(error)
            console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
            console.log(`   Redirecting user with error code`);
            await redirectHandler(`Error ${window.step.number}.1.3`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }
}