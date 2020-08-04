module.exports = {
  name: 'insultadd',
  description: 'Add new insults',
  execute(msg, args) {
    const SQLite = require("better-sqlite3");
    const db = new SQLite('../userinputs.sqlite');
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
    var type = 'insult';
    var date = Math.floor(new Date() / 1000);
    var newInsult = msg.content.split(' ');
    newInsult.shift();
    newInsult = newInsult.join(' ');
    const insultObject = { user: msg.member.user.tag, channel: msg.guild.id, type: `${type}`, content: `${newInsult}`, lastUsed: `${date}` };
    if (newInsult.length > 0) {
      addInputs.run(insultObject);
      msg.channel.send('A new insult has been added!');
    } else {
      msg.channel.send('You need to tell me the insult to add!');
    }
  },
};