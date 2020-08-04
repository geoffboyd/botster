module.exports = { 
  name: 'fortune', 
  description: 'Fortune Cookie', 
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
    // Check if the table "userinputs" exists and has content from this guild.
    const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type = 'fortune';`).get();
    if (!table['count(*)']) {
      return msg.channel.send("I don't know any fortunes yet");
    }
    var date = Math.floor(new Date() / 1000);
    const rawFortune = db.prepare(`SELECT * FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type='fortune' ORDER BY RANDOM() LIMIT 1;`).get();
    const fortune = rawFortune['content'];
    const fortuneID = rawFortune['row'];
    msg.channel.send(fortune);
    db.prepare('UPDATE userinputs SET lastUsed = ? WHERE row = ?').run(date,fortuneID);
  },
};