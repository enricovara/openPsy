// setupGSO.js

const { getAuthenticatedClient } = require('./00_googleSheetAuth');
const { parseUserAgent } = require('../utils');

const controlRoomTab = 'controlRoom!';
const titleCell = 'B5'
const generalErrorCell = 'K5'
const stepsCells = 'B8:G'
const stepNumbCellIdx = 0
const stepTypeCellIdx = 2
const stepTODOCellIdx = 4
const stepExitCellIdx = 5


const participantLogTab = 'participantLog!';
const PIDColumn = 'B'
const UserAgentColumn = 'C'
const firstStepColumn = 'D'
const stepNumRow = '4'


/**
 * FETCH experiment TITLE, general PROLIFIC ERROR CODE, and a STEPs DICT (types, do?, prolificCode)
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @param {Object} gSheetsAuthClient - the authenticated Google Sheets API client. 
 
 * @return {Object} An object containing the experiment title, the general prolific error code, 
 *                  and dictionaries mapping step numbers to types, do?s, and prolificCodes.
 */
async function getBaseExpParams(mainSheetID, gSheetsAuthClient) {
    try {
        
        // Prepare the batchGet request
        const titleAndErrorCodeRange = [`${controlRoomTab}${titleCell}`, `${controlRoomTab}${generalErrorCell}`];
        const stepsRange = `${controlRoomTab}${stepsCells}`;
    
        const ranges = [...titleAndErrorCodeRange, stepsRange];
    
        // Getting title, generalProlificErrorCode, and steps;
        const response = await gSheetsAuthClient.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: ranges
        });
    
        // Parse response
        const [title, errorCode, steps] = response.data.valueRanges;
    
        // Extracting the experiment title and general prolific error code directly
        const expTitle = title.values[0][0];
        const prolificErrorCode = errorCode.values[0][0];
    
    
        const stepsTypeDoCode = {};
         // Process each row in the steps range to build the stepsTypeDoCode object
        steps.values.forEach((row) => {
            const stepNum = row[stepNumbCellIdx];
            const type = row[stepTypeCellIdx] || ""; // this is the step type identifier
            const toDo = row[stepTODOCellIdx] || ""; // identifies steps which require doing
            const completionCode = row[stepExitCellIdx] || ""; // prolific "completion"/exit code
    
            // Check if stepNum is a valid integer
            if (stepNum && Number.isInteger(Number(stepNum))) {
                stepsTypeDoCode[stepNum] = { type, toDo, completionCode };
            }
        });
        
        //console.log("\nIdentified experimental steps:")
        //console.log(stepsTypeDoCode)
    
        // Return the extracted data
        return {
            expTitle: expTitle,
            prolificErrorCode: prolificErrorCode,
            stepsParams: stepsTypeDoCode
        };
    
    } catch (error) {
        console.error('Could not get base experiment params:', error);
        throw error;
    }
}


/**
 * LOGIN or register participant based on prolificID in participantLog tab
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @param {string} prolificID - The participant's Prolific ID.
 * @param {string} userAgent - The User-Agent string from the request headers.
 * @param {Object} gSheetsAuthClient - the authenticated Google Sheets API client.
 *
 * @return {int} participantRowIndex - the user's row in the participantLog tab
 */
