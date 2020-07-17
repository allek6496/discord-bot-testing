const disc = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const handler = require('./configHandler.js');

const client = new disc.Client();
client.commands = new disc.Collection();

// output a log when the bot is set up
client.once('ready', () => {
    console.log('Ready!');
});

// only attempt to draw from my .env file if it's needed
// this is here so I can test from my home machine
if (!process.env.TOKEN) {
    require('dotenv').config();
}

// pull all the command files into an array
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// go through each of the command files and get it's contents
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
}

client.on('message', message => {
    var prefix = handler.getValue('prefix', message.guild.id);
    
    // prevent the bot from responding to it's own messages, and possibly entering a loop
    if (message.author.id == client.user.id) {
        return;
    }

    // parse the message info to get both the command and the arguments for that command
    const args = message.content.slice(prefix.length).trim().split(' ').map(arg => arg.toLowerCase());
    const command = args.shift();

    // if they send just a bell emoji, respond with two bell emojis and "Ding Dong"
    // note command doesn't work because there's no prefix here
    if (message.content === '🔔') {
        client.commands.get('dingdong').execute(message, args);
        
    // checks if the bot was @tted
    } else if (message.mentions.has(client.user)) {
        client.commands.get('hellothere').execute(message, args);

    } else {
        if (!client.commands.has(command)) return;

        try {
            client.commands.get(command).execute(message, args);
        } catch (e) {
            console.error(e);
            message.reply(`There was an error trying to execute the command ${command} :sob:`);
        }
    }
});

// message sent when the bot first joins the server
client.on('guildCreate', guild => {
    guild.systemChannel.send(`
Hello, ${guild.name}, I'm happy to be here! :bell:\n
My prefix is ~, to set me up type "~setup" and I'll walk you through my setup :smile:
    `);

    handler.setValue('id', guild.id);
});

// remove the guild entry when the bot leaves
client.on('guildDelete', guild => {
    handler.deleteGuild(guild.id);
})

// log into discord using the token
client.login(process.env.TOKEN);
