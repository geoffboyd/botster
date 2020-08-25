// IRC botster
const irc = require('irc');
const { channels, server, botName, prefix } = require('../config/irc.json');
const bot = new irc.Client(server, botName, {channels: channels});
const SQLite = require("better-sqlite3");
const db = new SQLite('../userinputs.sqlite');
var args = [];

// Markov generator
var MarkovChain = require('markovchain'), 
  fs = require('fs'), 
  wordSalad = new MarkovChain(fs.readFileSync('./ircHistory.txt', 'utf8'))

// Listen for joins
bot.addListener("join", function(channel, who) {
  // Welcome them in!
  bot.say(channel, `Hi, ${who}!`);
});

// Listen for messages now
bot.addListener("message", function(from, to, text, message) {
  if (from !== 'botster' || from !== 'Susie') {
    fs.appendFile('ircHistory.txt', `\n${text}`, function (err) {
      if (err) throw err;
    });
  }
  args = text.slice(prefix.length).trim().split(/ +/);
  const channel = message.args[0];
  var randomFuckery = Math.ceil(Math.random()*20);
  if ((text.toLowerCase().includes('botster') && from !== 'botster' && from !== 'Susie') || (randomFuckery === 10))
    {
      if (args[0]) {
        var startWord = args[Math.floor(Math.random(args.length))];
        var phraseLength = (Math.ceil(Math.random()*((args.length + 10)*2)));
      } else {
        var startWord = from;
        var phraseLength = Math.ceil(Math.random()*10);
      }
    bot.say(channel, wordSalad.start(startWord).end(phraseLength).process());
    }
  if (text.startsWith(prefix)) {
    const commandName = args.shift().toLowerCase();

    // Now do some stuff!
    switch (commandName) {
      case 'commands':
        bot.say(channel, `${prefix}dice, ${prefix}8b, ${prefix}8badd, ${prefix}insult, ${prefix}insultadd, ${prefix}fortune, ${prefix}fcadd, ${prefix}slap`);
        break;

      case 'dice':
        if (Math.abs(args[0]) > 1000) {
          bot.say(channel, 'Max number of sides is 1000');
        } else {
          const num = rollDice(args);
          bot.say(channel, `You rolled a ${num}`);
        };
        break;

      case '8b':
        randSelect(channel, '8b', 'eightball', 'Magic 8 Ball predictions');
        break;

      case '8badd':
        randAdd(channel, text, 'eightball', from, 'Magic 8 Ball prediction');
        break;

      case 'slap':
        bot.say(channel, theSlap(args));
        break;

      case 'fortune':
        randSelect(channel, 'fortune', 'fortune', 'Fortune Cookie fortunes');
        break;

      case 'fcadd':
        randAdd(channel, text, 'fortune', from, 'Fortune Cookie fortune');
        break;

      case 'insult':
        randSelect(channel, 'insult', 'insult', 'insults', args, from);
        break;

      case 'insultadd':
        randAdd(channel, text, 'insult', from, 'insult');
        break;

      case 'chat':
        chatBot(channel, text);
        break;
    }
  }
});

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
    return bot.say(channel, `I don't have any ${response} yet`);
  }
  var date = Math.floor(new Date() / 1000);
  const rawRand = db.prepare(`SELECT * FROM userinputs WHERE (channel = '${channel}' OR channel = 'Global') AND type='${type}' ORDER BY RANDOM() LIMIT 1;`).get();
  const rand = rawRand['content'];
  const randID = rawRand['row'];
  if (command === 'insult') {
    if (args[1]) {
      return bot.say(channel, 'Slow down there, pal. We only insult one person at a time around here.');
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
    bot.say(channel, insult);
  } else {
    bot.say(channel, rand);
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
      bot.say(channel, `A new ${response} has been added!`);
    } else {
      bot.say(channel, `You need to tell me the ${response} to add!`);
    }
}


function chatBot(channel, seed) {
  (async function() {
      try {
        var resp = await deepai.callStandardApi("text-generator", {
                text: seed,
        });
      }
      catch(err) {
        console.log(err);
      }
      var sentence = resp['output'].split['\n'];
      console.log(sentence[0]);
      bot.say(channel, sentence[0]);
  })()
}
