module.exports = {
    name: 'setchannels',
    description: 'Adds a channel a command can be used in. If NONE is included, it will be set to be usable anywhere.',
    args: true,
    usage: '<command> <channel1> <channel2>... ',
    aliases: ['setchannel'],
    guildOnly: true,
    permissions: "ADMINISTRATOR",

    /**
     * Adds a channel a command can be used in. If 'NONE' is included, it will be set to be usable anywhere.
     * @param {Message} message The discord message object for the triggering event.
     * @param {string Array} args The list of words following the triggering command (prefix).
     */
    execute(message, args) {
        const handler = require('../configHandler');
        
        const command = args.shift();
        var commandInfo = handler.getCommandInfo(message.guild, message.client, command);

        // all commands have command info (often blank), so if it failed to find, don't create new command info for it
        if (commandInfo === null) {
            message.channel.send(`That is not a valid command! To find a list of valid commands, type \`${handler.getGuildValue('prefix', message.guild)}help\``)
            return;
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
        args.forEach(channel => {
            const channels = message.guild.channels;
    
            // attempt to find the channel
            var correctChannel = channels.cache.find(element => element.name == channel);
    
            // if it exists, add the channel to be required for this command (creating the channels requirement if it doesn't exist)
            if (correctChannel) {
                if (commandInfo.hasOwnProperty('channels')) {
                    if (!commandInfo['channels'].includes(correctChannel.id)) {
                        commandInfo['channels'].push(correctChannel.id);
                    }
                } else commandInfo['channels'] = [correctChannel.id];

                message.channel.send(`Restricted ${command} to ${correctChannel}.`);
            } else {
                failedToFind.push(channel);
            }
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