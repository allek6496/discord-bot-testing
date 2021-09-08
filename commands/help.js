const { Permissions, MessageEmbed} = require('discord.js');

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
    async execute(message, args) {
        const handler = require('../configHandler.js');
        const prefix = await handler.getGuildValue('prefix', message.guild);
        
        const {commands} = message.client;
        const isDM = message.channel.type == 'DM';

        // stores all the messages to send at once so users have less opportunity to but in. also because the official discord.js tutorial says to do it this way
        const data = [];

        // create an object to hold the response
        var response = new MessageEmbed();

        // case if there are no args, list all commands
        if (!args.length) {

            //TODO: use embed
            /* new system, work in progress (other things are more important than things looking nice)
            If I make something new I'll try and use new systems but for now I won't bother overhauling stuff that already works

            Ironic because this wasn't working

            leave me alone ._.

            response.setAuthor("Attendance Bot", 
                               // rick and morty butter bot image
                               "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fstatici.behindthevoiceactors.com%2Fbehindthevoiceactors%2F_img%2Fchars%2Fbutter-bot-rick-and-morty-65.7.jpg&f=1&nofb=1", 
                               "https://github.com/allek6496/discord-bot-testing");

            response.setColor('#0099ff');

            response.setDescription("List of bot commands");

            // count the number of fields so 25 isn't passed and to know whether or not there should be multiple pages (>25 hasn't been tested so it probably doesn't work but that's not a problem till there are 25 commands)
            var fieldNumber = 0;

            response.addFields(commands.map(command => {
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

                // if it's ok to use in a dm add the name to the list OR if it's not a dm and it's ok to show, add the name to the list
                if ((isDM && !command.guildOnly && !command.hideHelp) || (!isDM && !command.hideHelp)) {
                    fieldNumber++;

                    // EmbedFieldData showing name and description, I'm not sure what "inline" is but it sounds good
                    return {
                        "name": command.name,
                        "value": command.description,
                        "inline": true
                    };

                // if it's neither of these is true, default to not adding.
                } else {
                    return false;
                }
            // filter out the false entries so they don't show up
            }).filter(command => {command !== false}));

            // add a footer showing page number and give another set of instructions on how to get specific command instructions.

            */

            // old system using normal messages:
            data.push(`Here's a list of each of my commands: `);

            data.push('> ');
            var devs = handler.getConfigVar('devs');

            handler.getGuildValue("commands", message.guild)
            .then(guildCommands => {
                commands.forEach(command => {
                    if (guildCommands && command.name in guildCommands) {
                        for (const info in guildCommands[command.name]) {
                            command[info] = guildCommands[command.name][info];
                        }
                    }

                    let show = true;

                    if ('permissions' in command) {
                        if (command['permissions'] == "DEV") {
                            // They aren't a dev (case handled) then don't show it to them
                            show = false;
                        // Otherwise make sure valid permissions are handled
                        } else if (message.guild && !message.member.permissionsIn(message.channel).has(command['permissions'], true)) {
                            show = false;           
                        }
                    }

                    // if the command specifies required channels, and this is not one of them don't show it. if it specifies no channels, it's fine to show
                    if ('channels' in command) {
                        if (command['channels'].length && !(command['channels'].includes(message.channel))) {
                            show = false;
                        }
                    }

                    // if it's ok to use in a dm add the name to the list
                    if (isDM && !command.guildOnly && !command.hideHelp) {
                        // this doesn't actually do anything, but it's useful for understanding the code
                        show *= true;
                    // if it's not a dm and it's ok to show, add the name to the list
                    } else if (!isDM && !command.hideHelp) {
                        show *= true;
                    // if it's neither of these is true, default to not adding.
                    } else {
                        show = false;
                    }
                
                    let dev = devs.includes(message.author.id.toString());

                    // If they're a dev always show the dev commands, but indicate which ones wouldn't normally be seen
                    if (dev && show == false) {
                        data[1] += '`' + command.name + '`' + ', ';
                    } else if (show == true) {
                        data[1] += command.name + ', ';
                    }
                });

                // remove the last `, ` from the end
                data[1] = data[1].slice(0, -2);

                // prompt a follow up message from them
                data.push(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command.`)
    
                // send all the messages at once, possibly splitting into multiple messages
                return message.channel.send(data.join('\n'));
            }).catch(err => {console.log(`Error while requesting command info in ${message.guild.name}\n${err}`)});

        // TODO: make this use an embed as well
        } else {
            // all command names are lower case, so correct it for them if they used some capitals
            const name = args[0].toLowerCase();

            // attempt to locate the command they asked for
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

            // retrieve the special command data and restrictions for this guild
            const commandInfo = await handler.getCommandInfo(message.guild, message.client, name);
            
            // if the command couldn't be found
            if (!command) {
                return message.reply(`That's not a valid command!`);
            } 
            
            if (commandInfo) {
                // if the command specifies permissions, but the user doesn't meet the requirements, tell them they can't use it
                if (commandInfo['permissions']) {
                    if (commandInfo['permissions'] == "DEV") {
                        var devs = await handler.getConfigVar('devs');
                        if (!devs.includes(message.author.id.toString())) return message.reply('You can\'t run that command! This command is for development purposes only.');
                    } if (!message.member.permissionsIn(message.channel).has(commandInfo['permissions'])) {
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
            if (command.usage) data.push(`> Usage: \`${prefix}${command.name} ${command.usage}\``);

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
            message.channel.send(data.join('\n'));
        }

        // message.channel.send(response);
    }
}