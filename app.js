const scrapper = require('./scrapper.js');
const autoreserve = require('./autoreserve.js');


const scrapperInstance = new scrapper();
const autoreserveInstance = new autoreserve();

const messageTemplates = {}
const headers = {}


console.log('Starting Wg Gesuch Scrapper')
console.log('***************************')
console.log('Good luck!')

// Get new listings every 2 1/2 minutes
setInterval(()=> scrapperInstance.crawl(), 5*60*500);

// Log in and get message templates
(async () => {
    try {
        const loginCookie = await autoreserveInstance.login()

        headers = { 
            'content-type': 'application/json',
            'User-Agent': 'Chrome/64.0.3282.186 Safari/537.36',
            'cookie': loginCookie
        }

        const messageEng = await autoreserveInstance.getMessageTemplate(process.env.MESSAGE_ENG, headers)
        const messageGer = await autoreserveInstance.getMessageTemplate(process.env.MESSAGE_GER, headers)

        messageTemplates = {
            'eng' : messageEng,
            'ger' : messageGer
        }
        
    } catch (e) {
        console.log(e)
    }
})();

// Send message to listenings
setInterval(()=> autoreserveInstance.processAndReserve(headers, messageTemplates), 5*60*500);
