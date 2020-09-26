const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token, owner } = require('../config/discord.json');
const SQLite = require("better-sqlite3");
const sql = new SQLite('../userinputs.sqlite');
const client = new Discord.Client();
client.commands = new Discord.Collection();
const MarkovChain = require('markovchain');

const commandFiles = fs.readdirSync('../discommands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`../discommands/${file}`);
  client.commands.set(command.name, command);
}

client.once('ready', () => {
  // Check if the table "points" exists.
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }
  // And then we have two prepared statements to get and set the score data.
  client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");
  console.log(`${client.user.username} is online!`);
});

client.on('message', message => {
  let botName = client.user.username;
  if (message.guild.me.nickname) {
    botName = message.guild.me.nickname;
  }
  if (message.channel.type !== "text") return; 
	if (message.guild !== null && !fs.existsSync(`discord.${message.guild.id}.History.txt`)) {
		fs.writeFile(`discord.${message.guild.id}.History.txt`, `Welcome to ${message.guild.name}!`, function (err) {
			if (err) throw err;
		})
	}
 	var words = message['content'].trim().split(/ +/);
        words = words.filter(function(e, botName) { return e.toLowerCase() !== botName.toString().toLowerCase() });
	var randomFuckery = Math.ceil(Math.random()*20);
	if (!message.author.bot && message.guild !== null) {
		fs.appendFile(`discord.${message.guild.id}.History.txt`, `\n${message['content']}`, function (err) {
			if (err) throw err;
		});
	}
	let score;
	if (message.author.bot) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if ((!message.author.bot) && (message['content'].toLowerCase().includes(botName.toString().toLowerCase()) && (!command))  || (randomFuckery === 10))
    {
      if (words[1]) {
        var startWord = words[Math.floor(Math.random()*words.length)];
        var phraseLength = (Math.ceil(Math.random()*((words.length + 10)*2)));
      } else {
        var startWord = message.member.displayName;
        var phraseLength = Math.ceil(Math.random()*20);
      }
    wordSalad = new MarkovChain(fs.readFileSync(`./discord.${message.guild.id}.History.txt`, 'utf8'))
    var phrase = wordSalad.start(startWord).end(phraseLength).process();
    var firstLetter = phrase.slice(0, 1);
    firstLetter = firstLetter.toUpperCase();
    var restOfPhrase = phrase.slice(1, phrase.length);
    phrase = firstLetter + restOfPhrase;
    while (phrase.endsWith('?') || phrase.endsWith('.') || phrase.endsWith('!') || phrase.endsWith('"') || phrase.endsWith(',')) {
      phrase = phrase.slice(0, -1)
    }
    while (phrase.includes('@')) {
      phrase.replace('@', '');
    }
    message.channel.send(phrase+'.');
    }


    if (message.guild) {
      score = client.getScore.get(message.author.id, message.guild.id);
      if (!score) {
        score = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, points: 0, level: 1 }
      }
      if (message.content.toLowerCase().includes(" oof") || message.content.toLowerCase() === "oof") {
        score.points++
      };
      const curLevel = Math.floor(0.1 * Math.sqrt(score.points));
      if(score.level < curLevel) {
        score.level = curLevel;
        message.reply(`You've leveled up to level **${curLevel}**!`);
      }
      client.setScore.run(score);
    }
    if (message.content.indexOf(prefix) !== 0) return;

    // Let's run through the commands that require the DB
    let privilegedUsers = [owner, message.guild.owner.id];
    if(commandName === "myoofs") {
      return message.reply(`You currently have ${score.points} oofs and are level ${score.level}!`);
    }

    if(commandName === "give") {
      // Limited to bot owner - adjust to your own preference!
      if(!privilegedUsers.includes(message.author.id)) return message.reply("nopenopenope. That was wrong and you should feel bad.");
      const user = message.mentions.users.first() || client.users.cache.get(args[0]);
      if(!user) return message.reply("You must mention someone or give their ID!");
      const pointsToAdd = parseInt(args[1], 10);
      if(!pointsToAdd) return message.reply("You didn't tell me how many oofs to give...")

      // Get their current points.
      let userscore = client.getScore.get(user.id, message.guild.id);
      // It's possible to give points to a user we haven't seen, so we need to initiate defaults here too!
      if (!userscore) {
        userscore = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, points: 0, level: 1 }
      }
      userscore.points += pointsToAdd;

      // We also want to update their level (but we won't notify them if it changes)
      let userLevel = Math.floor(0.1 * Math.sqrt(score.points));
      userscore.level = userLevel;

      // And we save it!
      client.setScore.run(userscore);
      return message.channel.send(`${user.tag} has received ${pointsToAdd} oofs and now stands at ${userscore.points} oofs.`);
    }

    if(commandName === "leaderboard") {
      const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(message.guild.id);

      // Now shake it and show it! (as a nice embed, too!)
      const embed = new Discord.MessageEmbed()
        .setDescription("Our top 10 oof points leaders!")
        .setColor(0xBC5949);

      for(const data of top10) {
        embed.addField(client.users.cache.get(data.user).tag, `${data.points} oofs (level ${data.level})`);
      }
      return message.channel.send({embed});
    }

    if(commandName === "alloofs") {
      const oofs = sql.prepare("SELECT SUM(points) FROM scores  WHERE guild = ?;").all(message.guild.id);
      return message.channel.send(`Our server is currently at ${Object.values(oofs[0])} oofs`);
    }

    if (commandName === "clearoofs") {
      if(!privilegedUsers.includes(message.author.id)) return message.reply("listen, ok, you and I both know you can't do that.");
      sql.prepare("DELETE FROM scores WHERE guild = ?;").run(message.guild.id);
      return message.channel.send("Oof counts have been reset!");
    }

    if (!command) return;

    if (command.guildOnly && message.channel.type !== 'text') {
      return message.reply('I can\'t execute that command inside DMs!');
    }

    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;

      if (command.usage) {
        reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
      }

      return message.channel.send(reply);
    }

    try {
      command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply('there was an error trying to execute that command!');
    }
});

client.login(token);
