const { Permissions } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'A list of all possible commands, or detail on just one command',
    aliases: ['commands'],
    usage: '<command name>',
    guildOnly: false,
    args: false,

    /**
     * Replies with either the list of commands or a specific command.
     * @param {Message} message The message object of the triggering event.
     * @param {any} args Any arguments provided, either none or a command name.
     */
    execute(message, args) {
        const handler = require('../configHandler.js');
        const prefix = handler.getGuildValue('prefix', message.guild);
        
        const {commands} = message.client;
        const isDM = message.channel.type != 'text';
        
        // stores all the messages to send at once so users have less opportunity to but in. also because the official discord.js tutorial says to do it this way
        const data = [];

        // case if there are no args, list all commands
        if (!args.length) {
            data.push(`Here's a list of each of my commands: `);

            // only show commands the user has permissions to use
            data.push(commands.map(command => {
                var commandInfo = handler.getCommandInfo(message.guild, command.name);

                if (commandInfo) {
                    // if the command specifies required permissions, and the user doesn't have that, don't show them the option
                    if (commandInfo['permissions']) {
                        if (!message.member.permissionsIn(message.channel).has(commandInfo['permissions'])) {
                            return false;
                        }
                    }

                    // if the command specifies required channels, and this is not one of them don't show it. if it specifies no channels, it's fine to show
                    if (commandInfo.hasOwnProperty('channels')) {
                        if (!(commandInfo['channels'].includes(message.channel) && commandInfo['channels'].length)) {
                            return false;
                        }
                    }
                }

                // if it's ok to use in a dm add the name to the list
                if (isDM && !command.guildOnly && !command.hideHelp) {
                    return command.name;

                // if it's not a dm and it's ok to show, add the name to the list
                } else if (!isDM && command.hideHelp != true) {
                    return command.name;

                // if it's neither of these is true, default to not adding.
                } else {
                    return false;
                }
            }).filter(e => e).join(', '));

            // prompt a follow up message from them
            data.push(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command.`)

            // send all the messages at once, possibly splitting into multiple messages
            return message.channel.send(data, {split: true});

        } else {
            // all command names are lower case, so correct it for them if they used some capitals
            const name = args[0].toLowerCase();

            // attempt to locate the command they asked for
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

            // retrieve the special command data and restrictions for this guild
            const commandInfo = handler.getCommandInfo(message.guild, name);
            
            // if the command couldn't be found
            if (!command) {
                return message.reply(`That's not a valid command!`);
            } 
            
            if (commandInfo) {
                // if the command specifies permissions, but the user doesn't meet the requirements, tell them they can't use it
                if (commandInfo['permissions']) {
                    if (!message.member.permissionsIn(message.channel).has(commandInfo['permissions'])) {
                        return message.reply('You do not have permissions here to run that command!');
                    }
                }
            }

            // note that it's ok to ask for help for a command outside of it's channel. idk if this is a good idea or not

            data.push(`> Name: ${command.name}`);

            // if there are alternate names for the command
            if (command.aliases) data.push(`> Aliases: ${command.aliases.join(', ')}`);

            // add the description of the command if it exists
            if (command.description) data.push(`> Description: ${command.description}`);

            // give the usage for this specific server
            if (command.usage) data.push(`> Usage: ${prefix}${command.name} ${command.usage}`);

            // if it doesn't need args, say so. generally a command will never have usage and no arguments
            if (!command.args) data.push(`> This command does not need arguments`);

            // list the required permissions (note that the asker will allways meet these permissions)
            if (commandInfo && commandInfo['permissions']) data.push(`> This command requires the following permissions to run: ${commandInfo['permissions']}`);
            
            // list the channels it can be used in
            // the && will stop if it encounters a false, so this is error free since it'll stop before getting to what I actually want to know
            if (commandInfo && commandInfo.hasOwnProperty('channels') && commandInfo['channels'].length) {
                data.push(`> This command can only be used in the following channels:`);
                commandInfo['channels'].forEach(channel => {data.push(`>           ` + message.guild.channels.resolve(channel).name)});
            }

            // send the messages all at once, like before
            message.channel.send(data, {split: true});
        }
    }
}