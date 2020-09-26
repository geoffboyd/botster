const tmi = require('tmi.js');
const discord = require('discord.js');
const fs =  require('fs');
const SQLite = require("better-sqlite3");
const db = new SQLite('../userinputs.sqlite');
const { username, password, channels, prefix } = require('../config/twitch.json');

// Markov generator
var MarkovChain = require('markovchain'), 
  wordSalad = new MarkovChain(fs.readFileSync('./twitchHistory.txt', 'utf8'))

// Define configuration options
const opts = {
  identity: {
    username: username,
    password: password
  },
  channels
};
// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();
// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  var randomFuckery = Math.ceil(Math.random()*20);
  if (self) { return; } // Ignore messages from the bot
  if (!msg.startsWith(prefix) && randomFuckery !== 10 && !msg.toLowerCase().includes('botster')) {return;} // Ignore messages without the right prefix
  // Remove whitespace from chat message
  var words = msg.trim().split(/ +/);
  if (words[0].startsWith(prefix)) {words[0] = words[0].slice(1, words[0].length);}
  const commandName = words[0].toLowerCase();
  var args = words;
  args.shift();
  var from = context['display-name'];
  if (from !== self) {
    fs.appendFile('twitchHistory.txt', `\n${msg}`, function (err) {
      if (err) throw err;
    });
  }
  // Sometimes random fun happens
  if (randomFuckery == 10 || msg.toLowerCase().includes('botster')) {
    if (words[1]) {
      var startWord = words[Math.floor(Math.random()*words.length)];
      var phraseLength = Math.floor(Math.random()*((words.length + 10)*2));
    } else {
      var startWord = target;
      var phraseLength = Math.ceil(Math.random()*10);
    }
    var phrase = wordSalad.start(startWord).end(phraseLength).process();
    var firstLetter = phrase.slice(0, 1);
    firstLetter = firstLetter.toUpperCase();
    var restOfPhrase = phrase.slice(1, phrase.length);
    phrase = firstLetter + restOfPhrase;
    while (phrase.endsWith('?') || phrase.endsWith('.') || phrase.endsWith('!') || phrase.endsWith('"') || phrase.endsWith(',')) {
      phrase.slice(0, -1)
    }
    client.say(target, phrase+'.');
  } 

  // Now do some stuff!
  switch (commandName) {
    case 'discord':
      getLink(target);
      break;

    case 'updatelink':
      if (from !== "nunclejrod" && from !== "the_boydster"){
        client.say(target, "You can't do that.");
      } else if (!args[0] || args[1] || (args[0] && !args[0].startsWith('http'))) {
        client.say(target, `Command usage: ${prefix}updatelink https://new.invite/link`); 
      } else {
        updateLink(target, args[0]);
      }
      break;

    case 'commands':
      client.say(target, `${prefix}discord, ${prefix}dice, ${prefix}8b, ${prefix}8badd, ${prefix}insult, ${prefix}insultadd, ${prefix}fortune, ${prefix}fcadd, ${prefix}slap, ${prefix}colorchange`);
      break;

    case 'colorchange':
      client.say(target, textColor(args));
      client.say(target, "OK, how's this?");
      break;

    case 'dice':
      if (Math.abs(args[0]) > 1000) {
        client.say(target, 'Max number of sides is 1000');
      } else {
        const num = rollDice(args);
        client.say(target, `You rolled a ${num}`);
      };
      break;

    case '8b':
      randSelect(target, '8b', 'eightball', 'Magic 8 Ball predictions');
      break;

    case '8badd':
      randAdd(target, msg, 'eightball', from, 'Magic 8 Ball prediction');
      break;

    case 'slap':
      client.say(target, theSlap(args));
      break;

    case 'fortune':
      randSelect(target, 'fortune', 'fortune', 'Fortune Cookie fortunes');
      break;

    case 'fcadd':
      randAdd(target, msg, 'fortune', from, 'Fortune Cookie fortune');
      break;

    case 'insult':
      randSelect(target, 'insult', 'insult', 'insults', args, from);
      break;

    case 'insultadd':
      randAdd(target, msg, 'insult', from, 'insult');
      break;

  }
};

