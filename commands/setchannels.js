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

        var failedToFind = [];

        args.array.forEach(channel => {
            const channels = message.guild.channels;
    
            var correctChannel = channels.find(element => element.name == channel);
    
            if (correctChannel) {
                var commandInfo = handler.getCommandInfo(message.guild, command);
                if (!commandInfo["channels"]) commandInfo["channels"].push(correctChannel);
            } else {
                failedToFind.push(channel);
            }
        });
    }
}