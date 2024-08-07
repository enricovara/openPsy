// 04_staircaseGSO.js

const { getAuthenticatedClient, getAuthenticatedDriveClient } = require('./00_googleSheetAuth');

const { parseUserAgent, fancylog } = require('../utils');
const { file } = require('googleapis/build/src/apis/file');


/**
 * Fetches block parameters from the 'staircaseBlock' tab of the main sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {string} prolificID - The Prolific ID of the participant.
 * @returns {Promise<Object>} - An object containing block parameters.
 */
async function fetchStaircaseParams(mainSheetID, prolificID, version) {
    const googleSheets = await getAuthenticatedClient();
    
    const FIRST_DATA_ROW = 18;
    const FIRST_DATA_COLUMN_INDEX = 4; //D
    
    // Define constants for the hardcoded ranges
    
    const sheetTab = `staircase${version ? version : ''}!`;
    
    fancylog.log(sheetTab)

    const RANGES = [

        `${sheetTab}D4`,                    // MESSAGE_BEFORE_BLOCK_RANGE [0]
        `${sheetTab}D5`,                    // MESSAGE_AFTER_BLOCK_RANGE  [1]
        `${sheetTab}D6`,                    // Number of stairs           [2]
        `${sheetTab}D11`,                   // MESSAGE_BETWEEN STAIRS     [3]
        `${sheetTab}E11:F11`,               // Answers yes no, later GRID [4]
        
        `${sheetTab}C19:C28`,               // BLOCK_MEDIA_ADDRESS_RANGE  [5]
        `${sheetTab}B19:B28`,               // BLOCK_NAMES_RANGE 1-10     [6] 

        `${sheetTab}E12:H12`,               // Answers colors             [7]
        `${sheetTab}E13:H13`,               // Answers letters            [8]
        `${sheetTab}E14:H14`,               // Answers numbers            [9]

        `${sheetTab}C38:D40`,               // Filename with answers     [10]

    ];
    
    //fancylog.log(RANGES)

    try {
        // Fetch all data with a single batchGet call
        const response = await googleSheets.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: RANGES
        });

        const sheetData = response.data.valueRanges;

        fancylog.log(`sheetData: ${JSON.stringify(sheetData, null, 2)}`)

        // Extract data from responses
        const numOfStairs = parseInt(sheetData[2].values[0]);
        const question = sheetData[3].values[0];
        const answers = sheetData[4].values[0];
        const blockAdresses = sheetData[5].values;
        const blockNumber = sheetData[6].values;

        const messageBeforeBlock = sheetData[0]?.values[0][0] ?? undefined;
        const messageBetweenStairs = sheetData[3]?.values[0][0] ?? undefined;
        const messageAfterBlock = sheetData[1]?.values[0][0] ?? undefined; 
        
        const answersGridColors = sheetData[7].values[0];
        const answersGridLetters = sheetData[8].values[0];
        const answersGridNumbers = sheetData[9].values[0];

        const fileNamesAndAnswers = sheetData[10].values.map(row => ({
            fileName: row[0],
            answer: row[1]
        }));

        fancylog.log(`numOfStars: ${numOfStairs}`)
        fancylog.log(`question: ${question}`);
        fancylog.log(`answers: ${answers}`);
        fancylog.log(`adresses of blocks: ${blockAdresses}`);
        fancylog.log(`number of blocks: ${blockNumber}`);

        fancylog.log(`message before block: ${messageBeforeBlock}`);
        fancylog.log(`messages inbetween stairs: ${messageBetweenStairs}`);
        fancylog.log(`message after block: ${messageAfterBlock}`);

        fancylog.log(`GRID colors: ${answersGridColors}`);
        fancylog.log(`GRID letters: ${answersGridLetters}`);
        fancylog.log(`GRID numbers: ${answersGridNumbers}`);

        fancylog.log(`filename & answers: ${fileNamesAndAnswers}`);

        //const stepCorrect = parseInt(sheetData[1].values[0][0]);
        //const stepIncorrect = parseInt(sheetData[2].values[0][0]);
        //const numStairs = parseInt(sheetData[3].values[0][0]);
        //const numSaverage = parseInt(sheetData[4].values[0][0]); // num stairs to be averaged (e.g. if first is practice)
        //const numReversals = parseInt(sheetData[5].values[0][0]);
        //const numRaverage = parseInt(sheetData[6].values[0][0]); // num reversals to be averaged (e.g. if first is forgiven)
        //const mediaType = sheetData[7].values[0][0]; // "video" or "audio"


        //fancylog.log(`startValueRange: ${startValueRange}`)
        //fancylog.log(`stepCorrect, stepIncorrect: ${stepCorrect} ${stepIncorrect}`)
        //fancylog.log(`numStairs: ${numStairs}`)
        //fancylog.log(`numReversals, numRaverage: ${numReversals} ${numRaverage}`)

        //const variableList = sheetData[11].values;
        //const mediaAddressList = sheetData[12].values;
        
        //fancylog.log("variableList", variableList)
        //fancylog.log("mediaAddressList", mediaAddressList)

        //let intIndexedFolderIDs = {};
        //let intIndexedFolderURLs = {};
        //for (let i = 0; i < variableList.length; i++) {
        //    let key = parseInt(variableList[i], 10);
        //    if (!isNaN(key) && mediaAddressList[i]) {
        //        folderURL = mediaAddressList[i];
        //        intIndexedFolderURLs[key] = folderURL;
        //        fancylog.log(folderURL)
        //        intIndexedFolderIDs[key] = folderURL[0].split('/').pop();
        //    }
        //}

        // Create the result object
        const result = {
            numOfStairs,
            question,
            answers,
            blockAdresses,
            blockNumber,
            messageBeforeBlock,
            messageBetweenStairs,
            messageAfterBlock,
            answersGridColors,
            answersGridNumbers,
            answersGridLetters,
            fileNamesAndAnswers
        };

        fancylog.log(`result in staircaseGSO: ${JSON.stringify(result)}`);
        return result;
        
    } catch (error) {
        fancylog.error("Error fetching staircase parameters from Google Sheets:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}


// Helper function to convert column index to column name (e.g., 1 -> A, 2 -> B, etc.)
function convertToColumnName(columnIndex) {
    let columnName = '';
    while (columnIndex > 0) {
        let modulo = (columnIndex - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        columnIndex = Math.floor((columnIndex - modulo) / 26);
    }
    return columnName;
}


// Fisher-Yates Shuffle Function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


/**
 * Checks out a block by updating its status in the Google Sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {number} reservedCell - The address of the reservation in the sheet.
 * @param {string} prolificID - The Prolific ID of the participant.
 */
async function checkoutBlock(mainSheetID, sheetTab, reservedCell, prolificID) {
    try {
        const googleSheets = await getAuthenticatedClient();
        const datetime_text = new Date().toLocaleString('en-GB', { timeZone: 'UTC' }).replace(/,/g, '');
        const checkOutRequest = {
            spreadsheetId: mainSheetID,
            range: `${sheetTab}${reservedCell}`,
            valueInputOption: 'RAW', // Use USER_ENTERED if you want to allow formulas, etc.
            resource: {
                values: [[`checked out by ${prolificID} ${datetime_text}`]]
            }
        };
        
        await googleSheets.spreadsheets.values.update(checkOutRequest);
    
    } catch (error) {
        fancylog.error("Error posting to sheet:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}


/**
 * Checks in a block by clearing its status in the Google Sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {number} reservedCell - The address of the reservation in the sheet.
 */
async function checkinOrConfirmBlock(mainSheetID, version, prolificID, reservedCell, actionType) {
    try {
        const googleSheets = await getAuthenticatedClient();
        let updateString;
        if (actionType === "checkin") {
            updateString = ``
        } else if (actionType === "confirm") {
            updateString = `${prolificID}`
        } else {
            updateString = `ERROR`
        }
        const sheetTab = `simpleBlock${version ? version : ''}!`;
        const checkInRequest = {
            spreadsheetId: mainSheetID,
            range: `${sheetTab}${reservedCell}`,
            valueInputOption: 'RAW', // Use USER_ENTERED if you want to allow formulas, etc.
            resource: {
                values: [[updateString]] // Clearing the cell by setting it to an empty string
            }
        };

        await googleSheets.spreadsheets.values.update(checkInRequest);

    
    } catch (error) {
        fancylog.error("Error posting to sheet:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}


/**
 * Clears cells containing datetimes older than 1 hour in a specified range.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {string} version - The appendix to the name of the sheet tab.
 */
async function clearOldCheckouts(mainSheetID, version) {
    try {
        const googleSheets = await getAuthenticatedClient();
        
        fancylog.log("resetting old checked out blocks")
        
        const FIRST_DATA_COLUMN_INDEX = 4; //D
        const FIRST_DATA_ROW = 14;
        const sheetTab = `simpleBlock${version ? version : ''}!`;
        const range = `${sheetTab}D${FIRST_DATA_ROW}:AA`; // COMPLETED_BLOCKS


        // Fetch the data from the range
        const dataRequest = {
            spreadsheetId: mainSheetID,
            range: range
        };
        const response = await googleSheets.spreadsheets.values.get(dataRequest);
        const data = response.data.values;

        if (!data) {
            fancylog.error("No data found in clearOldCheckouts query.");
            return;
        }

        const now = new Date();
        const clearRequests = [];
        
        // Iterate through the data to find and prepare cells to clear
        data.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                fancylog.log(cell)
                const parts = cell.split(" ");
                for (let i = 0; i < parts.length; i++) {
                    fancylog.log("   ", parts[i] + " " + parts[i + 1])
                    // Check for datetime pattern and avoid splitting it
                    if (i < parts.length - 1 && isDateTime(parts[i] + " " + parts[i + 1])) {
                        const dateTime = convertToDateTime(parts[i] + " " + parts[i + 1]);
                        fancylog.log("   ", "   ", dateTime)
                        fancylog.log("   ", "   ", now)
                        if (isMoreThanOneHourOld(dateTime, now)) {
                            const cellAddress = `${convertToColumnName(colIndex + FIRST_DATA_COLUMN_INDEX)}${rowIndex + FIRST_DATA_ROW}`;
                            clearRequests.push({
                                range: `${sheetTab}${cellAddress}`,
                                values: [[""]]
                            });
                        }
                        i++;
                    }
                }
            });
        });
        
        fancylog.log(clearRequests)
        

        // Make a batch update if there are cells to clear
        if (clearRequests.length > 0) {
            const batchClearRequest = {
                spreadsheetId: mainSheetID,
                resource: {
                    valueInputOption: 'RAW',
                    data: clearRequests
                }
            };
            await googleSheets.spreadsheets.values.batchUpdate(batchClearRequest);
        }
    } catch (error) {
        fancylog.error("Error updating sheet:", error);
        throw error;
    }
}



/**
 * Checks if a string is a valid datetime.
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is a datetime, false otherwise.
 */
function isDateTime(str) {
    const regex = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}$/;
    return regex.test(str);
}

/**
 * Converts a string in the format "DD/MM/YYYY HH:MM:SS" to a JavaScript Date object.
 * @param {string} dateTimeStr - The date-time string to convert.
 * @returns {Date|null} The Date object if valid, null otherwise.
 */
function convertToDateTime(dateTimeStr) {
    const regex = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}$/;
    
    if (regex.test(dateTimeStr)) {
        const parts = dateTimeStr.split(/\/|:| /);
        // Note: Months are 0-indexed in JavaScript Date (0 for January, 1 for February, etc.)
        return new Date(Date.UTC(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5]));
    } else {
        return null;
    }
}


/**
 * Checks if a datetime is more than one hour old.
 * @param {Date} dateTime - The datetime to check.
 * @param {Date} now - The current datetime.
 * @returns {boolean} True if the datetime is more than one hour old, false otherwise.
 */
function isMoreThanOneHourOld(dateTime, now) {
    return (now - dateTime) > 3600000; // 1 hour in milliseconds
}


/**
 * Fetches the contents of a Google Drive folder and returns a map of file names and direct download links.
 * 
 * @param {string} folderUrl - The Google Drive folder URL.
 * @returns {Promise<Object>} - An object containing file names and their direct download links.
 */
async function fetchDriveFolderContents(folderUrl) {
    const drive = await getAuthenticatedDriveClient()

    // Extract folder ID from the URL
    const folderId = folderUrl.split('/').pop();
    
    fancylog.log(folderId)

    try {
        // List all files in the folder
        const response = await drive.files.list({
            q: `'${folderId}' in parents`,
            fields: 'files(id, name)',
            orderBy: 'name'
        });

        // Process files to create a map of file names and download links
        const files = response.data.files || [];
        const fileMap = {};

        files.forEach(file => {
            // Construct the direct download link
            const downloadLink = `https://drive.google.com/uc?export=download&id=${file.id}`;
            fileMap[file.name] = downloadLink;
        });

        return fileMap;
    } catch (error) {
        fancylog.error("Error fetching contents from Google Drive folder:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}



module.exports = { fetchStaircaseParams };