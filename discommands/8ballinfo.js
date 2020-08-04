module.exports = { 
  name: '8ballinfo', 
  description: 'Info on the most recent Magic 8 Ball prediction called', 
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
    // Check if the table "userinputs" exists and has content from this guild.
    const table = db.prepare(`SELECT count(*) FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type = 'eightball';`).get();
    if (!table['count(*)']) {
      return msg.channel.send("I don't have any 8 Ball predictions yet");
    }
    const rawPrediction = db.prepare(`SELECT * FROM userinputs WHERE (channel = ${msg.guild.id} OR channel = 'Global') AND type='eightball' ORDER BY lastUsed DESC LIMIT 1;`).get();
    const prediction = rawPrediction['content'];
    const predictionID = rawPrediction['row'];
    const predictionAuthor = rawPrediction['user'];
    msg.channel.send(`The last prediction was row number ${predictionID} and said "${prediction}", which was added by ${predictionAuthor}.`);
  },
};
