module.exports = {
    name: 'log',
    aliases: ['mark'],
    description: 'Manually marks a user\'s attendance for a specific meeting',
    args: true,
    guildOnly: true,  
    usage: '<user> <voice channel>',
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    /**
     * Manually adds attendance for a specific user
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        const handler = require('../configHandler.js');
        var userID = args[0].substring(3, args[0].length-1);

        //TODO: bad
        var meetings = handler.getGuildValue('meets', message.guild);

        var channels = message.guild.channels.cache;
        var voiceChannel = null;

        var defaulted = null;
        channels.forEach(channel => {
            if (channel.name.includes(args[1])) {
                voiceChannel = channel;
                defaulted = false;
            } else if (channel.type == "voice" && defaulted !== false) {
                defaulted = true;
                voiceChannel = channel;
            }
        });

        Object.keys(meetings).forEach
        for (var meeting in meetings) {
            if (meetings.hasOwnProperty(meeting)) {
                if (meetings[meeting].active) {
                    if (meeting.hasOwnProperty(userID)) {
                        meetings[meeting]['users'][userID] = true;
                        message.channel.send(`Logged <@!${userID}>'s attendance!`);
                    } else {
                        if (voiceChannel) {
                            meeting['users'][userID] = {"valid": true, "channel": voiceChannel.id};
                            message.channel.send(`Logged <@!${userID}>'s attendance!\nThey were not detected in the call, logging anyway. :confused:`);
                        } else if (defaulted) {
                            meeting['users'][userID] = {"valid": true, "channel": voiceChannel.id};
                            message.channel.send(`Logged <@!${userID}>'s attendance!\nThey were not detected in the call, logging anyway. :confused:`);
                            message.channel.send(`No voice channel detected, set to <#${voiceChannel.id}>.`)
                        } else {
                            message.channel.send(`Could not locate a voice channel in this server, failed to log attendance`);
                        }
                    }
                    break;
                }
            }
        }
        

        handler.setGuildValue('meets', meetings, message.guild);
    }
}