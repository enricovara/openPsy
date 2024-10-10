// staircaseUtils.js

async function fetchStairParams() {

    try {
        const response2 = await fetch(`/api/staircaseBlock?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version ?? ''}`);
        if (!response2.ok) {
            throw new Error('Network response was not ok in fetchStairParams fetching /api/staircaseBlock');
        }
        return await response2.json();
    } catch (error) {
        console.error('Error:', error);
        console.error(`There was a problem fetching block params`);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.1.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, true);
    }

    return await response2.json();

}

async function fetchPostStairParams() {
    try {
        const response = await fetch(`/api/postStair?mainSheetID=${window.expParams.mainSheetID}&prolificID=${window.participant.prolificID}&version=${window.step.version ?? ''}`);
        if (!response.ok) {
            throw new Error('Network response was not ok in fetchPostStairParams fetching /api/postStair');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        console.error('There was a problem fetching post-staircase parameters');
        console.log('   prolificID and mainSheetID:', window.participant.prolificID, window.expParams.mainSheetID);
        console.log('   Redirecting user with error code');
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.1.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, true);
    }
}


/**
 * Saves the staircase outcome to the server using the designated API endpoint.
 *
 * @param {Object} data - The staircase outcome data to be saved.
 * @param {string} data.mainSheetID - The main sheet ID from the experiment parameters.
 * @param {string} data.version - The version of the current step or experiment.
 * @param {string} data.prolificID - The Prolific participant ID.
 * @param {number} data.outcome - The average of the last reversal difficulty levels.
 * @returns {Promise<void>} - Resolves when the data is successfully saved.
 * @throws Will handle errors by reporting them to the server and redirecting the participant.
 */
async function saveStaircaseOutcome(data) {
    try {
        const response = await fetch('/api/saveStaircaseOutcome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok in saveStaircaseOutcome');
        }
        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error('Error:', error);
        console.error('There was a problem saving the staircase outcome');
        reportErrorToServer(error);
        await redirectHandler(
            `Error saving staircase outcome`,
            `${window.STR.pleaseEmailErrorCode}<br>${error}`,
            window.prolificCheckpointCode,
            true
        );
    }
}
