
const bluetoothKeywords = {
    specific: [
        // Specific models and unique identifiers
        "WH-1000XM", "WF-1000XM", "QC35", "Elite 75t", "Elite 85t", "Push Ultra", "FreeBuds", "Bud+", "TWS1", "NC700"
    ],
    general: [
        // Brands and common terms
        "AirPods", "Bose", "Sony", "JBL", "Beats", "Sennheiser", "Skullcandy", "Harman", "Kardon", "Bang", "Olufsen", 
        "B&O", "Marshall", "Anker", "Soundcore", "Jaybird", "Bowers", "Wilkins", "AKG", "Plantronics", "Shure", "Audio-Technica",
        "Logitech", "UE", "Ultimate Ears", "Samsung", "Galaxy Buds", "LG", "Tone", "Panasonic", "Philips", "Huawei", "Xiaomi",
        "OnePlus", "Buds", "RHA", "Klipsch", "Pioneer", "Turtle Beach", "Corsair", "Razer", "HyperX", "SteelSeries",
        "Bluetooth", "SoundLink", "SoundSport", "QuietComfort", "Earbuds", "Over-Ear", "On-Ear", "Headset", "Neckband", 
        "True Wireless", "TWS", "ANC", "Active Noise Cancelling", "Hands-free", "hyphen"
    ]
};

const nonAudioKeywords = [
    "keyboard", "mouse", "pen", "pad", "tablet", "trackpad", "controller", "smartwatch", "bracelet", "printer", "scanner", "watch", "gopro", "print"
];


function containsBluetoothKeyword(deviceName) {
    const lowerCaseDeviceName = deviceName.toLowerCase();
    
    // If a device contains non-audio keywords, return false immediately
    if (nonAudioKeywords.some(keyword => lowerCaseDeviceName.includes(keyword.toLowerCase()))) {
        return false;
    }

    // Check if the device name contains any of the specific or general Bluetooth keywords.
    // With the updated requirement, it's sufficient to match any single keyword.
    return bluetoothKeywords.specific.some(keyword => lowerCaseDeviceName.includes(keyword.toLowerCase()))
        || bluetoothKeywords.general.some(keyword => lowerCaseDeviceName.includes(keyword.toLowerCase()));
}

function checkBluetoothAudio() {
    let audioDevices = [];

    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        devices.forEach(device => {
            if(device.kind === 'audiooutput') {
                audioDevices.push(device.label);
            }
        });

        // Changed this to get all paired Bluetooth devices instead of requiring user to select one
        return navigator.bluetooth.getDevices();
    })
    .then(bluetoothDevices => {
        bluetoothDevices.forEach(bluetoothDevice => {
            if(bluetoothDevice.gatt.connected) {
                for (let audioDevice of audioDevices) {
                    const directComparison = audioDevice.includes(bluetoothDevice.name) || bluetoothDevice.name.includes(audioDevice);
                    const keywordComparison = containsBluetoothKeyword(bluetoothDevice.name);
                    
                    if (directComparison || keywordComparison) {
                        showModalBluetooth();
                        return;
                    }
                }
            }
        });
    })
    .catch(error => {
        console.log('Error:', error);
    });
}

// If using modules, remember to export the function
// export { checkBluetoothAudio };

