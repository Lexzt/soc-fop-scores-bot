const Telegraf = require('telegraf');
const express = require('express');
const Model = require('./model');
const Weather = require('./weather');

// setup webserver for web interface

const app = express();
app.get('/', (req, res) => (res.send('Visit freshmen.nuscomputing.com')));
app.listen(process.env.PORT);

// setup telegram bot

// const bot = new Telegraf(process.env.BOT_TOKEN);
const bot = new Telegraf("526994033:AAFPUKXTEgx6vvXFnkyAh1aOWatdAWw8YQE");

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
});

// start message

bot.start(ctx => {
  let message = '';
  message += 'Hello! I can help you keep track of scores. You can control me by sending me these commands.\n';
  message += '\n';
  message += '/addscore - add score\n';
  message += '/contacts - show useful contacts\n';
  message += '/edithouse - edit a house\n';
  message += '/help - show detailed help\n';
  message += '/promote - promote a user\n';
  message += '/listscore - list all score\n';
  message += '/newog - create an OG';
  message += '/weather - get weather info\n';
  return ctx.reply(message);
});

// help message

bot.help(ctx => {
  let message = '';
  
  message += 'Add [score] to [houseColor].\n';
  message += '/addscore [houseColor] [score]\n';
  message += '\n';
  
  message += 'Show useful contact information\n';
  message += '/contacts\n';
  message += '\n';
  
  message += 'Edit name of [houseColor] to [houseName], then change the head of [houseColor] to invoker.\n';
  message += '/edithouse [houseColor] [houseName]\n';
  message += '\n';
  
  message += 'Show this detailed helpsheet.\n';
  message += '/help\n';
  message += '\n';
  
  message += 'Promote [targetId] to [level].\n';
  message += '/promote [targetId] [level]\n';
  message += '\n';
  
  message += 'List overall score for all houses.\n';
  message += '/listscore\n';
  message += '\n';
  
  message += 'Create new OG named [ogName] under [houseColor], then set the OG head to invoker.\n';
  message += '/newog [houseColor] [ogName]';
  
  return ctx.reply(message);
});

// other commands

bot.command('addscore', async ctx => {
  const args = ctx.message.text.split(' ');
  const houseColor = args[1];
  const score = Number(args[2]);
  const userId = ctx.from.id;
  
  try {
    const newScore = await Model.addScore(houseColor, score, userId);
    const message = `${houseColor} house has ${newScore} points after adding ${score} points`;
    return ctx.reply(message);
  } catch (err) {
    return ctx.reply(err);
  }
});

bot.command('contacts', async ctx => {
  const contactsArray = await Model.getContacts();
  const contacts = contactsArray.map(contact => `${contact.name}: ${contact.number}`);
  const message = contacts.reduce((accumulator, contact) => accumulator + '\n' + contact);
  return ctx.reply(message);
});

bot.command('edithouse', async ctx => {
  const args = ctx.message.text.split(' ');
  const houseColor = args[1];
  const houseName = args[2];
  const userId = ctx.from.id;
  
  try {
    await Model.editHouse(houseColor, houseName, userId);
    const message = `The ${houseColor} house was edited`
    return ctx.reply(message);
  } catch (err) {
    return ctx.reply(err);
  }
});

bot.command('listscore', async ctx => {
  const overallScoreArray = await Model.getOverallScore();
  const overallScore = overallScoreArray.map(entry => `${entry.color}: ${entry.score}`);
  const message = overallScore.reduce((accumulator, score) => accumulator + '\n' + score);
  return ctx.reply(message);
});

bot.command('newog', async ctx => {
  const args = ctx.message.text.split(' ');
  const houseColor = args[1];
  const ogName = args[2];
  const userId = ctx.from.id;
  
  try {
    await Model.newOG(houseColor, ogName, userId);
    const message = `${ogName} was created under ${houseColor} house`;
    return ctx.reply(message);
  } catch (err) {
    return ctx.reply(err);
  }
});

bot.command('promote', async ctx => {
  const args = ctx.message.text.split(' ');
  const targetId = Number(args[1]);
  const level = Number(args[2]);
  const userId = ctx.from.id;
  
  try {
    await Model.promote(targetId, level, userId);
    const message = `${targetId} promoted to level ${level}`;
    return ctx.reply(message);
  } catch (err) {
    return ctx.reply(err);
  }
});

bot.command('weather', async ctx => {
  try {
    const weatherArray = await Weather.getWeather();
    const weather = weatherArray.map(entry => `From ${entry.time}, it's gonna be ${entry.forecast}.`);
    const message = weather.reduce((accumulator, entry) => accumulator + '\n\n' + entry);
    return ctx.reply(message);
  } catch (err) {
    return ctx.reply(err);
  }
});


bot.startPolling()