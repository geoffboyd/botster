module.exports = { 
  name: 'deadcat', 
  description: 'It\'s a dead cat...', 
  execute(msg, args) {
    const secret = require("./secret.json");
    if (msg.author.id == secret.andy || msg.author.id == secret.owner) {
      msg.channel.send(
        {
          "embed": {
            "image": {
              "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcSq65F14JpDbr3nKslW2dXTW0QvPiriKECv0A&usqp=CAU"
            }
          }
        }
      )
	  .then(msg => {
        msg.delete({ timeout: 5000 })
      })      
    }
  },
};