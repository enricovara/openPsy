// 04b_postStairGSO.js

const { getAuthenticatedClient, getAuthenticatedDriveClient } = require('./00_googleSheetAuth');

const { parseUserAgent, fancylog } = require('../utils');

/**
 * Fetches block parameters from the 'staircaseBlock' tab of the main sheet.
 * 
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {string} prolificID - The Prolific ID of the participant.
 * @returns {Promise<Object>} - An object containing block parameters.
 */
async function fetchPostStairParams(mainSheetID, prolificID, version) {
    const googleSheets = await getAuthenticatedClient();
    
    const FIRST_DATA_ROW = 21;
    
    // Define constants for the hardcoded ranges
    
    const sheetTab = `postStairBlock${version ? version : ''}!`;
    
    fancylog.log(sheetTab)

    const RANGES = [
        `${sheetTab}D2`,                    // PRESENTATION_LOGIC_RANGE  (NOT USED)
        `${sheetTab}D4`,                    // DIFFICULTY_LEVEL_RANGE
        `${sheetTab}D6`,                    // MESSAGE_BEFORE_BLOCK_RANGE
        `${sheetTab}D7`,                    // MESSAGE_AFTER_EACH_SUB_BLOCK_RANGE
        `${sheetTab}D8`,                    // MESSAGE_AFTER_BLOCK_RANGE
        `${sheetTab}H10`,                   // BLOCKS_PER_PARTICIPANT_RANGE
        `${sheetTab}H11`,                   // SENTENCES_PER_SUB_BLOCK_RANGE
        `${sheetTab}D10`,                   // RANDOMISE_WITHIN_BLOCKS_RANGE
        `${sheetTab}D12`,                   // RESPONSE_TYPE
        `${sheetTab}D14:H17`,               // QUESTIONS_RANGE
        `${sheetTab}D18`,                   // QUESTIONS_PRESENTATION_LOGIC
        `${sheetTab}C${FIRST_DATA_ROW}:C${FIRST_DATA_ROW+20}`,   // BLOCK_MEDIA_ADDRESS_RANGE
        `${sheetTab}B${FIRST_DATA_ROW}:B${FIRST_DATA_ROW+20}`,   // BLOCK_NAMES_RANGE
        `${sheetTab}J8`,                    // GIVE_END_HERE_OPTION_AFTER_BLOCK
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
        const presentationLogic = sheetData[0].values[0][0]; // (NOT USED)
        if (presentationLogic !== "Participants are presented N sub-blocks from their difficulty level, with breaks every M sentences") {
            throw new Error("Invalid presentation logic");
        }
        const difficultySource = sheetData[1].values[0][0];
        if (!difficultySource.startsWith("staircaseBlock")) {
            throw new Error("Invalid difficultySource");
        }
        const messageBeforeBlock = sheetData[2]?.values[0][0] ?? undefined;
        const messageAfterSubBlock = sheetData[3]?.values[0][0] ?? undefined;   
        const messageAfterBlock = sheetData[4]?.values[0][0] ?? undefined;   
        const blocksPerParticipant = sheetData[5].values[0][0];
        const sentencesPerSubBlock = sheetData[6].values[0][0];
        const giveEndAfterBlockOption = sheetData[13]?.values[0][0] ?? undefined;   
     
        const randomiseTrialsWithinBlock = sheetData[7]?.values[0][0] ?? undefined;        

        // Fetching the response type (GRID, questions, etc)
        const responseType = sheetData[8].values[0][0];      
        
        // Fetching and processing the questions and answers
        const questionsData = sheetData[9].values;
        const questionsAndAnswers = questionsData ? questionsData.reduce((acc, row) => {
            const question = row[0];
            if (question) { // Check if the question is not falsy
                const answers = row.slice(1).filter(answer => answer); // Filter out falsy answers
                acc.push({ question, answers });
            }
            return acc;
        }, []) : undefined;
        
        const questionsPresentationLogic = sheetData[10].values[0][0];

        fancylog.log(`Questions and Answers: ${JSON.stringify(questionsAndAnswers, null, 2)}`);
        fancylog.log(`Questions presentation logic: ${questionsPresentationLogic}`);

        const blockFolderAddressList = sheetData[11].values;
        const blockFolderNamesList = sheetData[12].values;

        // Fetching outcome of staircase
        const outcome = await loadStaircaseOutcome(mainSheetID, difficultySource, prolificID)
        const outcomeIndex = blockFolderNamesList.flat().indexOf(outcome);

        const outcomeFolderAddress = blockFolderAddressList[outcomeIndex];

        const outcomeFolderId = String(outcomeFolderAddress).split('/').pop();

        const blocks = [];        
        try {
            const drive = await getAuthenticatedDriveClient();
        
            // Fetch subfolders within the outcome folder
            let pageToken = null;
            const subfolders = [];
        
            do {
                const response = await drive.files.list({
                    q: `'${outcomeFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
                    fields: 'nextPageToken, files(id, name)',
                    pageSize: 1000,
                    pageToken: pageToken,
                    orderBy: 'name'
                });
        
                const folders = response.data.files || [];
                subfolders.push(...folders);
        
                pageToken = response.data.nextPageToken;
            } while (pageToken);
        
            // Process each subfolder
            for (const subfolder of subfolders) {
                const blockName = subfolder.name;
                const blockMediaAddress = `https://drive.google.com/drive/folders/${subfolder.id}`;
        
                fancylog.log(`Processing block: ${blockName}, media address: ${blockMediaAddress}`);
        
                // Fetch drive folder contents for this block
                let driveFolderContents = await fetchDriveFolderContents(blockMediaAddress);
        
                // Randomize or arrange alphabetically based on setting
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
                    blockName, // Name of the subfolder
                    blockMediaAddress,
                    driveFolderContents,
                });
            }
        } catch (error) {
            fancylog.error("Error fetching subfolders from Google Drive folder:", error);
            throw error;
        }

        // Create the result object
        return {
            messageBeforeBlock,
            messageAfterSubBlock,
            messageAfterBlock,
            giveEndAfterBlockOption,
            blocksPerParticipant,
            sentencesPerSubBlock,
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
 * Reads the outcome corresponding to the given prolificID.
 * The outcome corresponds to a value in blockNames, and we search the outcomeFor
 * range to find the row where the prolificID exists.
 *
 * @param {string} mainSheetID - The ID of the main Google Sheets spreadsheet.
 * @param {string} sheetTab - The full name of the sheet tab.
 * @param {string} prolificID - The Prolific ID of the participant.
 * @returns {Promise<string>} The outcome corresponding to the given prolificID.
 */
async function loadStaircaseOutcome(mainSheetID, sheetTab, prolificID) {
    const googleSheets = await getAuthenticatedClient();

    const FIRST_DATA_ROW = 20;
    const MAX_ROWS = 100; // Adjust based on expected number of outcomes

    const RANGES = [
        `${sheetTab}!D${FIRST_DATA_ROW}:AA${FIRST_DATA_ROW + MAX_ROWS}`, // OUTCOME_FOR_RANGE
        `${sheetTab}!B${FIRST_DATA_ROW}:B${FIRST_DATA_ROW + MAX_ROWS}`   // BLOCK_NAMES_RANGE
    ];

    try {
        // Fetch all data with a single batchGet call
        const response = await googleSheets.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: RANGES
        });

        const sheetData = response.data.valueRanges;

        const outcomeFor = sheetData[0].values || [];
        const blockNames = sheetData[1].values || [];

        // Loop over outcomeFor rows
        for (let i = 0; i < outcomeFor.length; i++) {
            const row = outcomeFor[i] || [];
            if (row.includes(prolificID)) {
                // ProlificID found in this row
                const outcome = (blockNames[i] && blockNames[i][0]) || null;
                if (outcome) {
                    return outcome;
                } else {
                    throw new Error(`Outcome not found for row ${i + FIRST_DATA_ROW}`);
                }
            }
        }

        // If we reach here, prolificID not found
        throw new Error(`ProlificID "${prolificID}" not found in any outcome`);
    } catch (error) {
        console.error("Error reading from sheet:", error);
        throw error; // Rethrow the error to be handled by the caller.
    }
}




module.exports = {fetchPostStairParams};