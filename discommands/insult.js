module.exports = { 
  name: 'insult', 
  description: 'Insult someone', 
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
    // Check if the table "userinputs" exists and has content from this guild.
    const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type = 'insult';`).get();
    if (!table['count(*)']) {
      return msg.channel.send("I don't have any insults yet");
    }
    var date = Math.floor(new Date() / 1000);
    const rawInsult = db.prepare(`SELECT * FROM userinputs WHERE type = 'insult' AND (channel = ${msg.guild.id} OR channel = 'Global') ORDER BY RANDOM() LIMIT 1;`).get();
    const insult = rawInsult['content'];
    const insultID = rawInsult['row'];
    if (args[0]) {
      var target = args[0];
    } else {
      var target = msg.author.username;
    }
    if (insult.includes('{}')) {
        var finalInsult = insult.replace('{}', target);
    } else {
      var finalInsult = target + ' ' + insult;
    }
    msg.channel.send(finalInsult);
    db.prepare('UPDATE userinputs SET lastUsed = ? WHERE row = ?').run(date,insultID);
  },
};