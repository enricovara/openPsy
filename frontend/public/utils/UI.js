
/**
 * Dynamically creates a new container (div element) with default and additional custom styles.
 * 
 * @param {string} containerID - The ID to assign to the container.
 * @param {HTMLElement|null} [parentElement=null] - The parent element to append the container to. If null, the container is appended to the document's body.
 * @param {Object} [style={}] - An object containing additional custom CSS styles to apply to the container.
 * @returns {HTMLElement} - The created container element.
 */
function createDynContainer(containerID, parentElement = null, style = {}) {
    // Create a container for the elements
    let newContainer = document.createElement('div');
    newContainer.id = containerID;

    // Define default styles for the container
    const defaultStyle = {
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'auto',
        minHeight: '100vh',
        maxWidth: '800px'
        //border: '1px solid #ccc',
        //borderRadius: '5px',
        //backgroundColor: '#f9f9f9'
    };

    // Apply default styles and then override with provided styles
    Object.assign(newContainer.style, defaultStyle, style);

    // Append the container to the specified parent element or the document body if no parent is specified
    (parentElement || document.body).appendChild(newContainer);

    // Return the created container
    return newContainer;
}

function createDynSubContainer(containerID, parentElement = null, style = {}) {
        // Create a container for the elements
        let newContainer = document.createElement('div');
        newContainer.id = containerID;
    
        // Define default styles for the container
        const defaultStyle = {
            padding: '10px',
            boxSizing: 'border-box',
            justifyContent: 'flex-start',
            overflow: 'auto',
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: '1rem', // Add margin to separate from the other container
            height: 'auto',
            width: 'calc(33% - 10px)',
        };
    
        // Apply default styles and then override with provided styles
        Object.assign(newContainer.style, defaultStyle, style);
    
        // Append the container to the specified parent element or the document body if no parent is specified
        (parentElement || document.body).appendChild(newContainer);
    
        // Return the created container
        return newContainer;
}


/**
 * Dynamically creates a button with default and additional styles.
 * 
 * @param {string} buttonText - The text to display on the button.
 * @param {HTMLElement|null} [parentElement=null] - The parent element to append the button to. If null, the button is appended to the document's body.
 * @param {Object} [style={}] - An object containing CSS styles to apply to the button.
 * @param {Object} [attributes={}] - An object containing additional attributes to set on the button.
 * @returns {HTMLElement} - The created button element.
 */
function createDynButton(buttonText, parentElement = null, style = {}, attributes = {}) {
    const button = document.createElement('button');
    button.textContent = buttonText;

    // Default styles
    const defaultStyle = {
        padding: '10px 20px',
        fontSize: '16px',
        color: 'white',
        backgroundColor: 'blue',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        margin: '20px',
    };

    // Apply default styles and then override with provided styles
    Object.assign(button.style, defaultStyle);
    Object.assign(button.style, style);

    // Set additional attributes
    for (const [key, value] of Object.entries(attributes)) {
        button.setAttribute(key, value);
    }

    // Append the button to the specified parent element or the document body if no parent is specified
    (parentElement || document.body).appendChild(button);

    // Return the created button
    return button;
}


/**
 * Dynamically creates a text element with predefined and additional custom styles.
 * 
 * @param {string} textContent - The text to display in the element.
 * @param {'Title' | 'Header' | 'Body'} textType - The type of the text element which defines its default style.
 * @param {HTMLElement|null} [parentElement=null] - The parent element to append the text element to. If null, the text element is appended to the document's body.
 * @param {Object} [style={}] - An object containing additional custom CSS styles to apply to the text element.
 * @returns {HTMLElement} - The created text element.
 */
function createDynTextElement(textContent, textType, parentElement = null, style = {}) {
    let textElement;

    // Define default styles for different text types
    const defaultStyles = {
        'Title': {
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'black',
            marginBottom: '10px',
            textAlign: 'center'
        },
        'Header': {
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'black',
            marginBottom: '8px',
            textAlign: 'center'
        },
        'Body': {
            fontSize: '14px',
            fontWeight: 'normal',
            color: 'black',
            marginBottom: '5px',
            textAlign: 'center'
        },
        'Warning': {
            fontSize: '18px',
            //fontWeight: 'bold',
            color: 'yellow',
            marginBottom: '5px',
            maxWidth: '1200px',
            textAlign: 'center',
        },
        'None': {
            //marginTop: '100px'
        }
    };

    // Create appropriate element based on the textType
    switch (textType) {
        case 'Title':
            textElement = document.createElement('h1');
            break;
        case 'Header':
            textElement = document.createElement('h2');
            break;
        case 'Body':
        default:
            textElement = document.createElement('p');
            break;
    }

    // Set text content and apply default and additional custom styles
    textElement.innerHTML = textContent;
    Object.assign(textElement.style, defaultStyles[textType], style);

    // Append the text element to the specified parent element or the document body if no parent is specified
    (parentElement || document.body).appendChild(textElement);

    return textElement;
}


/**
 * Dynamically creates a progress bar with custom styling options and appends it to a specified parent element.
 * 
 * @param {Object} [style={}] - An object containing custom CSS styles for the progress bar and its container.
 * @param {HTMLElement|null} [parentElement=null] - The parent element to append the progress bar to. If null, the progress bar is appended to the document's body.
 * @param {boolean} [showValue=false] - Whether to display the progress value (out of 100) on the progress bar.
 * @returns {HTMLElement} - The created progress bar element.
 */
