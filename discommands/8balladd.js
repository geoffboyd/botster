module.exports = {
  name: '8balladd',
  description: 'Add new visions to the Magic 8 Ball',
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
    var type = 'eightball';
    var new8ball = msg.content.split(' ');
    var date = Math.floor(new Date() / 1000);
    new8ball.shift();
    new8ball = new8ball.join(' ');
    const eightballObject = { user: msg.member.user.tag, channel: msg.guild.id, type: `${type}`, content: `${new8ball}`, lastUsed: `${date}` };
    if (new8ball.length > 0) {
      addInputs.run(eightballObject);
      msg.channel.send('A new Magic 8 Ball prediction has been added!');
    } else {
      msg.channel.send('You need to tell me the Magic 8 Ball prediction to add!');
    }
  },
};



