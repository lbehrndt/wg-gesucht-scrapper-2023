require('dotenv').config();
const axios = require('axios');
const low = require('lowdb')
const cheerio = require('cheerio')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

function autoreserve() {
    this.login = async function login(id) {
        let loginInfo = {
          "login_email_username":process.env.WG_USER,
          "login_password":process.env.WG_PASSWORD,
          "login_form_auto_login":"1",
          "display_language":"en"
        }
      return axios({
          method: 'post',
          url: process.env.LOGIN_URL,
          data: loginInfo,
      }).then(function (response) {
        console.log("\nLogging in...")

        if(response.status == 200) {
            return response.headers['set-cookie'].toString()
        }
      })
      .catch(function (error) {
          console.log(error);
      });
    }
    this.getMessageTemplate = async function (messageId, headers) {
        headers 
        return axios({
            method: 'get',
            url: process.env.MESSAGE_URL + messageId,
            headers: headers
          })
          .then(function (response) {
            console.log("Getting Message Template...")
            let $ = cheerio.load(response.data)

            return $("#content").text();
        })
        .catch(function (error) {
            console.log(error);
        });
    }
    this.getMessageData = async function (roomUrl, headers) {

        return axios({
            method: 'get',
            url: roomUrl.replace('/en/', '/en/nachricht-senden/'),
            headers: headers
        })
        .then(function (response){
            console.log("Getting Message Data...")
            const $ = cheerio.load(response.data)
            let csrfToken =  $(".csrf_token").val()
            let userId = $("[name='user_id']").val()
            // let userId =  $('.logout_button').data('user_id')

            return {
                'userId': userId,
                'csrfToken': csrfToken
            }
        })
    }
    this.sendMessage = async function (room, headers, messageData, messageTemplates) {
        
        let message = {
            "user_id": messageData.userId,
            "csrf_token": messageData.csrfToken,
            "messages": [
                {
                    "content": room.lang === 'eng' ? messageTemplates.eng : messageTemplates.ger,
                    "message_type": "text"
                }
            ],
            "ad_type": "0",
            "ad_id": room.id
        }
        console.log("Sending Message...")
        return axios({
            method: 'post',
            url: process.env.POST_MESSAGE_URL,
            headers: headers,
            data: message
        }).then(function (resp) {
            console.log("\nSUCCESS!")
            return true
        })
        .catch(function (error) {
            console.log("Error sending Message...")
            return false
        });
    }
    this.processAndReserve = async function(headers, messageTemplates) {
        let rooms = db.get('rooms')
        .filter({ sent: 0 })
        .value()

        console.log("Processing " + rooms.length + " Rooms")

        for(let i = 0; i < rooms.length; i++) {

            console.log("\nProcessing room with id: " + rooms[i].id)

            let currentRoom = db.get('rooms').find({ id: rooms[i].id}).value()

            console.log(currentRoom)
            if(currentRoom.sent == 0) {
                let messageData = await this.getMessageData(rooms[i].url, headers)
                let messageStatus = await this.sendMessage(rooms[i], headers, messageData, messageTemplates)
                
                if(messageStatus) {
                    db.get('rooms')
                    .find({ id: rooms[i].id})
                    .assign({ sent: 1})
                    .write()
                }
            }
        }
    }
}
module.exports = autoreserve;
