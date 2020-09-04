const handler = require('../configHandler.js');

module.exports = {
    name: 'open',
    description: 'Opens the attendance window in a voice channel(but actually just checks who\'s in a call',
    args: true,
    usage: '<voice-channel>',
    guildOnly: true,
    hideHelp: false,

    /**
     * Will open the attendance window, but for now just checks who's in the discord call.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command used as arguments
     */
    execute(message, args) {

        //unfinished
        
        var channel = args.shift();

        var correctChannel = message.guild.channels.cache.find(possible => possible.name === channel);

        if (!correctChannel) {
            message.channel.send(`Could not find a channel named ${channel}`);
        } else if (correctChannel.type != 'voice') {
            message.channel.send(`${channel} is not a voice channel. Please specify a voice channel to open attendance in.`)
        } else {
            var members = correctChannel.members;

            message.channel.send(`Here's a list of members in ${channel}: `);
            members.forEach(member => {
                message.channel.send(`> ${member.user.username}`);
            });
        }
    }
}