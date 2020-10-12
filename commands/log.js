module.exports = {
    name: 'log',
    aliases: ['mark'],
    description: 'Manually marks a user\'s attendance for a specific meeting',
    args: true,
    guildOnly: true,  
    usage: '<user> <voice channel>',
    hideHelp: false,

    /**
     * Manually adds attendance for a specific user
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        const handler = require('../configHandler.js');
        var userID = args[0].substring(3, args[0].length-1);

        var meetings = handler.getGuildValue('meetings', message.guild);

        var channels = message.guild.channels.cache;
        var voiceChannel = null;

        channels.forEach(channel => {
            if (channel.name.includes(args[1])) {
                voiceChannel = channel;
            }
        });

        if (voiceChannel && meetings.hasOwnProperty(voiceChannel.id)) {
            meetings[voiceChannel.id]['users'][userID] = true;
            message.channel.send(`Logged <@!${userID}>'s attendance!`);
        } else {
            var found = false;
            for (var meeting in meetings) {
                if (meetings.hasOwnProperty(meeting) && !found) {
                    if (meetings[meeting].active) {
                        meetings[meeting]['users'][userID] = true;
                        message.channel.send(`Logged <@!${userID}>'s attendance!`);
                        found = true;
                    }
                }
            }
        }

        handler.setGuildValue('meetings', meetings, message.guild);
    }
}