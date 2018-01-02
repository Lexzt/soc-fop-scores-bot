var token = process.env.TOKEN;

var Bot = require('node-telegram-bot-api');
var bot;

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

bot.onText(/\/create_house (.+)/, function (msg, match) {
  var house_name = match[1].split(' ')[0];
  var house_color = match[1].split(' ')[1];
  FirebaseManager.createHouse(house_name, msg.from, house_color);

  var message = "House " + match[1] + " was created with color " + house_color;
  bot.sendMessage(msg.chat.id, message);
});

//match /create [list name]
bot.onText(/\/create_og (.+)/, function (msg, match) {
  var house_color = match[1].split(' ')[0];
  var og_name = match[1].split(' ')[1];

  FirebaseManager.createOG(bot, msg.chat.id, house_color, og_name, 'add');
  var message = "OG " + og_name + " was for house " + house_color;
  bot.sendMessage(msg.chat.id, message);
});

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
    bot.answerCallbackQuery(msg.id, 'Adding to house ' + obj.color + ", OG: " + obj.og + " with score: " + obj.score);

    FirebaseManager.updateScores(obj.color, obj.og, obj.score);
  }
});

bot.onText(/\/list_scores/, function (msg, match) {
  FirebaseManager.listScores(bot, msg.chat.id);
});

/**
 * matches /in
 */
bot.onText(/\/in/, function (msg, match) {
  FirebaseManager.managerParticipants(bot, msg.chat.id, msg.from.first_name, msg.from.last_name, 'add');
});

/**
 * matches /out
 */
bot.onText(/\/out/, function (msg, match) {
  FirebaseManager.managerParticipants(bot, msg.chat.id, msg.from.first_name, msg.from.last_name, 'remove');
});

/**
 * matches /add_guest
 */
bot.onText(/\/add_guest (.+)/, function (msg, match) {
  FirebaseManager.managerGuests(bot, msg.chat.id, match[1], 'add');
});

/**
  * matches /add_guest
 */
bot.onText(/\/remove_guest (.+)/, function (msg, match) {
  FirebaseManager.managerGuests(bot, msg.chat.id, match[1], 'remove');
});

/**
 * matches /showList
 */
bot.onText(/\/show/, function (msg, match) {
  var list = FirebaseManager.showList(bot, msg.chat.id);
});

/**
 * matches /help
 */
bot.onText(/\/help/, function (msg, match) {
  var fromId = msg.chat.id; // get the id, of who is sending the message
  var message = "To create a new list use: /create [your_list_name] \n";
  message += "To add your name on the list use: /in \n";
  message += "To remove your name from the list use: /out \n";
  message += "To add guest's name on the list use: /add_guest [guest_name] \n";
  message += "To remove guest's name from the list use: /remove_guest [guest_name] \n";
  message += "To show the list use: /show \n";
  bot.sendMessage(fromId, message);
});

module.exports = bot;
