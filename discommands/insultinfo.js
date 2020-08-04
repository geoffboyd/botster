module.exports = { 
  name: 'insultinfo', 
  description: 'Info on the most recent insult called', 
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
    // Check if the table "userinputs" exists and has content from this guild.
    const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type = 'insult';`).get();
    if (!table['count(*)']) {
      return msg.channel.send("I don't have any insults yet");
    }
    const rawInsult = db.prepare(`SELECT * FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type='insult' ORDER BY lastUsed DESC LIMIT 1;`).get();
    const insult = rawInsult['content'];
    const insultID = rawInsult['row'];
    const insultAuthor = rawInsult['user'];
    msg.channel.send(`The last insult was row number ${insultID} and said "${insult}", which was added by ${insultAuthor}.`);
  },
};
