const UAParser = require('ua-parser-js');

/**
 * Parses a given user agent string and returns a more readable and informative string.
 *
 * @param {string} userAgentString - The user agent string to be parsed.
 * @return {string} A string containing detailed information about the browser, operating system, 
 *                  and device derived from the user agent string. The information is structured 
 *                  as 'Browser: [Name] [Version]', 'OS: [Name] [Version]', and 'Device: [Model], 
 *                  [Type], [Vendor]' (if available, otherwise 'Device: N/A').
 */
function parseUserAgent(userAgentString) {
    const parser = new UAParser();
    parser.setUA(userAgentString);

    const result = parser.getResult();

    const browserInfo = `Browser: ${result.browser.name} ${result.browser.version}`;
    const osInfo = `OS: ${result.os.name} ${result.os.version}`;
    const deviceInfo = result.device.model ? `Device: ${result.device.model}, ${result.device.type}, ${result.device.vendor}` : 'Device: N/A';

    return `${browserInfo}\n${osInfo}\n${deviceInfo}`;
}

module.exports = { parseUserAgent };
