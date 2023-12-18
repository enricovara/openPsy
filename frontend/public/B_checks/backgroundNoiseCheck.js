

async function getBackgroundVolume(sampleTimeMS) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const audioContext = new AudioContext();

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const audioSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        audioSource.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength); // Changed to Float32Array

        const measureVolume = () => {
            analyser.getFloatFrequencyData(dataArray); // Correct data type now
            let sum = 0;
            let count = 0;
        
            for (let i = 0; i < bufferLength; i++) {
                // Convert dB value to linear and add to sum
                sum += Math.pow(10, dataArray[i] / 20);
                count++;
            }
        
            if (count === 0) return -Infinity; // No valid data points
        
            const averageLinear = sum / count; // Average on linear scale
            return 20 * Math.log10(averageLinear); // Convert back to dB if needed
        };
        

        let totalVolume = 0;
        let numberOfMeasurements = 0;
        const startTime = Date.now();

        while (Date.now() - startTime < sampleTimeMS) {
            const instantVolume = measureVolume();
            if (instantVolume !== -Infinity) {
                totalVolume += instantVolume;
                numberOfMeasurements++;
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Consider adjusting this delay
        }

        const averageVolume = totalVolume / numberOfMeasurements;
        const sampleTimeStringS = (Math.round(sampleTimeMS / 1000).toFixed(1).toString());
        console.log(`Average volume over ${sampleTimeStringS} seconds:`, averageVolume);

        stream.getTracks().forEach(track => track.stop());
        audioContext.close();

        return averageVolume;
    } catch (error) {
        reportErrorToServer(error);
        console.log(error)
        await generalNewLineUpdate("checkNoise", [error.toString()]);
        return null;
    }
}


/*
function headphoneTest() {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const stereoPanner = new StereoPannerNode(audioContext);

    oscillator.connect(stereoPanner).connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A standard tuning pitch (A4)

    // Pan audio left to right
    stereoPanner.pan.setValueAtTime(-1, audioContext.currentTime); // Left
    setTimeout(() => {
        stereoPanner.pan.setValueAtTime(1, audioContext.currentTime); // Right
    }, 1000);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
        audioContext.close();
    }, 2000); // Stop after 2 seconds
}

// Call this function when the user clicks a button
// buttonElement.addEventListener('click', headphoneTest);
*/


async function performBackgroundNoiseCheck(sampleTimeMS = 3000) {

    try {
        title = window.STR.NoiseCheckTitle;
        warningText = window.STR.NoiseCheckRequestWarningText;
        okButtonText = window.STR.NoiseCheckRequestContinueButtonText;
        await showCheckModal(title, warningText, okButtonText);

        let backgroundNoiseContainer = createDynContainer('backgroundNoiseContainer', null, {
            backgroundColor: 'rgba(0,0,0,0.7)',
            width: '100%', 
            maxWidth: 'none'
        });

        let backgroundNoiseFooter = createDynFooter(parentElement = backgroundNoiseContainer);

        let myProgressBar = createDynProgressBar(
            {}, // style // No additional styles
            backgroundNoiseFooter, // parentElement
            false // showValue // Not showing the progress value
        );

        updateProgressBar(
            myProgressBar, // progressBar
            99, // value
            1+sampleTimeMS/1000, // duration in seconds
            false, // removeOnComplete
        );

        let volume = await getBackgroundVolume(sampleTimeMS);

        await updateProgressBar(
            myProgressBar, // progressBar
            100, // value
            0.05, // duration in seconds
            true, // removeOnComplete
            150
        );
        backgroundNoiseContainer.remove();

        return volume
    } catch {
        return undefined
    }
}


async function checkBackgroundNoise() {

    // Define a threshold for noise level
    const noiseThreshold = -100;
    const sampleTimeMS = 3000;

    redo = true;
    while (redo) {

        volume = await performBackgroundNoiseCheck(sampleTimeMS);

        title = window.STR.NoiseCheckTitle;
        notOkButtonText = window.STR.checkPauseButton;
        redoButtonText = window.STR.redoButtonText;
        if (!volume || volume < noiseThreshold) {
            warningText = window.STR.NoiseCheckOK;
            okButtonText = window.STR.NoiseCheckOKbutton;
        } else{
            warningText = window.STR.NoiseCheckNotOK;
            okButtonText = window.STR.NoiseCheckNotOKbutton;
        }
        let volumeString = volume ? volume.toString() : "";
        await generalNewLineUpdate("checkNoise", [volumeString]);

        redo = await showCheckModal(title, warningText, okButtonText, notOkButtonText, redoButtonText);
        console.log("redo", redo)

        if (!redo) {
            await generalNewLineUpdate("checkNoise", ["", "TRUE"]);
        } // NOTE: we are running generalNewLineUpdate("checkNoise", error) in the getBackgroundVolume function

    }

    updateParticipantLog() // NOTE: NOT AWAITING!

    //headphoneTest();

}



