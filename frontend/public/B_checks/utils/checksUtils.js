
async function showCheckModal(titleText, warningText, okButtonText, notOkButtonText = false, redoButtonText = null) {
    // Create the outer modal div
    const modal = document.createElement('div');
    modal.id = 'checkModal';
    modal.style.cssText = 'position: fixed; z-index: 1001; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.7);';

    // Create the inner div
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 70%; text-align: center;';

    // Create and add title
    const title = document.createElement('h2');
    title.textContent = titleText;
    modalContent.appendChild(title);

    // Add paragraph
    const paragraph = document.createElement('p');
    paragraph.textContent = warningText;
    modalContent.appendChild(paragraph);

    okButton = createDynButton(
        okButtonText, // buttonText
        modalContent, // parentElement
        { id: 'okButton', margin: '10px'} // attributes
    );
    if (notOkButtonText) {
        notOkButton = createDynButton(
            notOkButtonText, // buttonText
            modalContent, // parentElement
            { id: 'notOkButton', margin: '10px'} // attributes
        );
    }
    if (redoButtonText) {
        redoButton = createDynButton(
            redoButtonText, // buttonText
            modalContent, // parentElement
            { id: 'redoButton', margin: '10px'} // attributes
        );
    }

    // Append elements
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    let redo = false;
    let okOrNot = new Promise((resolve) => {
        okButton.addEventListener('click', async () => {
            modal.remove();
            resolve();
        });
        if (notOkButtonText) {
            notOkButton.addEventListener('click', async () => {
                modal.remove();
                await redirectHandler(`${window.STR.admittedUnsuitableTitle}`, `${window.STR.admittedUnsuitableText}`, window.step.completionCode, allowRetry=true);
            });
        }
        if (redoButtonText) {
            redoButton.addEventListener('click', async () => {
                modal.remove();
                redo = true;
                resolve();
            });
        }
    });

    await okOrNot;

    return redo
}