console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const path = require('path');
const express = require('express');
const {google} = require('googleapis');

const { getBaseExpParams, getStepDetails } = require('./googleSheetHelpers/googleSheetOperations');
//const keyFile = require('../custompsych-88cecf1d90b5.json');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Endpoint for fetching base experiment parameters
app.post('/api/getBaseExpParams', async (req, res) => {
    try {
        const { mainSheetID } = req.body; // Extract the mainSheetID from the request body
        const params = await getBaseExpParams(mainSheetID);
        res.json(params);
    } catch (error) {
        res.status(500).json({ message: 'Could not fetch base experiment parameters', error });
    }
});

// Endpoint for fetching step details
app.post('/api/getStepDetails', async (req, res) => {
    try {
        const { mainSheetID, prolificID, stepNumber } = req.body; // Correctly extracting all parameters
        const details = await getStepDetails(mainSheetID, prolificID, stepNumber);
        res.json(details);
    } catch (error) {
        res.status(500).json({ message: 'Could not fetch step details', error });
    }
});


// Start the Server
app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is running on port ${process.env.PORT || 3001}`);
});
