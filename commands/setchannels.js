module.exports = {
    name: 'setchannels',
    description: 'Adds a channel a command can be used in. If NONE is included, it will be set to be usable anywhere.',
    args: true,
    usage: '<command> <channel1> <channel2>... ',
    aliases: ['setchannel'],
    guildOnly: true,

    /**
     * Adds a channel a command can be used in. If NONE is included, it will be set to be usable anywhere.
     * @param {Message} message The discord message object for the triggering event.
     * @param {string Array} args The list of words following the triggering command (prefix).
     */
    execute(message, args) {
        const handler = require('../configHandler');
        
        const command = args.shift();
        var commandInfo = handler.getCommandInfo(message.guild, command);

        if (!commandInfo) {
            commandInfo = {'channels': []};
        }

        var failedToFind = [];

        args.forEach(channel => {
            const channels = message.guild.channels;
    
            var correctChannel = channels.cache.find(element => element.name == channel).id;
    
            if (correctChannel) {
                if (commandInfo && commandInfo['channels']) commandInfo['channels'].push(correctChannel);
                else if (commandInfo) commandInfo['channels'] = [correctChannel];

            } else {
                failedToFind.push(channel);
            }
        });

        handler.setCommandInfo(message.guild, command, commandInfo);

        if (failedToFind) {
            failedToFind.forEach(channel => {
                message.channel.send('Could not find a channel named ' + channel + ' !');
            });
        }
    }
}