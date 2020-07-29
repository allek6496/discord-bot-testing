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
    // prevent bot from responding to own messages
    if (message.author.id == client.user.id) return;

    // there's currently no option to change prefix in a dm channel
    if (message.channel.type === 'text') {
        var prefix = handler.getValue('prefix', message.guild);
    } else {
        var prefix = ''
    }

    // parse the message info to get both the command and the arguments for that command
    const args = message.content.slice(prefix.length).trim().split(' ').map(arg => arg.toLowerCase());
    const commandName = args.shift();

    // first check for special commands not requiring the prefix
    if (message.content === '🔔') {
        // if they send just a bell emoji, respond with two bell emojis and "Ding Dong"
        // note command doesn't work because there's no prefix here
        client.commands.get('🔔').execute(message, args);
        
    } else if (message.mentions.has(client.user)) {
        // checks if the bot was @tted
        client.commands.get('hellothere').execute(message, args);

    } else {
        if (message.content.slice(0, prefix.length) != prefix) return;

        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) return;
        console.log(`\n${commandName} to be called!`);

        if (command.guildOnly && message.channel.type != 'text') {
            message.channel.send(`You can't use the command ${commandName} in a DM! For a list of commands you can use type "help"`)
        } else {
            try {
                command.execute(message, args);
            } catch (e) {
                console.log(e);
                message.reply(`There was an error trying to execute the command ${prefix}${commandName} :sob:`);
            }
        }
    }
});

// message sent when the bot first joins the server
client.on('guildCreate', guild => {
    guild.systemChannel.send(`Hello, ${guild.name}, I'm happy to be here! :bell:\nMy prefix is ~, to set me up type "~setup" and I'll walk you through my setup :smile:`);

    handler.setValue('id', guild);
});

// remove the guild entry when the bot leaves
client.on('guildDelete', guild => {
    handler.deleteGuild(guild);
})

// log into discord using the token
client.login(process.env.TOKEN);
