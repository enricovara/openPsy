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
async function fetchBlockParams(mainSheetID, prolificID) {
    const googleSheets = await getAuthenticatedClient();
    
    const FIRST_DATA_ROW = 16;
    
    // Define constants for the hardcoded ranges
    const RANGES = [
        'simpleBlock!D2', // PRESENTATION_LOGIC_RANGE
        'simpleBlock!D3', // BLOCKS_N_RANGE
        'simpleBlock!D4:5', // BLOCK_LIST_RANGE
        'simpleBlock!D6', // MESSAGE_BETWEEN_BLOCKS_RANGE
        'simpleBlock!D7', // MESSAGE_AFTER_LAST_BLOCK_RANGE
        'simpleBlock!D10:H13', //QUESTIONS_RANGE
        `simpleBlock!D${FIRST_DATA_ROW}:D`, // COMPLETED_BLOCKS
        `simpleBlock!C${FIRST_DATA_ROW}:C`, // BLOCK_MEDIA_ADDRESS_RANGE
        `simpleBlock!C${FIRST_DATA_ROW}:B` // BLOCK_NAMES_RANGE
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
        const messageBetweenBlocks = sheetData[3].values[0][0];
        const messageAfterLastBlock = sheetData[4].values[0][0];
        
        fancylog.log(`presentationLogic: ${presentationLogic}`);
        fancylog.log(`blocksN: ${blocksN}`);
        
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

        fancylog.log(`Questions and Answers: ${JSON.stringify(questionsAndAnswers, null, 2)}`);
    

        // Check presentation logic
        if (presentationLogic !== "Participants are presented N blocks without resampling between participants") {
            throw new Error("Invalid presentation logic");
        }
                
        // Process the block list to create a map/dict
        const blockListRaw = sheetData[2].values;
        const blockList = blockListRaw[0].reduce((acc, key, index) => {
            if (key) acc[key] = blockListRaw[1][index] || '';
            return acc;
        }, {});
        
        fancylog.log(`blockList: ${JSON.stringify(blockList, null, 2)}`);


        // Find block media address and block cell range
        const completedBlocksList = sheetData[6].values;
        const blockMediaAddressList = sheetData[7].values;
        const blockNamesList = sheetData[8].values;
        fancylog.log(`completedBlocksList: ${JSON.stringify(completedBlocksList, null, 2)}`); // in the test case I get a list of 2 elements
        fancylog.log(`blockMediaAddressList: [redacted because too long]`); // in the test case I get a list of 1000 elements
        let blockMediaAddress, blockCellRow;
        const firstEmptyIndex = completedBlocksList.findIndex(row => !row[0]);
        const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : completedBlocksList.length;
        blockMediaAddress = blockMediaAddressList[targetIndex][0];
        blockName = blockNamesList[targetIndex][0];
        blockCellRow = (FIRST_DATA_ROW + targetIndex).toString();

        
        fancylog.log(`blockMediaAddress: ${blockMediaAddress}`);
        fancylog.log(`blockName: ${blockName}`);
        fancylog.log(`blockCellRow: ${blockCellRow}`);
        
        if (!blockMediaAddress) {
            throw new Error("Block media address not found");
        }

        // Calculate nthBlockParticipant
        const nthBlockParticipant = completedBlocksList.filter(row => row[0] === prolificID).length + 1;

        fancylog.log(`nthBlockParticipant: ${nthBlockParticipant}`);

        // Fetches the contents of the Google Drive folder and returns a map of file names and direct download links.
        const driveFolderContents = await fetchDriveFolderContents(blockMediaAddress);
        
        fancylog.log(`driveFolderContents: ${JSON.stringify(driveFolderContents, null, 2)}`); // in the test case I get a list of 2 elements

        // CHECKOUT block
        await checkoutBlock(mainSheetID, blockCellRow, prolificID);

        // Create the result object
        return {
            blocksN,
            blockList,
            messageBetweenBlocks,
            messageAfterLastBlock,
            questionsAndAnswers,
            blockMediaAddress,
            blockName,
            blockCellRow,
            nthBlockParticipant,
            driveFolderContents
        };
        
    } catch (error) {
        fancylog.error("Error fetching block parameters from Google Sheets:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}


/**
 * Checks out a block by updating its status in the Google Sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {number} blockCellRow - The row number of the block in the sheet.
 * @param {string} prolificID - The Prolific ID of the participant.
 */
async function checkoutBlock(mainSheetID, blockCellRow, prolificID) {
    try {
        const googleSheets = await getAuthenticatedClient();
        const checkOutRequest = {
            spreadsheetId: mainSheetID,
            range: `simpleBlock!D${blockCellRow}`,
            valueInputOption: 'RAW', // Use USER_ENTERED if you want to allow formulas, etc.
            resource: {
                values: [[`checked out by ${prolificID}`]]
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
 * @param {number} blockCellRow - The row number of the block in the sheet.
 */
async function checkinOrConfirmBlock(mainSheetID, blockCellRow, actionType) {
    try {
        const googleSheets = await getAuthenticatedClient();
        if (actionType === "checkin") {
            updateString = ``
        } else if (actionType === "confirm") {
            updateString = `${prolificID}`
        } else {
            updateString = `ERROR`
        }
        const checkInRequest = {
            spreadsheetId: mainSheetID,
            range: `simpleBlock!D${blockCellRow}`,
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
 * Fetches the contents of a Google Drive folder and returns a map of file names and direct download links.
 * 
 * @param {string} folderUrl - The Google Drive folder URL.
 * @returns {Promise<Object>} - An object containing file names and their direct download links.
 */
async function fetchDriveFolderContents(folderUrl) {
    const drive = await getAuthenticatedDriveClient()

    // Extract folder ID from the URL
    const folderId = folderUrl.split('/').pop();

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



module.exports = { fetchBlockParams, checkinOrConfirmBlock };