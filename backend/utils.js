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




const { Logging } = require('@google-cloud/logging');
const logging = process.env.NODE_ENV === 'production' ? new Logging() : null;
const log = logging ? logging.log('my-log') : null;

const fancylog = {
    log: (...args) => {
        const entry = createLogEntry(args);
        if (process.env.NODE_ENV === 'production') {
            return // skipping logging on info-level logs in production env
            log.info(entry);
        } else {
            console.log('[INFO]', entry.data);
        }
    },
    error: (...args) => {
        const entry = createLogEntry(args);
        if (process.env.NODE_ENV === 'production') {
            log.error(entry);
        } else {
            console.error('[ERROR]', entry.data);
        }
    }
};

function createLogEntry(args) {
    const metadata = { resource: { type: 'global' } };
    const logData = args.map(arg => {
      if (arg instanceof Error) {
        return `Error: ${arg.message}, Stack: ${arg.stack}`;
      } else {
        return JSON.stringify(arg);
      }
    });
  
    const simpleLogData = logData.join(', ');
    return log ? log.entry(metadata, simpleLogData) : { data: simpleLogData };
  }
  

// function createLogEntry(args) {
//     const metadata = { resource: { type: 'global' } };
//     const logData = args.map(arg => {
//         if (arg instanceof Error) {
//             return { message: arg.message, stack: arg.stack };
//         } else {
//             return arg;
//         }
//     });

//     return log ? log.entry(metadata, logData) : { data: logData };
// }


module.exports = { parseUserAgent, fancylog };