async function loginParticipant(mainSheetID, prolificID, userAgent, gSheetsAuthClient) {
    try {
        // Fetch participant's row index in participantLog
        const participantRowIndexResponse = await gSheetsAuthClient.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${participantLogTab}${PIDColumn}:${PIDColumn}`
        });
    
        let participantRowIndex = participantRowIndexResponse.data.values.findIndex(row => row[0] == prolificID);

        if (participantRowIndex === -1) {
            // If Prolific ID not found, append it to the first empty row in participantLog (REGISTER)
            const lastRowIndex = participantRowIndexResponse.data.values.length;
            // Append the new Prolific ID and User-Agent to the participantLog
            await gSheetsAuthClient.spreadsheets.values.append({
                spreadsheetId: mainSheetID,
                range: `${participantLogTab}${PIDColumn}${lastRowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[prolificID, userAgent]] // Append both prolificID and userAgent
                }
            });
            // Update participantRowIndex to the new row index
            participantRowIndex = lastRowIndex;

        } else {
            // Replace the User-Agent in the participantLog
            await gSheetsAuthClient.spreadsheets.values.update({
                spreadsheetId: mainSheetID,
                range: `${participantLogTab}${UserAgentColumn}${participantRowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[userAgent]] // Write userAgent
                }
            });
        }
        
        // Return the participant's row index
        return participantRowIndex;

    } catch (error) {
        console.error('Could not login participant:', error);
        throw error;
    }
}




/**
 * FETCH STEP STATUS
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @param {string} prolificID - The participant's Prolific ID.
 * @param {Object} baseExpParams – An object containing the experiment title, the general prolific error code, 
 *                 and dictionaries mapping step numbers to types, do?s, and prolificCodes.
 * @param {int} participantRowIndex - the user's row in the participantLog tab
 * @param {Object} gSheetsAuthClient - the authenticated Google Sheets API client.
 *
 * @return {Object} An object containing the experiment title, the general prolific error code, 
 *                  and dictionaries mapping step numbers to types, do?s, prolificCodes AND STATUS.
 */
async function getStepStatus(mainSheetID, prolificID, baseExpParams, participantRowIndex, gSheetsAuthClient) {
    try {
        // Define the ranges for batchGet: one for step numbers, another for statuses
        const ranges = [
            `${participantLogTab}${firstStepColumn}${stepNumRow}:${stepNumRow}`, // Range for step numbers (headers)
            `${participantLogTab}${firstStepColumn}${participantRowIndex + 1}:${participantRowIndex + 1}` // Range for step statuses
        ];

        // Fetch both step numbers and their statuses in a single batchGet call
        const response = await gSheetsAuthClient.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: ranges
        });

        // Extract responses for each range
        const [stepNumbersResponse, stepStatusesResponse] = response.data.valueRanges;
        const stepNumbers = stepNumbersResponse.values[0];
        const stepStatuses = stepStatusesResponse.values ? stepStatusesResponse.values[0] : [];
        
        // Augmenting baseExpParams.stepsParams with status
        stepNumbers.forEach((stepNum, index) => {
            // Check if stepNum exists in baseExpParams.stepsParams before assigning status
            if (baseExpParams.stepsParams.hasOwnProperty(stepNum)) {
                const status = stepStatuses[index] || ""; // Default to empty string if no status
                baseExpParams.stepsParams[stepNum].status = status;
            }
        });
        
        return baseExpParams;

    } catch (error) {
        console.error('Could not update baseExpParams:', error);
        throw error;
    }
}


/**
 * Fetches language-specific strings from the "languageStrings" sheet tab.
 *
 * @param {string} mainSheetID - The ID of the main sheet.
 * @param {string} language - The required language.
 * @param {Object} gSheetsAuthClient - The authenticated Google Sheets API client.
 * @return {Object} An object containing key-value pairs of strings in the specified language.
 */
async function getLanguageStrings(mainSheetID, language, gSheetsAuthClient) {
    try {
        // Fetch the entire 'languageStrings' sheet
        const response = await gSheetsAuthClient.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: 'languageStrings'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            throw new Error('No data found in languageStrings sheet.');
        }

        // Find the language column index
        const firstRow = rows[0];
        const languageColIndex = firstRow.indexOf(language);
        if (languageColIndex === -1) {
            throw new Error(`Language '${language}' not found in languageStrings sheet.`);
        }

        const languageStrings = {};
        // Start from row 2 to skip the header
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const key = row[0]; // The name of the string is in column A
            const value = row[languageColIndex]; // The value in the specified language
            languageStrings[key] = value;
        }

        return languageStrings;

    } catch (error) {
        console.error('Error fetching language strings:', error);
        throw error;
    }
}

/**
 * 01 FETCH
     * experiment TITLE
     * general PROLIFIC ERROR CODE
     * STEPs DICT (types, do?, prolificCode, [])
 *
 * 02 LOGIN/REGISTER participant
 *
 * 03 UPDATE each step in STEPs with status
 *
 * @param {string} mainSheetID - The ID of the main sheet that contains experiment parameters.
 * @param {string} prolificID - The participant's Prolific ID.
 * @param {string} language - The required language.
 * @return {Object} An object containing the experiment title, the general prolific error code, 
 *                  and dictionaries mapping step numbers to types, do?s, prolificCodes and status;
 *                  and an language STR internationalisation structured list of strings.
 */
async function doSetupAndLogin(mainSheetID, prolificID, userAgent, language) {

    try {
        const gSheetsAuthClient = await getAuthenticatedClient();
    
    
        // GET EXPERIMENT STRUCTURE FROM controlRoom
        let baseExpParams = await getBaseExpParams(mainSheetID, gSheetsAuthClient);
            // .title
            // .prolificErrorCode
            // .stepsParams
                // .stepNum
                // .type
                // .toDo
                // .completionCode
    
        // LOG IN OR REGISTER PARTICIPANT in participantLog
        const userAgentReadable = parseUserAgent(userAgent);
        const participantRowIndex = await loginParticipant(mainSheetID, prolificID, userAgentReadable, gSheetsAuthClient);


        // UPDATE baseExpParams.stepsParams FROM participantLog
        const expParams = await getStepStatus(mainSheetID, prolificID, baseExpParams, participantRowIndex, gSheetsAuthClient);
            // .title
            // .prolificErrorCode
            // .stepsParams
                // .stepNum
                // .type
                // .toDo
                // .completionCode
                // .status       
                
        const STR = await getLanguageStrings(mainSheetID, language, gSheetsAuthClient);

        
        return { expParams, STR };

    } catch (error) {
        console.error('Failure in fetching expParams:', error);
        throw error;
    }
}




//////////////////////////////////////////////////////////////////////////////

module.exports = { doSetupAndLogin };
