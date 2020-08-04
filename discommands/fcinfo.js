module.exports = { 
  name: 'fcinfo', 
  description: 'Info on the most recent Fortune Cookie fortune called', 
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
    // Check if the table "userinputs" exists and has content from this guild.
    const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = ${msg.guild.id} OR guild = 'Global') AND type = 'fortune';`).get();
    if (!table['count(*)']) {
      return msg.channel.send("I don't have any fortunes yet");
    }
    const rawFortune = db.prepare(`SELECT * FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type='fortune' ORDER BY lastUsed DESC LIMIT 1;`).get();
    const fortune = rawFortune['content'];
    const fortuneID = rawFortune['row'];
    const fortuneAuthor = rawFortune['user'];
    msg.channel.send(`The last fortune was row number ${fortuneID} and said "${fortune}", which was added by ${fortuneAuthor}.`);
  },
};
