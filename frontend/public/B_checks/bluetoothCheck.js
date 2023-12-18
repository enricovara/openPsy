
const bluetoothKeywords = {
    specific: [
        // Specific models and unique identifiers
        "WH-1000XM", "WF-1000XM", "QC35", "Elite 75t", "Elite 85t", "Push Ultra", "FreeBuds", "Bud+", "TWS1", "NC700"
    ],
    common: [
        // Common BT terms
        "AirPod", "Galaxy Buds", "Buds", "bud", "SteelSeries", "Bluetooth", "bt", "SoundLink", "SoundSport", "QuietComfort",
        "Earbuds", "Wireless", "TWS", "ANC", "noise", "Hands-free", "hyphen", "roast", "beat"
    ],
    brands_other: [
        // not used for now
        "Bose", "Sony", "JBL", "Beats", "Sennheiser", "Skullcandy", "Harman", "Kardon", "Bang", "Olufsen",
        "B&O", "Marshall", "Anker", "Soundcore", "Jaybird", "Bowers", "Wilkins", "AKG", "Plantronics", "Shure", 
        "Audio-Technica", "Logitech", "UE ", "boom", "blast", "mega", "epic", "hyper", "Ultimate Ears",
        "Samsung", "LG", "Tone", "Panasonic", "Philips", "Huawei", "Xiaomi", "OnePlus",
        "RHA", "Klipsch", "Pioneer", "Turtle Beach", "Corsair", "Razer", "HyperX",
        "Over-Ear", "On-Ear", "ear", "Headset", "Neckband", 

    ]
};

const nonAudioKeywords = [
    "zoom", "microsoft", "macbook", "keyboard", "mouse", "pen", "pad", "tablet", "trackpad", "controller", "smartwatch", "bracelet", "printer", "scanner", "watch", "gopro", "print"
];


function containsBluetoothKeyword(deviceName, mode = "none") {
    const lowerCaseDeviceName = deviceName.toLowerCase();
    
    // Check for non-audio keywords
    for (const keyword of nonAudioKeywords) {
        if (lowerCaseDeviceName.includes(keyword.toLowerCase())) {
            //console.log(`Triggered by non-audio keyword: ${keyword}`);
            return false;
        }
    }

    // Check for specific Bluetooth keywords
    for (const keyword of bluetoothKeywords.specific) {
        if (lowerCaseDeviceName.includes(keyword.toLowerCase())) {
            console.log(`Triggered by specific Bluetooth keyword: ${keyword}`);
            return true;
        }
    }

    // Check for general Bluetooth keywords
    for (const keyword of bluetoothKeywords.common) {
        if (lowerCaseDeviceName.includes(keyword.toLowerCase())) {
            console.log(`Triggered by general Bluetooth keyword: ${keyword}`);
            return true;
        }
    }

    if (mode === "strict") {
        console.log("hi")
        // Check for general Bluetooth keywords
        for (const keyword of bluetoothKeywords.brands_other) {
            if (lowerCaseDeviceName.includes(keyword.toLowerCase())) {
                console.log(`Triggered by general Bluetooth keyword: ${keyword}`);
                return true;
            }
        }
    }

    // If no keywords matched
    return false;
}
// OLD
/*
function containsBluetoothKeyword(deviceName) {
    const lowerCaseDeviceName = deviceName.toLowerCase();
    
    // If a device contains non-audio keywords, return false immediately
    if (nonAudioKeywords.some(keyword => lowerCaseDeviceName.includes(keyword.toLowerCase()))) {
        return false;
    }

    // Check if the device name contains any of the specific or general Bluetooth keywords.
    // It's sufficient to match any single keyword.
    return bluetoothKeywords.specific.some(keyword => lowerCaseDeviceName.includes(keyword.toLowerCase()))
        || bluetoothKeywords.general.some(keyword => lowerCaseDeviceName.includes(keyword.toLowerCase()));
}
*/



