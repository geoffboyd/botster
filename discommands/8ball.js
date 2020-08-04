module.exports = { 
  name: '8ball', 
  description: 'Magic 8 Ball', 
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
    // Check if the table "userinputs" exists and has content from this guild.
    const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type = 'eightball';`).get();
    if (!table['count(*)']) {
      return msg.channel.send("I don't have any 8 Ball predictions yet");
    }
    var date = Math.floor(new Date() / 1000);
    const rawPrediction = db.prepare(`SELECT * FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type='eightball' ORDER BY RANDOM() LIMIT 1;`).get();
    const prediction = rawPrediction['content'];
    const predictionID = rawPrediction['row'];
    msg.channel.send(prediction);
    db.prepare('UPDATE userinputs SET lastUsed = ? WHERE row = ?').run(date,predictionID);
  },
};
