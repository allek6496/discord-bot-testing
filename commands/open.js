handler = require('../configHandler.js');

module.exports = {
    name: 'open',
    aliases: ['start', 'attendance'],
    description: 'Opens attendance for users in all voice channels',
    args: false,
    guildOnly: true,  
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    /**
     * Posts a message in the announcements channel and watches for reactions to it.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    async execute(message, args) {
        var announcementsID = await handler.getGuildValue('announcements', message.guild);

        // if there is an announcements channel to send the message in
        if (announcementsID) {
            var announcements = message.guild.channels.resolve(announcementsID);

            announcements.send('Attendance is open! React to this message with the check mark to mark your attendance and I\'ll dm you to confirm your sumbission! :slight_smile:')
            .then(async message => {
                message.react('✅');

                // await because this has to be finished before the loop starts, otherwise it won't find the meet we try to add to the user
                await handler.newMeet(message.guild.id, {messageID: message.id});

                //go through each channel, if it's a vc log each user in the vc into the meeting
                message.guild.channels.cache.forEach(channel => {
                    if (channel.type === 'voice') {
                        channel.members.forEach(member => {
                            // Add the meet to this user. Can't add twice, no need to await cause it'll finish on it's own time
                            handler.addMeetByMessage(member.user.id, message.guild.id, message.id)
                        });
                    }
                });
            });

        } else {
            message.channel.send('There is no defined announcements channel! Please try running ~setup with option 2 to define this channel. :smile:');
        }
    }
}