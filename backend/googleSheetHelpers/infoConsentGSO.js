// infoConsentGSO.js

const { getAuthenticatedClient } = require('./googleSheetAuth');
const marked = require('marked');


/**
 * Fetches data from tab named 'infoSheet' and converts it into Markdown format.
 * 
 * @returns {Promise<string>} - HTML content converted from Markdown.
 */
async function fetchInfoSheet(mainSheetID) {
    const googleSheets = await getAuthenticatedClient();
    try {
        const response = await googleSheets.spreadsheets.values.get({
            spreadsheetId: mainSheetID,
            range: 'infoSheet!A3:B30'
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
        //console.log("Markdown text assembled:", markdownText);

        // Use try-catch to handle any potential errors from marked.parse
        try {
            htmlContent = marked.parse(markdownText);
            console.log("Markdown converted to HTML.");
        } catch (parseError) {
            console.error("Error converting markdown to HTML:", parseError);
            return; // Exit the function or handle the error as needed
        }
        
    } catch (error) {
        console.error("Error fetching data from Google Sheets:", error);
        return; // Exit the function or handle the error as needed
    }

    return htmlContent; // Return htmlContent that's now defined in the function scope
}


/**
 * Fetches consent questions from tab named 'consentQs' and returns them as an array of strings.
 * 
 * @returns {Promise<string[]>} - Array of consent questions as strings.
 */
async function fetchConsentQuestions(mainSheetID) {
    const googleSheets = await getAuthenticatedClient();
    const response = await googleSheets.spreadsheets.values.get({
        spreadsheetId: mainSheetID,
        range: 'consentQs!A3:B30'
    });

    const rows = response.data.values || [];
    const consentQuestions = rows.map(row => row[0].trim());

    return consentQuestions;
}




module.exports = { fetchInfoSheet, fetchConsentQuestions };
