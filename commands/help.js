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
        const data = [];
        const {commands} = message.client;
        const isDM = message.channel.type != 'text';

        if (!args.length) {
            data.push(`Here's a list of each of my commands: `);

            data.push(commands.map(command => {
                var commandInfo = handler.getCommandInfo(message.guild, command);

                if (commandInfo) {
                    if (commandInfo['permissions']) {
                        if (!message.member.permissionsIn(message.channel).has(commandInfo[permissions])) {
                            return false;
                        }
                    }

                    if (commandInfo['channels']) {
                        if (!(commandInfo['channels'].contains(message.channel) || commandInfo['channels'].length)) {
                            return false;
                        }
                    }
                }

                if (isDM && !command.guildOnly && !command.hideHelp) {
                    return command.name;
                } else if (!isDM && !(command.hideHelp == true)) {
                    return command.name;
                } else {
                    return false;
                }
            }).filter(item => item).join(', '));

            data.push(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command.`)

            return message.channel.send(data, {split: true});
        } else {
            const name = args[0].toLowerCase();
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
            const commandInfo = handler.getCommandInfo(message.guild, name);
            
            if (!command) {
                return message.reply(`That's not a valid command!`);
            } 
            
            if (commandInfo) {
                if (commandInfo['permissions']) {
                    if (!message.member.permissionsIn(message.channel).has(commandInfo[permissions])) {
                        return message.reply('You do not have permissions here to that command!');
                    }
                }

                if (commandInfo['channels']) {
                    if (!(commandInfo['channels'].contains(message.channel) || commandInfo['channels'].length)) {
                        message.reply('This command is not usable in this channel. It can be used in the following channels:');
                        commandINfo['channels'].forEach(channel => {
                            message.channel.send(`> ${channel}`);
                        });
                    }
                }
            }

            data.push(`> Name: ${command.name}`);

            if (command.aliases) data.push(`> Aliases: ${command.aliases.join(', ')}`);
            if (command.description) data.push(`> Description: ${command.description}`);
            if (command.usage) data.push(`> Usage: ${prefix}${command.name} ${command.usage}`);
            if (!command.args) data.push(`> This command does not need arguments`);
            if (commandInfo && commandInfo['permissions']) data.push(`> This command requires the following permissions to run: ${commandInfo['permissions']}`);
            if (commandInfo && commandInfo['channels']) data.push(`> This command can only be used in the following channels:\n` && commandInfo['channels'].array.forEach(channel => {data.push(`>> ` + channel)}));

            message.channel.send(data, {split: true});
        }
    }
}