async function performBluetoothAudioCheck() {

    try {

        // warn user to BT request
        title = window.STR.BTcheckTitle;
        warningText = window.STR.BTcheckRequestWarningText;
        buttonText = window.STR.BTcheckRequestWarningButtonText;
        await showCheckModal(title, warningText, buttonText);

        let BTcontainer = createDynContainer('BTcontainer', null, {
            backgroundColor: 'rgba(0,0,0,0.7)',
            width: '100%', 
            maxWidth: 'none',
        });

        let BTfooter = createDynFooter(parentElement = BTcontainer);

        let myProgressBar = createDynProgressBar(
            {}, // style // No additional styles
            BTfooter, // parentElement
            false // showValue // Not showing the progress value
        );

        updateProgressBar(
            myProgressBar, // progressBar
            90, // value
            3, // duration in seconds
            false, // removeOnComplete
        );

        let BTcheckOK = true;

        // Requesting permission to access audio input to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true });
    
        let audioDevices = await navigator.mediaDevices.enumerateDevices();
    
        // Filter for only audio output devices and check for Bluetooth keyword
        const audioOutputDevices = audioDevices.filter(device => device.kind === 'audiooutput');
        for (let device of audioOutputDevices) {
            if (containsBluetoothKeyword(device.label)) {
                console.log("BTcheckOK = false", device.label)
                BTcheckOK = false;
            }
        }
    
        // Map the filtered devices to strings
        const audioDevicesArray = audioOutputDevices.map(device => `kind: ${device.kind}; label: ${device.label}`);
    
        // Prepend the BT check status
        audioDevicesArray.unshift("");
        audioDevicesArray.unshift(`${BTcheckOK}`);
    
        await generalNewLineUpdate("checkBT", audioDevicesArray);

        let bluetoothDevices = [];

        if (navigator.bluetooth && typeof navigator.bluetooth.getDevices === "function") {

            bluetoothDevices = await navigator.bluetooth.getDevices();
            const bluetoothDevicesArray = bluetoothDevices.map(device => `name: ${device.name}; id: ${device.id}; connected: ${device.gatt?.connected}`);
            
            // Proceed with checking connected Bluetooth devices
            if (bluetoothDevices.length > 0) {
                bluetoothDevicesArray.unshift("");
                bluetoothDevicesArray.unshift("");
                await generalNewLineUpdate("checkBT", bluetoothDevicesArray);
                for (let BTdevice of bluetoothDevices) {
                    if (BTdevice.gatt.connected) {
                        for (let audioDevice of audioDevices) {
                            if (audioDevice.kind === 'audiooutput' && containsBluetoothKeyword(audioDevice.label, mode = "strict")) {
                                if (audioDevice.label.toLowerCase().includes(bluetoothDevice.name.toLowerCase()) || bluetoothDevice.name.toLowerCase().includes(audioDevice.label.toLowerCase())) {
                                    console.log("found a BT device", devbluetoothDeviceice.name, device.name, device.name)
                                    BTcheckOK = false;
                                }
                            }
                        }
                    }
                }
            }
        }

        await updateProgressBar(
            myProgressBar, // progressBar
            100, // value
            0.15, // duration in seconds
            true, // removeOnComplete
            150
        );
        BTcontainer.remove();

        return BTcheckOK

    } catch (error) {
        reportErrorToServer(error);
        console.log(error)
        await generalNewLineUpdate("checkBT", [error.toString()]);
        BTcheckOK = true;
        return BTcheckOK
    }
}

async function checkBluetoothAudio() {

    redo = true;
    while (redo) {

        BTcheckOK = await performBluetoothAudioCheck()

        console.log("BTcheckOK", BTcheckOK)
        title = window.STR.BTcheckTitle;
        notOkButtonText = window.STR.checkPauseButton;
        redoButtonText = window.STR.redoButtonText;
        if (BTcheckOK) {
            warningText = window.STR.BTcheckOK;
            okButtonText = window.STR.BTcheckOKbutton;
        } else{
            warningText = window.STR.BTcheckNotOK;
            okButtonText = window.STR.BTcheckNotOKbutton;
        }
        updateParticipantLog() // NOTE: NOT AWAITING!

        redo = await showCheckModal(title, warningText, okButtonText, notOkButtonText, redoButtonText);

        if (!redo) {
            await generalNewLineUpdate("checkBT", ["", "TRUE"]);
        } // NOTE: we are running generalNewLineUpdate("checkBT", error || bluetoothDevicesArray || audioDevicesArray) above
    }
}



