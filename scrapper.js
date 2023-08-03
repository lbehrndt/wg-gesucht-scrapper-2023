require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio')
const franc = require('franc')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ rooms: []})
  .write()

const headers = { 
  'content-type': 'application/json',
  'User-Agent': 'Chrome/64.0.3282.186 Safari/537.36',
}

function scrapper() {
  this.crawl = function() {
    console.log('\nGetting New Rooms')
    axios({
        method: 'get',
        url: process.env.FILTER_URL,
        headers: headers
      })
      .then(function (response) {

        let $ = cheerio.load(response.data)

        let roomCounter = 0
      
        $(".panel.panel-default").each(function(i, elem) {
            id = $(this).attr().id.replace("liste-details-ad-hidden-", "")

            if(id) {
                let room = db.get('rooms')
                    .find({ id: id })
                    .value()

                if(room) {
                  return
                }

                description = $(this).find('h4.headline.headline-list-view.truncate_title a.detailansicht').text().trim()
    
                data = {
                    'id': id,
                    'url': process.env.BASE_URL + $(this).find('.panel.panel-default a.detailansicht').attr('href'),
                    'description': description,
                    'lang': franc(description, {only: ['eng', 'deu']}),
                    'sent': 0
                }

                if(data.url.endsWith('.html')) {
                    db.get('rooms')
                        .push(data)
                        .write()

                    roomCounter++

                    console.log('Room with id: ' + data.id + ' added')
                }
            }
        })
        console.log('Found '+roomCounter+' New Rooms')
      })
      .catch(function (error) {
        console.log(error);
    });
   }
}
module.exports = scrapper;
