//firebase
var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hopebot-fc36d-default-rtdb.firebaseio.com"
});

// firestore handles intents
const db = admin.firestore();

const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
//server modules
const app = express();
app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
let VERIFY_TOKEN = 'hopebot_verify';
let mode = req.query['hub.mode'];
let token = req.query['hub.verify_token'];
let challenge = req.query['hub.challenge'];
if (mode && token && mode === 'subscribe' && token ===
VERIFY_TOKEN) {
res.status(200).send(challenge);
} else {
res.sendStatus(403);
}
});

const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
async function detectIntent(text, sessionId) {
const sessionClient = new dialogflow.SessionsClient({ keyFilename:
'serviceAccountKey.json' });
const sessionPath =
sessionClient.projectAgentSessionPath('<PROJECT_ID>', sessionId);
const request = {
session: sessionPath,
queryInput: {
text: {
text: text,
languageCode: 'en',
},
},
};
const responses = await sessionClient.detectIntent(request);
return responses[0].queryResult.fulfillmentText;
}
const request = require('request');
function sendMessage(recipientId, message) {
request({
uri: 'https://graph.facebook.com/v12.0/me/messages',
qs: { access_token: '<PAGE_ACCESS_TOKEN>' },
method: 'POST',
json: {
recipient: { id: recipientId },
message: { text: message },
},
});
}

app.post('/webhook', async (req, res) => {
let body = req.body;
if (body.object === 'page') {
body.entry.forEach(async function(entry) {
let event = entry.messaging[0];
let sender = event.sender.id;
if (event.message && event.message.text) {
const text = event.message.text;
// Send text to Dialogflow
const dialogflowResponse = await detectIntent(text,
sender);
// Send back to Messenger
sendMessage(sender, dialogflowResponse);
}
});
res.status(200).send('EVENT_RECEIVED');
} else {
res.sendStatus(404);
}
});


app.post('/webhook', (req, res) => {
    const agent = new WebhookClient({ request: req, response: res });
// intent handlers
    function welcome(agent) {
        agent.add('Welcome to HopeBot! How can I help you today?');
    }

    function fallback(agent) {
        agent.add('Sorry, I didn’t get that. Can you try again?');
    }

    function storeUserData(agent) {
    const name = agent.parameters.name;
    return db.collection('users').add({ name }).then(() => {
        agent.add(`Thanks ${name}, your data has been saved.`);
    });
}

//calls correct intent from the dialogflow,tells dialogflow the function to call
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    agent.handleRequest(intentMap);
});
//To start a server at port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook server is running on port ${PORT}`));

