const disc = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const handler = require('./configHandler.js');
const {update} = require('./commands/start.js');

const client = new disc.Client();
client.commands = new disc.Collection();

// output a log when the bot is set up
client.once('ready', () => {
    console.log('Ready!');
    handler.updateCommands(client);
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

    // find the correct prefix to use
    if (message.channel.type === 'text') {
        var prefix = handler.getGuildValue('prefix', message.guild);
    } else {
        // there's currently no option to change prefix in a dm channel
        var prefix = ''
    }

    // parse the message info to get both the command and the arguments for that command
    const args = message.content.slice(prefix.length).trim().split(' ').map(arg => arg.toLowerCase());
    const commandName = args.shift();

    // first check for special commands not requiring the prefix
    if (message.content.includes('🔔')) {
        // if they send just a bell emoji, respond with two bell emojis and "Ding Dong"
        // note command doesn't work because there's no prefix here
        client.commands.get('🔔').execute(message, args);
        
    // checks if the bot was @tted
    } else if (message.mentions.has(client.user)) {
        client.commands.get('hellothere').execute(message, args);

    // if there's no special case, continue as normal
    } else {
        // first, if there's no prefix, don't respond
        if (message.content.slice(0, prefix.length) != prefix) return;

        // try and get the command
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        // if the command doesn't exist, don't continue
        if (!command) return;

        var commandInfo = handler.getCommandInfo(message.guild, commandName);

        // check for command info (this shouldn't be needed because every command should have a commandInfo entry)
        if (commandInfo) {
            // if they don't have the correct permissions, don't let them run the command
            if (commandInfo.hasOwnProperty('permissions')) {
                if (!message.member.permissionsIn(message.channel).has(commandInfo['permissions'])) return;
            }
            
            // if the channel isn't allowed for thie command, don't run the command
            if (commandInfo.hasOwnProperty('channels')) {
                if (!(commandInfo['channels'].includes(message.channel.id)) && commandInfo['channels'].length) return;
            }
        }

        // if it's a dm message, but the command can't be used in a dm, let them know
        if (command.guildOnly && message.channel.type != 'text') {
            message.channel.send(`You can't use the command ${commandName} in a DM! For a list of commands you can use type "help"`)
            return;
        } 
        
        // make sure that commands requiring arguments are given arguments
        if (command.args && !args.length) {
            message.channel.send('That command requires arguments! Here are the details for this command:');
            
            // if they make a mistake, be sure to give them the proper usage
            client.commands.get('help').execute(message, [commandName])
            return;
        }
        
        // log the message usage, could get spammy so might be removed
        console.log(`\n${commandName} to be called from ${message.guild}!`);
        
        // try executing the command, and if it doesn't work give them a visible error sign, without giving error information so they can alert a dev there's something wrong
        try {
            command.execute(message, args);
        } catch (e) {
            console.log(e);
            message.reply(`There was an error trying to execute the command ${prefix}${commandName} :sob:`);
        }
    }
});

client.on

// message sent when the bot first joins the server
client.on('guildCreate', guild => {
    // send a message when entering the server
    guild.systemChannel.send(`Hello, ${guild.name}, I'm happy to be here! :bell: \nI've sent an invite link to my dev team, they're on their way to validate this club! For security resons we have to manually verify club creation, so bear with us :smile:`);

    // create the guild entry
    handler.setGuildValue('id', guild.id, guild);

    // send me (the dev) a link to the server
    client.users.fetch('552890476089573396').send(`Bot was invited to ${guild.name}, here's the invite link:\n` + 
    guild.systemChannel.createInvite({
        maxAge: 0,
        maxUses: 4,
        unique: true,
        reason: 'Invite a dev to the server to make sure it\'s a real club server'
    }).url);
});

// remove the guild entry when the bot leaves
client.on('guildDelete', guild => {
    handler.deleteGuild(guild);
});

// spam protection, giving the new role to new members so they can't get immediate access to the server
client.on('guildMemberAdd', member => {
    devs = handler.getConfigVar('devs');

    // if the user was a dev, don't restrict them
    if (devs.includes(member.id)) {
        var memberRole = handler.getGuildValue('member', member.guild);

        // if there's no member role, the server probably isn't set up so it's fine to do nothing
        if (memberRole) {
            member.roles.add(member.guild.roles.resolve(memberRole));
        } 

    // all other users should be given the new role, do nothing otherwise
    } else {
        var newRole = handler.getGuildValue('new', member.guild)
        

        if (newRole) {
            member.roles.add(member.guild.roles.resolve(newRole));
        }
    }
});

// checks for changes in voice chats
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.channel) {
        update(oldState.member, oldState.channel);
        // oldState.guild.systemChannel.send(`${oldState.member} just left ${oldState.channel.name}`);
    }

    if (newState.channel) {
        update(newState.member, newState.channel);
        // newState.guild.systemChannel.send(`${newState.member} just joined ${newState.channel.name}`);
    }
});

// log into discord using the token
client.login(process.env.TOKEN);