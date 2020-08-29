module.exports = {
    name: 'setchannels',
    description: 'Adds a channel a command can be used in. If NONE is included, it will be set to be usable anywhere.',
    args: true,
    usage: '<channel1> <channel2>... ',
    aliases: ['setchannel'],
    guildOnly: true,

    /**
     * Adds a channel a command can be used in. If NONE is included, it will be set to be usable anywhere.
     * @param {Message} message The discord message object for the triggering event.
     * @param {string Array} args The list of words following the triggering command (prefix).
     */
    execute(message, args) {
        var handler = require('../configHandler');

        // use the handler to grab the current prefix
        var prefix = handler.getGuildValue('prefix', message.guild);
        
        // if they didn't provide arguments return an error, otherwise change the prefix to the first argument
        if (!args.length) {
            message.channel.send(`You have to provide a new prefix to use.\nFor example, say \`${prefix}prefix $\` if you wanted to change the prefix to $`);
        } else {
            handler.setGuildValue('prefix', args[0], message.guild);
            message.channel.send(`The prefix has been changed to ${args[0]}`)
        }
    }
}