// 02_formsGSO.js

const { getAuthenticatedClient } = require('./00_googleSheetAuth');
const marked = require('marked');

const { parseUserAgent, fancylog } = require('../utils');

/**
 * Fetches data from tab named 'infoSheet' and converts it into Markdown format.
 * 
 * @returns {Promise<string>} - HTML content converted from Markdown.
 */
async function getMDtext(mainSheetID, tabName) {

    const infoSheetRange = 'B4:C17';

    const googleSheets = await getAuthenticatedClient();
    try {
        const response = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: `${tabName}!${infoSheetRange}`
        });
        const rows = response.data.values || [];
        let markdownText = '';
        rows.forEach(row => {
            if (row.length >= 2) {
                const title = row[0].trim();
                const content = row[1].trim();
                markdownText += `## ${title}\n\n${content}\n\n`;
            }
        });
        fancylog.log("Markdown text assembled:", markdownText);

        // Use try-catch to handle any potential errors from marked.parse
        try {
            htmlContent = marked.parse(markdownText);
            fancylog.log("Markdown converted to HTML.");
        } catch (parseError) {
            fancylog.error("Error converting markdown to HTML:", parseError);
            return; // Exit the function or handle the error as needed
        }
        
    } catch (error) {
        fancylog.error("Error fetching data from Google Sheets:", error);
        return; // Exit the function or handle the error as needed
    }

    return htmlContent; // Return htmlContent that's now defined in the function scope
}


/**
 * Fetches question-choices-answer sets from a specified Google Sheets tab and returns them in a structured format.
 * 
 * The function dynamically determines the columns for choices and admissible answers based on the headers in the specified sheet tab.
 * It processes the data to align questions with their respective choices and answers.
 * 
 * If a question is falsy, the entire set (question, choices, and answer) is discarded.
 * If the set of choices for a question is empty, the function prepares it for a free input text field.
 * If the answer is empty or falsy, a placeholder is set, which can be used to trigger specific behavior in the frontend.
 * 
 * The function uses efficient data fetching by utilizing batchGet to minimize the number of API calls.
 *
 * @param {string} mainSheetID - The ID of the Google Sheets document.
 * @param {string} formName - The name of the form to determine the appropriate sheet tab (e.g., 'consent', 'screening', 'miscDemo').
 * @returns {Promise<Object>} - An object containing arrays of questions, choices, and answers.
 */
 
async function fetchQuestionsChoicesAnswer(mainSheetID, formName) {
    try {
        const googleSheets = await getAuthenticatedClient();
        
        let sheetTab, headerRow, firstRow, lastRow;
                
        if (formName === "consent") {
            sheetTab = "consentQs!";
            headerRow = "3";
            firstRow = "4";
            lastRow = "18";
        } else if (formName === "screening") {
            sheetTab = "screeningQA!";
            headerRow = "4";
            firstRow = "5";
            lastRow = "18";
        } else if (formName === "miscDemo") {
            sheetTab = "miscDemoQA!";
            headerRow = "3";
            firstRow = "5";
            lastRow = "18";
        } else {
            throw new Error(`Unknown formName: ${formName}`);
        }

        const headerRange = `${sheetTab}${headerRow}:${headerRow}`;
        const dataRange = `${sheetTab}${firstRow}:${lastRow}`;

        // Fetch header and data rows
        const batchResponse = await googleSheets.spreadsheets.values.batchGet({
            spreadsheetId: mainSheetID,
            ranges: [headerRange, dataRange]
        });

        // Process headers to determine question, choices, and answer columns
        const headers = batchResponse.data.valueRanges[0].values[0];
        const questionColIndex = headers.findIndex(cell => cell.toLowerCase().includes("question"));
        const choicesStartIndex = headers.findIndex(cell => cell.toLowerCase().includes("choices"));
        const answerColIndex = headers.findIndex(cell => cell.toLowerCase().includes("answer"));

        if (questionColIndex === -1 || choicesStartIndex === -1) {
            throw new Error("Required columns 'QUESTION' or 'CHOICES' not found.");
        }

        // Process data rows
        const dataRows = batchResponse.data.valueRanges[1].values;
        let formattedData = [];

        dataRows.forEach(row => {
            let question = row[questionColIndex] ? row[questionColIndex].trim() : undefined;
            let choices = row.slice(choicesStartIndex, answerColIndex === -1 ? undefined : answerColIndex).filter(cell => cell).map(choice => choice.trim());
            let answer = answerColIndex !== -1 && row[answerColIndex] ? row[answerColIndex].trim() : undefined;

            if (question) {
                formattedData.push({
                    question: question,
                    choices: choices.length > 0 ? choices : null,
                    answer: answer
                });

                fancylog.log(`Question: ${question}`);
                fancylog.log(`Choices: ${choices}`);
                fancylog.log(`Answer: ${answer}`);
            }
        });

        return formattedData;

    } catch (error) {
        fancylog.error("Error in fetchQuestionsChoicesAnswer function:", error);
        throw error;
    }
}



module.exports = { getMDtext, fetchQuestionsChoicesAnswer };
