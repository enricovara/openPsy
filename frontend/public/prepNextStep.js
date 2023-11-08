// prepNextStep.js

/*
 * GET STEP TYPE
 * GET STEP FAILURE AND SUCCESS EXIT CODES
 * FIND OUT IF TYPE IS "DO" ALWAYS, ONCE, OR NEVER
 * FIND OUT IF STEP HAS BEEN DONE BEFORE
 */
 
window.step = window.step || {};

async function prepNextStep() {

    console.log(`Fetching parameters for step ${step.number}`);
    
    try {
        const response = await fetch("/api/getStepDetails", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mainSheetID: window.expParams.mainSheetID,
                prolificID: window.participant.prolificID,
                stepNumber: window.step.number
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Assign the data from the response to the step object
        step.type = data.type;
        step.failExitCode = data.failExitCode;
        step.successExitCode = data.successExitCode;
        step.do = data.do;
        step.status = data.status;
        
        console.log(`Parameters set for step ${step.number}`);
        Object.entries(step).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });

    } catch (error) {
        console.error('There was a problem with the fetch operation for preparing step:', error);
        console.log(`   Redirecting user with error code`);
        returnToProlific.addEventListener('click', function() {1
            window.location.href = `https://app.prolific.co/submissions/complete?cc=${window.generalProlificErrorCode}`;
        });
    }

}
