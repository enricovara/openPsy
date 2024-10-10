// 04b_staircaseGSO.js

const { getAuthenticatedClient, getAuthenticatedDriveClient } = require('./00_googleSheetAuth');

const { parseUserAgent, fancylog } = require('../utils');

/**
 * Fetches block parameters from the 'staircaseBlock' tab of the main sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @returns {Promise<Object>} - An object containing block parameters.
 */
async function fetchStaircaseParams(mainSheetID, version) {
    const googleSheets = await getAuthenticatedClient();
    
    const FIRST_DATA_ROW = 20;
    
    // Define constants for the hardcoded ranges
    
    const sheetTab = `staircaseBlock${version ? version : ''}!`;
    
    fancylog.log(sheetTab)

    const RANGES = [
        `${sheetTab}D2`,                    // MESSAGE_BEFORE_BLOCK_RANGE
        `${sheetTab}D3`,                    // MESSAGE_AFTER_EACH_STAIR_RANGE
        `${sheetTab}D4`,                    // MESSAGE_AFTER_BLOCK_RANGE
        `${sheetTab}D6:H6`,                 // STARTPOINTS_RANGE
        `${sheetTab}D7`,                    // REVERSALS_RANGE
        `${sheetTab}D9`,                    // RANDOMISE_WITHIN_BLOCKS_RANGE
        `${sheetTab}D11`,                   // RESPONSE_TYPE
        `${sheetTab}D13:H16`,               // QUESTIONS_RANGE
        `${sheetTab}D17`,                   // QUESTIONS_PRESENTATION_LOGIC
        `${sheetTab}C${FIRST_DATA_ROW}:C${FIRST_DATA_ROW+19}`,  // BLOCK_MEDIA_ADDRESS_RANGE
        `${sheetTab}B${FIRST_DATA_ROW}:B${FIRST_DATA_ROW+19}`   // BLOCK_NAMES_RANGE
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
        const messageBeforeBlock = sheetData[0]?.values[0][0] ?? undefined;
        const messageAfterEachStair = sheetData[1]?.values[0][0] ?? undefined;   
        const messageAfterBlock = sheetData[2]?.values[0][0] ?? undefined;   
        const startPoints = sheetData[3].values;
        const reversals = sheetData[4].values[0][0];
     
        const randomiseTrialsWithinBlock = sheetData[5]?.values[0][0] ?? undefined;        
        
        fancylog.log(`startPoints: ${startPoints}`);
        fancylog.log(`reversals: ${reversals}`);

        // Fetching the response type (GRID, questions, etc)
        const responseType = sheetData[6].values[0][0];      
        
        // Fetching and processing the questions and answers
        const questionsData = sheetData[7].values;
        const questionsAndAnswers = questionsData ? questionsData.reduce((acc, row) => {
            const question = row[0];
            if (question) { // Check if the question is not falsy
                const answers = row.slice(1).filter(answer => answer); // Filter out falsy answers
                acc.push({ question, answers });
            }
            return acc;
        }, []) : undefined;
        
        const questionsPresentationLogic = sheetData[8].values[0][0];

        fancylog.log(`Questions and Answers: ${JSON.stringify(questionsAndAnswers, null, 2)}`);
        fancylog.log(`Questions presentation logic: ${questionsPresentationLogic}`);

        const blockMediaAddressList = sheetData[9].values;
        const blockNamesList = sheetData[10].values;
        
        fancylog.log(blockMediaAddressList)
        fancylog.log(blockNamesList)

        const blocks = [];

        for (let i = 0; i < blockNamesList.length; i++) {
            const blockNameRow = blockNamesList[i];
            const blockMediaAddressRow = blockMediaAddressList[i];
        
            // Check if both rows are valid
            if (!blockNameRow || !blockMediaAddressRow) {
                continue; // Skip if either is missing
            }
        
            const blockName = blockNameRow[0];
            const blockMediaAddress = blockMediaAddressRow[0];
        
            // Skip if blockName or blockMediaAddress is empty
            if (!blockName || !blockMediaAddress) {
                continue;
            }
        
            fancylog.log(`Processing block: ${blockName}, media address: ${blockMediaAddress}`);
        
            // Fetch drive folder contents for this block
            let driveFolderContents = await fetchDriveFolderContents(blockMediaAddress);
        
            // Randomize if needed
            if (['yes', 'y'].includes(randomiseTrialsWithinBlock.toLowerCase())) {
                fancylog.log(`Randomizing trials for block "${blockName}"`);
                const fileMapArray = Object.entries(driveFolderContents);
                const shuffledFileMapArray = shuffleArray(fileMapArray);
                driveFolderContents = shuffledFileMapArray.reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            } else {
                fancylog.log(`Arranging trials alphabetically for block "${blockName}"`);
                const fileMapArray = Object.entries(driveFolderContents);
                const sortedFileMapArray = fileMapArray.sort((a, b) => a[0].localeCompare(b[0]));
                driveFolderContents = sortedFileMapArray.reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            }
        
            fancylog.log(`Order of driveFolderContents for block "${blockName}":`, Object.keys(driveFolderContents).join(", "));
        
            // Add this block's data to the blocks array
            blocks.push({
                blockName, // this is an int and is if the difficulty level
                blockMediaAddress,
                driveFolderContents,
            });
        }

        // Create the result object
        return {
            messageBeforeBlock,
            messageAfterEachStair,
            messageAfterBlock,
            startPoints,
            reversals,
            responseType,
            questionsAndAnswers,
            questionsPresentationLogic,
            blocks,
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
 * Fetches the contents of a Google Drive folder and returns a map of file names and direct download links.
 * 
 * @param {string} folderUrl - The Google Drive folder URL.
 * @returns {Promise<Object>} - An object containing file names and their direct download links.
 */
async function fetchDriveFolderContents(folderUrl) {
    const drive = await getAuthenticatedDriveClient();
    const folderId = folderUrl.split('/').pop();
    //fancylog.log(folderId);
    
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


/**
 * Writes the prolificID into the first empty cell in the row corresponding to the outcome.
 * The outcome corresponds to a value in blockNames, and we want to fill the first available cell
 * in the range outcomeFor in the row corresponding to the outcome in blockNames.
 *
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {string} version - The version identifier for the sheet tab.
 * @param {string} prolificID - The Prolific ID of the participant.
 * @param {string} outcome - The outcome value to identify the correct row in the sheet.
 */
async function saveStaircaseOutcome(mainSheetID, version, prolificID, outcome) {
    const googleSheets = await getAuthenticatedClient();

    const sheetTab = `staircaseBlock${version ? version : ''}!`;

    const FIRST_DATA_ROW = 20;
    const FIRST_DATA_COLUMN_INDEX = 4; // Column D

    const RANGES = [
        `${sheetTab}B${FIRST_DATA_ROW}:B${FIRST_DATA_ROW + 19}` // BLOCK_NAMES_RANGE
    ];

    try {
        // Fetch block names to find the row index
        const response = await googleSheets.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: RANGES
        });

        const sheetData = response.data.valueRanges;
        fancylog.log(`sheetData: ${JSON.stringify(sheetData, null, 2)}`);

        const blockNames = sheetData[0].values;

        // Find the row index where blockNames[row][0] === outcome
        let rowIndex = blockNames.findIndex(row => row[0] === String(outcome));

        if (rowIndex === -1) {
            throw new Error(`Outcome "${outcome}" not found in blockNames (${blockNames})`);
        }

        console.log(`rowIndex: ${rowIndex}`);

        // Calculate the actual row number in the sheet
        const sheetRowNumber = FIRST_DATA_ROW + rowIndex;

        // Define the range to fetch data in that row from column D onwards
        const startColumnName = convertToColumnName(FIRST_DATA_COLUMN_INDEX); // Column D
        const endColumnName = convertToColumnName(100); // Adjust the end column as needed
        const dataRange = `${sheetTab}${startColumnName}${sheetRowNumber}:${endColumnName}${sheetRowNumber}`;

        // Fetch the data in that row
        const outcomeRowResponse = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: dataRange
        });

        const outcomeRow = outcomeRowResponse.data.values ? outcomeRowResponse.data.values[0] : [];

        // Find the first empty cell in the row
        let columnIndex;

        if (!outcomeRow || outcomeRow.length === 0) {
            // The row is empty, write to the first column (column D)
            columnIndex = 0;
        } else {
            // Find the first empty cell
            columnIndex = outcomeRow.findIndex(cell => !cell || cell === '');

            // If no empty cell found, append to the end
            if (columnIndex === -1) {
                columnIndex = outcomeRow.length;
            }
        }

        // Calculate the actual column index in the sheet
        const actualColumnIndex = FIRST_DATA_COLUMN_INDEX + columnIndex;
        const cellColumnName = convertToColumnName(actualColumnIndex);

        const toBeFilledCell = `${cellColumnName}${sheetRowNumber}`;

        // Proceed to update the cell with the prolificID
        const checkInRequest = {
            spreadsheetId: mainSheetID,
            range: `${sheetTab}${toBeFilledCell}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[prolificID]]
            }
        };

        await googleSheets.spreadsheets.values.update(checkInRequest);

    } catch (error) {
        fancylog.error("Error posting to sheet:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}




module.exports = { fetchStaircaseParams, saveStaircaseOutcome};