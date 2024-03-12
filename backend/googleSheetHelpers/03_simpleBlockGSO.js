// 03_simpleBlockGSO.js

const { getAuthenticatedClient, getAuthenticatedDriveClient } = require('./00_googleSheetAuth');

const { parseUserAgent, fancylog } = require('../utils');

/**
 * Fetches block parameters from the 'simpleBlock' tab of the main sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {string} prolificID - The Prolific ID of the participant.
 * @returns {Promise<Object>} - An object containing block parameters.
 */
async function fetchBlockParams(mainSheetID, prolificID, version) {
    const googleSheets = await getAuthenticatedClient();
    
    const FIRST_DATA_ROW = 18;
    const FIRST_DATA_COLUMN_INDEX = 4; //D
    
    // Define constants for the hardcoded ranges
    
    const sheetTab = `simpleBlock${version ? version : ''}!`;
    
    fancylog.log(sheetTab)

    const RANGES = [
        `${sheetTab}D2`,                    // PRESENTATION_LOGIC_RANGE
        `${sheetTab}D3`,                    // BLOCKS_N_RANGE
        `${sheetTab}D4`,                    // MESSAGE_BEFORE_BLOCK_RANGE
        `${sheetTab}D5`,                    // MESSAGE_AFTER_BLOCK_RANGE
        `${sheetTab}D7`,                    // RANDOMISE_WITHIN_BLOCKS_RANGE
        `${sheetTab}D10:H13`,               // QUESTIONS_RANGE
        `${sheetTab}D15`,                   // QUESTIONS_PRESENTATION_LOGIC
        `${sheetTab}D${FIRST_DATA_ROW}:AA`, // COMPLETED_BLOCKS
        `${sheetTab}C${FIRST_DATA_ROW}:C`,  // BLOCK_MEDIA_ADDRESS_RANGE
        `${sheetTab}B${FIRST_DATA_ROW}:B`   // BLOCK_NAMES_RANGE
    ];
    
    fancylog.log(RANGES)

    try {
        // Fetch all data with a single batchGet call
        const response = await googleSheets.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: RANGES
        });

        const sheetData = response.data.valueRanges;
        fancylog.log(`sheetData: ${JSON.stringify(sheetData, null, 2)}`);


        // Extract data from responses
        const presentationLogic = sheetData[0].values[0][0];
        const blocksN = sheetData[1].values[0][0];
        const messageBeforeBlock = sheetData[2]?.values[0][0] ?? undefined;
        const messageAfterBlock = sheetData[3]?.values[0][0] ?? undefined;        
        const randomiseTrialsWithinBlock = sheetData[4]?.values[0][0] ?? undefined;        
        
        fancylog.log(`presentationLogic: ${presentationLogic}`);
        fancylog.log(`blocksN: ${blocksN}`);
        
        // Check presentation logic
        if (presentationLogic !== "Each block is presented to N participant(s) only") {
            throw new Error("Invalid presentation logic");
        }
        
        // Fetching and processing the questions and answers
        const questionsData = sheetData[5].values;
        const questionsAndAnswers = questionsData.reduce((acc, row) => {
            const question = row[0];
            if (question) { // Check if the question is not falsy
                const answers = row.slice(1).filter(answer => answer); // Filter out falsy answers
                acc.push({ question, answers });
            }
            return acc;
        }, []);
        
        const questionsPresentationLogic = sheetData[6].values[0][0];

        fancylog.log(`Questions and Answers: ${JSON.stringify(questionsAndAnswers, null, 2)}`);
        fancylog.log(`Questions presentation logic: ${questionsPresentationLogic}`);

        const completedBlocksList = sheetData[7].values;
        const blockMediaAddressList = sheetData[8].values;
        const blockNamesList = sheetData[9].values;
        
        fancylog.log("completedBlocksList", completedBlocksList)
        fancylog.log(blockMediaAddressList)
        fancylog.log(blockNamesList)
        
        let minNonEmpty = blocksN;
        let selectedIndex = -1;
        for (let i = 0; i < blockMediaAddressList.length; i++) {
            if (!blockMediaAddressList[i] || (Array.isArray(blockMediaAddressList[i]) && blockMediaAddressList[i].length === 0)) {
                continue; // Skip if no media address is available for this row
            }
            fancylog.log(blockMediaAddressList[i])
            if (!completedBlocksList || !completedBlocksList[i]) {
                // If there's no corresponding entry in completedBlocksList, it's equivalent to 0 completed blocks
                selectedIndex = i;
                break;
            } else if (completedBlocksList[i].length < minNonEmpty) {
                minNonEmpty = completedBlocksList[i].length;
                selectedIndex = i;
                if (minNonEmpty === 0) break; // Optimization to stop when a row with 0 non-empty cells is found
            }
        }
        
        fancylog.log("selectedIndex", selectedIndex)
        
        let blockMediaAddress = null;
        let blockName = null;
        let reservedCell = null;
                    
        if (selectedIndex !== -1) {
            blockMediaAddress = blockMediaAddressList[selectedIndex] ? blockMediaAddressList[selectedIndex][0] : null;
            blockName = blockNamesList[selectedIndex] ? blockNamesList[selectedIndex][0] : null;
        
            // Calculate the column for reservedCell
            let firstEmptyColumnIndex = FIRST_DATA_COLUMN_INDEX;
            if (completedBlocksList && completedBlocksList[selectedIndex]) {
                firstEmptyColumnIndex += completedBlocksList[selectedIndex].length;
            }
            reservedCell = `${convertToColumnName(firstEmptyColumnIndex)}${FIRST_DATA_ROW + selectedIndex}`;
        }

        fancylog.log(`blockMediaAddress: ${blockMediaAddress}`);
        fancylog.log(`blockName: ${blockName}`);
        fancylog.log(`reservedCell: ${reservedCell}`);

        let driveFolderContents = null;
        if (blockMediaAddress) {
            driveFolderContents = await fetchDriveFolderContents(blockMediaAddress);
            // Randomise if needed
            if (['yes', 'y'].includes(randomiseTrialsWithinBlock.toLowerCase())) {
                fancylog.log("Randomising Trials: randomiseTrialsWithinBlock = ", randomiseTrialsWithinBlock)
                const fileMapArray = Object.entries(driveFolderContents); // Convert the object into an array of [key, value] pairs
                const shuffledFileMapArray = shuffleArray(fileMapArray); // Shuffle the array of key-value pairs
                driveFolderContents = shuffledFileMapArray.reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            } else {
                fancylog.log("Arranging Alphabetically: randomiseTrialsWithinBlock = ", randomiseTrialsWithinBlock);
                const fileMapArray = Object.entries(driveFolderContents); // Convert the object into an array of [key, value] pairs
                // Sort the array of key-value pairs alphabetically based on keys
                const sortedFileMapArray = fileMapArray.sort((a, b) => a[0].localeCompare(b[0]));
                driveFolderContents = sortedFileMapArray.reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            }
            fancylog.log("Order of driveFolderContents after:", Object.keys(driveFolderContents).join(", "));
            await checkoutBlock(mainSheetID, sheetTab, reservedCell, prolificID);
        }


        // Create the result object
        return {
            blocksN,
            messageBeforeBlock,
            messageAfterBlock,
            questionsAndAnswers,
            questionsPresentationLogic,
            blockMediaAddress,
            blockName,
            reservedCell,
            driveFolderContents
        };
        
    } catch (error) {
        fancylog.error("Error fetching block parameters from Google Sheets:", error);
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
    const drive = await getAuthenticatedDriveClient();
    const folderId = folderUrl.split('/').pop();
    fancylog.log(folderId);
    
    try {
        let pageToken = null;
        const fileMap = {};

        do {
            // List files in the folder with pagination
            const response = await drive.files.list({
                q: `'${folderId}' in parents`,
                fields: 'nextPageToken, files(id, name)',
                pageSize: 1000,
                pageToken: pageToken,
                orderBy: 'name'
            });

            // Process files to create a map of file names and download links, excluding .DS_Store or similar
            const files = response.data.files || [];
            files.forEach(file => {
                // Skip .DS_Store or any other specific files you want to exclude
                if (!file.name.endsWith('.DS_Store') && !file.name.endsWith('Thumbs.db') && !file.name.startsWith('.')) {
                    const downloadLink = `https://drive.google.com/uc?export=download&id=${file.id}`;
                    fileMap[file.name] = {
                        downloadLink: downloadLink,
                        fileId: file.id
                    };
                }
            });

            pageToken = response.data.nextPageToken;
        } while (pageToken);

        return fileMap;
    } catch (error) {
        fancylog.error("Error fetching contents from Google Drive folder:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}




module.exports = { fetchBlockParams, checkinOrConfirmBlock, clearOldCheckouts};