async function showMessageWithOptions(message, options = {}) {
    let container = createDynContainer('messageContainer', null, { justifyContent: 'center' });

    createDynFooter(container);

    createDynTextElement(message, 'None', container);

    let buttonsContainer = createDynContainer('buttonsContainer', container, {
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 'auto'
    });

    let buttons = options.buttons || [];

    let promises = buttons.map((buttonDef) => {
        let button = createDynButton(
            buttonDef.text,
            buttonsContainer,
            { marginBottom: "50px", alignSelf: 'center' },
            { id: buttonDef.id } // You can still set unique IDs for buttons if needed
        );
        return new Promise((resolve) => {
            button.addEventListener('click', async () => {
                container.remove();
                if (buttonDef.action) {
                    await buttonDef.action();
                }
                resolve();
            });
        });
    });

    await Promise.race(promises);
}
