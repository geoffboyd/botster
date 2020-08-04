# botster: the official boydster bot
Chatbot for Discord, Twitch, and IRC

This bot is began its life as some code stuck together from DiscordJS Guide, Sitepoint and AnIdiotsGuide, along with a little love and magic from boydster himself. It continues to grow

- [https://discordjs.guide/](https://discordjs.guide/)
- [https://www.sitepoint.com/discord-bot-node-js/](https://www.sitepoint.com/discord-bot-node-js/)
- [https://anidiots.guide/coding-guides/sqlite-based-points-system](https://anidiots.guide/coding-guides/sqlite-based-points-system)

## Requirements

- [Node.js](http://nodejs.org/)
- [Discord](https://discordapp.com/) developer account
- AND/OR [Twitch](https://twitch.tv) developer account
- AND/OR An IRC channel you want to use

## Installation Steps (if applicable)

1. Clone repo
2. Edit json files in ./config to include your own credentials
3. Edit discommands/secret.json to include your own secret info
3. Inside ./bots choose which bot to launch using `node`. Example: `node discord-botster.js` to launch the Discord bot.
4. Interact with your bot via Discord, Twitch, and/or IRC depending on how you are using it.

Note in case you choose to get rid of the existing database. You'll want to add a fortune, insult, or 8 ball prediction to generate the table to start collecting those things. The easiest way is just to run the insultadd command, but you can also manually create a sqlite db and import some data into it.

## License
All glory to Hypnotoad. I claim no license over any of this.