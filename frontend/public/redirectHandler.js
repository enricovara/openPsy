// redirectHandler.js
 
// Function to handle the redirection after button click
async function handleRedirection(redirectUrl) {

    Object.assign(displayUsername.style, {
        color: 'red',
        marginTop: '20px',
        marginBottom: '180px'
    });
    ENDING_SCREEN.style.display = 'block';

    return new Promise((resolve) => {
        const returnToProlificButton = document.getElementById('returnToProlific');
        returnToProlificButton.addEventListener('click', async function() {
            window.location.href = redirectUrl;
            await sleep(2000);
            resolve(); // Resolve the promise after the button is clicked
        }, { once: true }); // Ensures the listener is removed after one use
    });
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}