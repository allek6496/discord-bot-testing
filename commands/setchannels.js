module.exports = {
    name: 'setchannels',
    description: 'Adds a channel a command can be used in. If NONE is included, it will be set to be usable anywhere.',
    args: true,
    usage: '<command> <channel1> <channel2>... ',
    aliases: ['setchannel'],
    guildOnly: true,
    permissions: "DEV",

    //TODO: this doesn't work lol

    /**
     * Adds a channel a command can be used in. If 'NONE' is included, it will be set to be usable anywhere.
     * @param {Message} message The discord message object for the triggering event.
     * @param {string Array} args The list of words following the triggering command (prefix).
     */
    async execute(message, args) {
        const handler = require('../configHandler');
        
        const command = args.shift();
        var commandInfo = await handler.getCommandInfo(message.guild, message.client, command);

        if (!args.length) {
            return message.channel.send(`Please specify the channels you want to restrict ${command} to, or \`none\` to make it usable anywhere.`)

        // all commands have command info (often blank), so if it failed to find, don't create new command info for it
        } else if (commandInfo === null) {
            return message.channel.send(`That is not a valid command! To find a list of valid commands, type \`${handler.getGuildValue('prefix', message.guild)}help\``)
        }

        // if "none" is included, remove all required channels
        if (args.filter(arg => arg.toLowerCase() === 'none').length > 0) {
            commandInfo['channels'] = [];
            handler.setCommandInfo(message.guild, command, commandInfo);
            message.channel.send(`Removed channel restrictions for ${command}, it can now be used anywhere in the server`);
            return;
        }

        // keep track of the invallid channels
        var failedToFind = [];

        // go through each channel and try to add it to the list of required channels for this command
        args.forEach(async arg => {
            const channels = message.guild.channels;
            let found = false;

            // mentioned a channel
            if (arg.includes('#')) {
                let channel = await message.guild.channels.fetch(args[0].substring(2, args[0].length-1))
                .catch(e => {
                    console.log(e);
                    message.channel.send('An error occured while trying to fetch that channel, please try again.');
                });

                // after the channel is recieved, if successful, set the guild value to the channel id, otherwise ask to try again
                if (channel) {
                    found = true;

                    if (commandInfo.hasOwnProperty('channels')) {
                        if (!commandInfo['channels'].includes(channel.id)) {
                            commandInfo['channels'].push(channel.id);
                        }
                    } else commandInfo['channels'] = [channel.id];

                    message.channel.send(`Restricted ${command} to ${arg}.`);
                } 
            // by name
            } else {
                let channel = message.guild.channels.cache.find(channel => channel.name.toLowerCase() == arg);

                if (channel) {
                    found = true;

                    if (commandInfo.hasOwnProperty('channels')) {
                        if (!commandInfo['channels'].includes(channel.id)) {
                            commandInfo['channels'].push(channel.id);
                        }
                    } else commandInfo['channels'] = [channel.id];

                    message.channel.send(`Restricted ${command} to ${arg}.`);
                } 
            }

            if (!found) failedToFind.push(arg);
        });

        // store the changes
        handler.setCommandInfo(message.guild, command, commandInfo);

        // send a log of each invallid channel, this is probably because of a typo
        if (failedToFind.length > 0) {
            failedToFind.forEach(channel => {
                message.channel.send('Could not find a channel named ' + channel + '!');
            });

            // if they got any wrong, remind them it has to be exactly the same, as well that "none" removes restrictions
            message.channel.send(`Channels should be named exactly as they are on the left. If you want to remove channel restrictions, include "none" as a channel`);
        }
    }
}