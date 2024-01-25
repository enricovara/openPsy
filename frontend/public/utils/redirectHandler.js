// redirectHandler.js

/**
 * Handles redirection by clearing the body's content and dynamically creating a new UI for redirection.
 * Redirects to a specific URL based on a global error code, or given success code.
 * 
 * @param {string} headerText - The body text to display in the redirect handler.
 * @param {string} bodyText - The body text to display in the redirect handler.
 * @param {string} prolificExitCode - The prolific exit code to redirect with.
 * @param {string} allowRetry - Whether to allow the user to refresh and restart instead.
 * 
 */
async function redirectHandler(headerText, bodyText, prolificExitCode = window.prolificErrorCode, allowRetry=false) {
    // Clear everything inside the body
    document.body.innerHTML = '';

    // Create a new container dynamically
    let redirectContainer = createDynContainer('redirectContainer');

    let redirectFooter = createDynFooter(parentElement = redirectContainer);

    // Add text to the container
    let headerElement = createDynTextElement(headerText, 'Header', redirectContainer, style = {paddingTop: "20vh"}); // Replace 'Body' with the appropriate text type
    let textElement = createDynTextElement(bodyText, 'Body', redirectContainer); // Replace 'Body' with the appropriate text type

    let buttonsContainer = createDynContainer('redirectbuttonsContainer', redirectContainer, style = {display: 'flex', flexDirection: 'row', alignItems: 'start', justifyContent: 'start', minHeight: 'auto',});

    // Create the button
    let refreshAndRetryButton;
    if (allowRetry) {
        refreshAndRetryButton = createDynButton(window.STR.refreshAndRetryButtonText ?? "Refresh and retry instead", buttonsContainer);
    }
    let quitReturnButton = createDynButton(window.STR.quitAndReturnToProlific ?? "Quit and return to Prolific", buttonsContainer);

    // Wrap the redirection in a new Promise
    let exit = new Promise((resolve) => {
        if (allowRetry) {
            refreshAndRetryButton.addEventListener('click', async function() {
                location.reload(true);
            });
        }
        quitReturnButton.addEventListener('click', async function() {
            window.location.href = `https://app.prolific.co/submissions/complete?cc=${prolificExitCode}`;
            await sleep(10000);
        });
    });

    let adBlockWarning = createDynTextElement(`${window.STR.adBlockWarning}`, 'Warning', parentElement = redirectFooter, {margin: '20px'})
    adBlockWarning.style.display = 'block';

await exit;
}

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