function createDynProgressBar(style = {}, parentElement = null, showValue = false) {
    // Create a div container for the progress bar
    let container = document.createElement('div');
    container.id = 'progressContainer';

    // Define default container styles and apply custom styles
    const defaultContainerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        padding: '10px',
        position: 'relative', // Added for positioning value text
    };
    Object.assign(container.style, defaultContainerStyle, style.containerStyle || {});

    // Append the container to the specified parent element or the document body if no parent is specified
    (parentElement || document.body).appendChild(container);

    // Create the progress bar element
    let progressBar = document.createElement('progress');
    progressBar.max = 100;
    progressBar.value = 0;
    progressBar.id = 'progressBar';

    // Define default progress bar styles and apply custom styles
    const defaultProgressBarStyle = {
        width: '80vw',
        height: '20px'
    };
    Object.assign(progressBar.style, defaultProgressBarStyle, style.progressBarStyle || {});

    container.appendChild(progressBar);

    // Optionally display the value on the progress bar
    if (showValue) {
        let valueText = document.createElement('span');
        valueText.id = 'progressValue';
        valueText.style.position = 'absolute';
        valueText.style.left = '50%';
        valueText.style.top = '50%';
        valueText.style.transform = 'translate(-50%, -50%)';
        valueText.textContent = `${progressBar.value}%`;
        container.appendChild(valueText);
    }

    return progressBar;
}


/**
 * Updates the value of a given progress bar, optionally over a specified duration.
 * Can also complete and remove the progress bar after a specified delay.
 * If a previous update is in progress, it will be canceled before starting the new update.
 * 
 * @param {HTMLElement} progressBar - The progress bar element to update.
 * @param {number} value - The new value of the progress bar, between 0 and 100.
 * @param {number|null} [duration=null] - Duration over which to update the progress bar, in seconds. If null, update is immediate.
 * @param {boolean} [removeOnComplete=false] - Whether to remove the progress bar from the DOM upon completion.
 * @param {number} [removeDelay=500] - Delay in milliseconds before removing the progress bar after completion.
 * @returns {Promise} - A promise that resolves when the update is complete.
 */
function updateProgressBar(progressBar, value, duration = null, removeOnComplete = false, removeDelay = 500) {
    const UPDATE_PERIOD = 50; // ms

    return new Promise(resolve => {
        // Clear any previous update interval if it exists
        if (progressBar.updateIntervalID) {
            clearInterval(progressBar.updateIntervalID);
            console.log(`   cancelled previous progress bar update`);
        }

        // Log the start of the update
        console.log(`   starting to update progress bar to ${value}`);

        if (duration) {
            // Update the progress bar over the specified duration
            const startValue = progressBar.value;
            const endValue = Math.min(Math.max(value, 0), 100);
            const step = (endValue - startValue) / (duration * 1000 / UPDATE_PERIOD); // UPDATE_PERIOD update interval

            progressBar.updateIntervalID = setInterval(() => {
                if ((step > 0 && progressBar.value >= endValue) ||
                    (step < 0 && progressBar.value <= endValue)) {
                    clearInterval(progressBar.updateIntervalID);
                    progressBar.value = endValue; // Ensure final value is set
                    delete progressBar.updateIntervalID; // Clean up interval ID

                    if (removeOnComplete) {
                        setTimeout(() => {
                            progressBar.parentNode.remove();
                            console.log(`   finished to update progress bar to ${value}`);
                            resolve();
                        }, removeDelay);
                    } else {
                        console.log(`   finished to update progress bar to ${value}`);
                        resolve();
                    }
                } else {
                    progressBar.value += step;
                }

                if (progressBar.textContent) {
                    progressBar.textContent = `${Math.round(progressBar.value)}%`;
                }
            }, UPDATE_PERIOD);
        } else {
            // Immediate update
            progressBar.value = Math.min(Math.max(value, 0), 100);
            if (progressBar.textContent) {
                progressBar.textContent = `${Math.round(progressBar.value)}%`;
            }

            setTimeout(() => {
                if (removeOnComplete && progressBar.value >= 100) {
                    progressBar.parentNode.remove();
                }
                console.log(`   finished to update progress bar to ${value}`);
                resolve();
            }, 0);
        }
    });
}



/**
 * Dynamically creates a footer with default and additional custom styles.
 * 
 * @param {HTMLElement|null} [parentElement=null] - The parent element to append the footer to. If null, the footer is appended to the document's body.
 * @param {Object} [style={}] - An object containing additional custom CSS styles to apply to the footer.
 * @returns {HTMLElement} - The created footer element.
 */
function createDynFooter(parentElement = null, style = {}) {
    const footer = document.createElement('footer');

    // Default styles for the footer
    const defaultStyle = {
        position: 'fixed',
        left: '0',
        bottom: '0',
        width: '100%',
        backgroundColor: '#333', // Default background color
        color: 'white', // Default text color
        textAlignment: 'center',
        padding: '10px 0',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'center'
    };

    // Apply default styles and then override with provided styles
    Object.assign(footer.style, defaultStyle, style);

    // Append the footer to the specified parent element or the document body if no parent is specified
    (parentElement || document.body).appendChild(footer);

    // Return the created footer
    return footer;
}

