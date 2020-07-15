const disc = require('discord.js');
const client = new disc.Client();

client.once('ready', () => {
    console.log('Ready!');
});

client.login(ENV['TOKEN'])

client.on('message', message => {
    console.log(message.content);

    if (message.content === "🔔") {
        message.channel.send("🔔 Ding Dong 🔔")
    }
});