// Command-related functions
function rollDice (args) {
  var sides = 6;
  if (args[0] && Math.abs(args[0]) < 1001) {sides = Math.abs(args[0]);}
  return Math.ceil(Math.random() * sides);
}
function theSlap(args) {
  const slaps = [`You slap ${args[0]} around a bit with a large trout`, `You slap ${args[0]} with a large smelly trout`, `You break out the slapping rod and look sternly at ${args[0]}`, `You slap ${args[0]}'s bottom and grin cheekily`, `You slap ${args[0]} a few times`, `You slap ${args[0]} and start getting carried away`, `You would slap ${args[0]}, but you are not being violent today`, `You give ${args[0]} a hearty slap`, `You find the closest large object and give ${args[0]} a slap with it`, `You like slapping people and randomly pick ${args[0]} to slap`, `You dust off a kitchen towel and slap it at ${args[0]}`];
  if (!args[0]) { 
    return 'You need to tell me who you are slapping';
  } else if (args[1]) {
    return "Slow down, pal. Let's slap one person at a time, alright?";
  } else {
      return slaps[Math.ceil(Math.random()*slaps.length)];
  }
}

function randSelect (channel, command, type, response, args, from) {
  // Check if the table "userinputs" exists and has content from this channel or Global.
  const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = '${channel}' OR channel = 'Global') AND type = '${type}';`).get();
  if (!table['count(*)']) {
    return client.say(channel, `I don't have any ${response} yet`);
  }
  var date = Math.floor(new Date() / 1000);
  const rawRand = db.prepare(`SELECT * FROM userinputs WHERE (channel = '${channel}' OR channel = 'Global') AND type='${type}' ORDER BY RANDOM() LIMIT 1;`).get();
  const rand = rawRand['content'];
  const randID = rawRand['row'];
  if (command === 'insult') {
    if (args[1]) {
      return client.say(channel, 'Slow down there, pal. We only insult one person at a time around here.');
    } else if (args[0]) {
      var target = args[0];
    } else {
      var target = from;
    }
    if (rand.includes('{}')) {
        var insult = rand.replace('{}', target);
    } else {
      var insult = target + ' ' + rand;
    }
    client.say(channel, insult);
  } else {
    client.say(channel, rand);
    db.prepare('UPDATE userinputs SET lastUsed = ? WHERE row = ?').run(date,randID);
  }
}

function randAdd(channel, text, type, from, response) {
    // Check if the table "userinputs" exists.
    const table = db.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'userinputs';").get();
    if (!table['count(*)']) {
      // If the table isn't there, create it and setup the database correctly.
      db.prepare("CREATE TABLE userinputs (row INTEGER NOT NULL PRIMARY KEY, user TEXT, channel TEXT, type TEXT, content TEXT, lastUsed DATETIME);").run();
      // Ensure that the "row" row is always unique and indexed.
      db.prepare("CREATE UNIQUE INDEX idx_userinputs_row ON userinputs (row);").run();
      db.pragma("synchronous = 1");
      db.pragma("journal_mode = wal");
    }
    var addInputs = db.prepare("INSERT INTO userinputs (user, channel, type, content, lastUsed) VALUES (@user, @channel, @type, @content, @lastUsed);");
    var newRand = text.split(' ');
    var date = Math.floor(new Date() / 1000);
    newRand.shift();
    newRand = newRand.join(' ');
    const randObject = { user: `${from}`, channel: `${channel}`, type: `${type}`, content: `${newRand}`, lastUsed: `${date}` };
    if (newRand.length > 0) {
      addInputs.run(randObject);
      client.say(channel, `A new ${response} has been added!`);
    } else {
      client.say(channel, `You need to tell me the ${response} to add!`);
    }
}

function textColor(args) {
  const validColors = ['Blue', 'Coral', 'DodgerBlue', 'SpringGreen', 'YellowGreen', 'Green', 'OrangeRed', 'Red', 'GoldenRod', 'HotPink', 'CadetBlue', 'SeaGreen', 'Chocolate', 'BlueViolet', 'Firebrick'];
  if (!args[0] || !validColors.includes(args[0])) {
    return 'You must pick one of the following colors: Blue, Coral, DodgerBlue, SpringGreen, YellowGreen, Green, OrangeRed, Red, GoldenRod, HotPink, CadetBlue, SeaGreen, Chocolate, BlueViolet, or Firebrick.';
  } else {
    return `/color ${args[0]}`;
  }
}

function getLink(target){
  fs.readFile('../config/discordlink.txt', (err, data) => {
    if (err) throw err;
    return client.say(target, data.toString());
  });
}

function updateLink(target, newLink){
  fs.writeFile('../config/discordlink.txt', newLink, (err) => {
    if (err) throw err;
    return client.say(target, 'Updated!');
  });
}

// Called every time the bot connects to Twitch chat 
function onConnectedHandler (addr, port) {
console.log(`* Connected to ${addr}:${port}`);
}
