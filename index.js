const disc = require('discord.js');
const keys = require('./keys.json')
const client = new disc.Client();

client.once('ready', () => {
    console.log('Ready!');
});

client.login(keys.token)

client.on('message', message => {
    console.log(message.content);

    if (message.content === ":bell:") {
        message.channel.send(":bell: Ding Dong :bell:")
    }
});

