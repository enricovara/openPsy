

function GRID_HTMLcontent() {
    return `
        <div id="colorButtons">
            <div id="colorButtonsRow">
                <button class="button colorButton" style="background-color: blue;">Blue</button>
                <button class="button colorButton" style="background-color: green;">Green</button>
                <button class="button colorButton" style="background-color: red;">Red</button>
                <button class="button colorButton" style="background-color: white;">White</button>
            </div>
        </div>
        <div id="letterButtons">
            <div style="display: flex;">
                <button class="button letterButton">Q</button>
                <button class="button letterButton">W</button>
                <button class="button letterButton">E</button>
                <button class="button letterButton">R</button>
                <button class="button letterButton">T</button>
                <button class="button letterButton">Y</button>
                <button class="button letterButton">U</button>
                <button class="button letterButton">I</button>
                <button class="button letterButton">O</button>
                <button class="button letterButton">P</button>
            </div>
            <div class="secondRow" style="display: flex;">
                <button class="button letterButton">A</button>
                <button class="button letterButton">S</button>
                <button class="button letterButton">D</button>
                <button class="button letterButton">F</button>
                <button class="button letterButton">G</button>
                <button class="button letterButton">H</button>
                <button class="button letterButton">J</button>
                <button class="button letterButton">K</button>
                <button class="button letterButton">L</button>            
            </div>
            <div class="thirdRow" style="display: flex;">
                <button class="button letterButton">Z</button>
                <button class="button letterButton">X</button>
                <button class="button letterButton">C</button>
                <button class="button letterButton">V</button>
                <button class="button letterButton">B</button>
                <button class="button letterButton">N</button>
                <button class="button letterButton">M</button>
            </div>
        </div>
        <div id="numberButtons">
            <div style="display: flex;">
                <button class="button numberButton">0</button>
                <button class="button numberButton">1</button>
                <button class="button numberButton">2</button>
                <button class="button numberButton">3</button>
                <button class="button numberButton">4</button>
                <button class="button numberButton">5</button>
                <button class="button numberButton">6</button>
                <button class="button numberButton">7</button>
                <button class="button numberButton">8</button>
                <button class="button numberButton">9</button>
            </div>
        </div>
    `;
}


function GRID_CSScontent() {
    return `
        .button {
            border: 1px solid grey;/* Adjust thickness of border as needed */
            /*border: 4px solid transparent; */
            border-radius: 5px; /* Adjust rounded corners as needed */
            display: block;
            margin: 10px;
            padding: 10px;
            cursor: pointer;
            font-size: 20px;

        }
        .colorButton {
            color: white; /* default text color for all colorButtons */
        }
        .colorButton[style*="background-color: white;"] {
            color: black; /* text color specifically for the white colorButton */
        }
        .numberButton {
            background-color: #BBB;
        }
        .letterButton {
            width: 46px;
            margin: 4px;
        }
        #letterButtons, #colorButtons {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        #colorButtonsRow {
            display: flex;
            flex-direction: row;
        }
        .secondRow {
            margin-left: -25px;
        }
        .thirdRow {
            margin-left: -65px;
        }        
        .selected {
            /*border: 4px solid #000; Add a border to the selected button */
            /*box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.2); */
            box-shadow: 0 0 5px 2px rgba(0, 0, 0, 0.4);
        }        
        .button:hover, .button.selected {
            filter: brightness(90%); /* Darkens the button's appearance */
        }        
    `;
}