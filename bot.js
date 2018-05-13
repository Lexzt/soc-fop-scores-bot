// Token is taken from the file, .env. 
var token = process.env.TOKEN;

// Ensures the loading of the telegram api.
var Bot = require('node-telegram-bot-api');
var bot;

// Ensures the loading of the firebase api
var FirebaseManager = require('./FirebaseManager.js');


if (process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook('https://soc-fop-score-bot.herokuapp.com/' + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
}

/**
 * matches /start
 */
bot.onText(/\/start/, function (msg, match) {
  var fromId = msg.chat.id; // get the id, of who is sending the message
  var message = "Welcome to your SOC FOP Bot\n";
  message += "Create your house by using /create_house [house_name] [house_color] command.\n"
  message += "Create your og by using /create_og [house_name] [og_name] command.\n"
  message += "Add score by using /add_score command.\n"
  message += "View score by using /list_scores command.\n"
  bot.sendMessage(fromId, message);
});

/**
 * matches /create_house (Params)
 * Params are then split into 2.
 * 1. Param 0 - House Name
 * 2. Param 1 - House Color
 * 
 * Then creates a query to create a house in the database. 
 * 
 * To-do
 * Error checking, 
 * 0. More then 2 variable.
 * 1. house name is not valid string format. 
 * 2. house color is not valid string format.
 * 
 * 
 */
bot.onText(/\/create_house (.+)/, function (msg, match) {
  var house_name = match[1].split(' ')[0];
  var house_color = match[1].split(' ')[1];
  FirebaseManager.createHouse(house_name, msg.from, house_color);

  var message = "House " + match[1] + " was created with color " + house_color;
  bot.sendMessage(msg.chat.id, message);
});

/**
 * Creates an OG in a House, based off the color.
 * 
 * matches /create_og (Params)
 * 
 * Params are then split into 2.
 * 1. Param 0 - House Name
 * 2. Param 1 - Og Name
 * 
 * Finds the specific house color, then creates the OG in the database
 * 
 * To-do
 * Error handling, 
 * 0. House color does not exist, send back deny message.
 * 1. Og name exist, send back deny message.
 * 2. Og name is not valid string. 
 * 3. house color is not valid string format. 
 */
bot.onText(/\/create_og (.+)/, function (msg, match) {
  var house_color = match[1].split(' ')[0];
  var og_name = match[1].split(' ')[1];

  FirebaseManager.createOG(bot, msg.chat.id, house_color, og_name, 'add');
  var message = "OG " + og_name + " was for house " + house_color;
  bot.sendMessage(msg.chat.id, message);
});

/*
 * Add scores based off the houses. 
 * This function is more complex due to inline buttons. 
 * 
 * matches /add_score
 * 
 * No Params
 * 
 * It will send back a list of buttons to choose which house you want to add score to.
 * Note, When you stringify the callback_data, type has to be less than 128 bytes. 
 */
bot.onText(/\/add_score/, function (msg, match) {
  bot.sendMessage(msg.chat.id, "Add Score, Choose House", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Red', callback_data: JSON.stringify({ type: "addScore, House", color: 'red', id: msg.chat.id }) },
          { text: 'Blue', callback_data: JSON.stringify({ type: "addScore, House", color: 'blue', id: msg.chat.id }) },
          { text: 'Green', callback_data: JSON.stringify({ type: "addScore, House", color: 'green', id: msg.chat.id }) },
          { text: 'Yellow', callback_data: JSON.stringify({ type: "addScore, House", color: 'yellow', id: msg.chat.id }) },
          { text: 'Gray', callback_data: JSON.stringify({ type: "addScore, House", color: 'gray', id: msg.chat.id }) }
        ]
      ],
    },
  }).then(function () {
    // console.log('message sent');
  }).catch(console.error);
});

/*
 * For callbacks
 * 
 * A callback will happen when an inline button is pressed. E.g. /add_score message.
 * It will detech the add_score, and request for a number to be added, 
 * 
 * Say after a cheer, you have to add 10/20/30/40/50 based off the cheer. 
 * This will make it easier to add score in. 
 * 
 * However, a slight problem is if you want to add custom amount of scores.
 * 
 * To-do
 * 0. Custom amount of scores
 * 1. A cancel button
 * 2. 
 */ 
bot.on("callback_query", function (msg) {
  var obj = JSON.parse(msg.data);
  if (obj.type === "addScore, House") {
    // Start the looking for groups
    FirebaseManager.addScoreGroups(bot, obj.id, obj.color);
  } else if (obj.type === "as,og") {
    bot.sendMessage(obj.id, "Add Score, Choose Points", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '+10', callback_data: JSON.stringify({ type: "as,p", score: 10, color: obj.color, og: obj.og }) },
            { text: '+20', callback_data: JSON.stringify({ type: "as,p", score: 20, color: obj.color, og: obj.og }) },
            { text: '+30', callback_data: JSON.stringify({ type: "as,p", score: 30, color: obj.color, og: obj.og }) },
            { text: '+40', callback_data: JSON.stringify({ type: "as,p", score: 40, color: obj.color, og: obj.og }) },
            { text: '+50', callback_data: JSON.stringify({ type: "as,p", score: 50, color: obj.color, og: obj.og }) }
          ]
        ],
      },
    }).then(function () {
      console.log('(as,p) ' + obj.color + ' - ' + obj.og);
    }).catch(console.error);
  } else if (obj.type === "as,p") {
    bot.answerCallbackQuery(msg.id, 'Adding to house ' + obj.color + 
    ", OG: " + obj.og + 
    " with score: " + obj.score);
    FirebaseManager.updateScores(obj.color, obj.og, obj.score);
  }
});

bot.onText(/\/list_scores/, function (msg, match) {
  FirebaseManager.listScores(bot, msg.chat.id);
});

/*
 * An example on how to use auth
 */
bot.onText(/\/testauth/, function (msg, match) {
  FirebaseManager.checkIfApproved(msg.from.id).then((success)=>{
    if(success){
      bot.sendMessage(msg.chat.id, "Success!");
    } else {
      var message = "You are not allowed to do this action!";
      bot.sendMessage(msg.chat.id, message);
    }
  })
});


bot.onText(/\/addauth/, function (msg, match) {
  var id = match[1].split(' ')[0];
  var level = match[1].split(' ')[1];
  FirebaseManager.addauth(id, level);
});
module.exports = bot;
