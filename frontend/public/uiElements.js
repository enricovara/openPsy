
function initUIElements() {
    // LOAD USER OR DEMO WHILE INFORMED CONSENT IS READ
    var title = document.getElementById('title').style.display = 'block';
    
    var consentSection = document.getElementById('consentSection');
    var consentButton = document.getElementById('consentButton');
    var startButton = document.getElementById('startButton');
    var videoElement = document.getElementById('myVideo');
    var colorButtons = document.getElementById('colorButtons');
    var letterButtons = document.getElementById('letterButtons');
    var numberButtons = document.getElementById('numberButtons');
    var continueButton = document.getElementById('continueButton');
    var errorMsg = document.getElementById('errorMsg');
    var endMessage = document.getElementById('endMessage');
    var returnToProlificButton = document.getElementById('returnToProlific');
    
    var videosArray = [];
    var currentVideoIndex = 0;
    var selectedColor, selectedLetter, selectedNumber;
}
