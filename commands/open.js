handler = require('../configHandler.js');

module.exports = {
    name: 'open',
    aliases: ['start', 'attendance'],
    description: 'Opens attendance for users in all voice channels',
    args: false,
    guildOnly: false,  
    hideHelp: true,

    /**
     * Posts a message in the announcements channel and watches for reactions to it.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        var announcementsID = handler.getGuildValue('announcements', message.guild);

        // if there is an announcements channel to send the message in
        if (announcementsID) {
            var announcements = message.guild.channels.resolve(announcementsID);

            var meetings = handler.getGuildValue("meetings", message.guild);

            announcements.send('Attendance is open! React to this message with the check mark to mark your attendance and I\'ll dm you to confirm your sumbission! :slight_smile:')
            .then((message) => {
                message.react('✅');

                var meeting = {
                    active: true,
                    users: {
                        //user_id: false >> present, true >> confirmed
                    }
                }

                //go through each channel, if it's a vc log each user in the vc into the meeting
                message.guild.channels.cache.forEach(channel => {
                    if (channel.type === 'voice') {
                        channel.members.forEach(member => {
                            if (!meeting['users'].hasOwnProperty(member.id)) {
                                meeting['users'][member.id] = false;
                            }
                        });
                    }
                });

                meetings[message.id] = meeting;
                handler.setGuildValue('meetings', meetings, message.guild);
            });

        } else {
            message.channel.send('There is no defined announcements channel! Please try running ~setup with option 2 to define this channel. :smile:');
        }
    }
}