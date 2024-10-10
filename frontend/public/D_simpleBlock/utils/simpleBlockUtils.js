// simpleBlockUtils.js

async function fetchBlockParams() {

    try {

        response1 = await fetch(`/api/clearOldCheckouts?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version ?? ''}`);
        if (!response1.ok) {
            throw new Error('Network response was not ok in simpleBlockUtils fetching /api/clearOldCheckouts');
        }
    } catch (error) {
        console.error('Error:', error);
        console.error(`There was a problem clearing old checkouts`);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.1.1`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }

    try {
        response2 = await fetch(`/api/simpleBlock?mainSheetID=${window.expParams.mainSheetID}&version=${window.step.version ?? ''}&prolificID=${window.participant.prolificID}`);
        if (!response2.ok) {
            throw new Error('Network response was not ok in simpleBlockUtils fetching /api/simpleBlock');
        }
    } catch (error) {
        console.error('Error:', error);
        console.error(`There was a problem fetching block params`);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        reportErrorToServer(error);
        await redirectHandler(`Error ${window.step.number}.1.2`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }

    return await response2.json();

}


async function checkinOrConfirmBlock(reservedCell, actionType) {
    try {
        const mainSheetID = window.expParams.mainSheetID;
        const prolificID = window.participant.prolificID;
        const version = window.step.version ?? '';
        const response = await fetch('/api/checkinOrConfirmBlock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mainSheetID, version, prolificID, reservedCell, actionType })
        });

        if (!response.ok) {
            console.log(response)
            throw new Error('Server responded with an error!');
        }

        const result = await response.json();
        console.log(result.message); // Success message
    } catch (error) {
        reportErrorToServer(error);
        console.error('Error checking in block:', error);
        console.log(`   prolificID and mainSheetID:`, window.participant.prolificID, window.expParams.mainSheetID);
        console.log(`   Redirecting user with error code`);
        await redirectHandler(`Error ${window.step.number}.1.5`, `${window.STR.pleaseEmailErrorCode}<br>${error}`, window.prolificCheckpointCode, allowRetry=true);
    }
}