
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

