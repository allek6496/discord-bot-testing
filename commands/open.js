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
            var announcements = await message.guild.channels.resolve(announcementsID);

            if (!announcements) {
                return message.channel.send('Something strange happpened! It appears you\'ve defined an announcement channel, but I can\'t find it! Please make sure your server is fully set up using the setup command before running this');
            }

            announcements.send('Attendance is open! React to this message with the check mark to mark your attendance and I\'ll dm you to confirm your sumbission! :slight_smile:')
            .then(async message => {
                //TODO: this might be broken
                message.react('✅');

                // await because this has to be finished before the loop starts, otherwise it won't find the meet we try to add to the user
                await handler.newMeet(message.guild.id, {messageID: message.id});

                //go through each channel, if it's a vc log each user in the vc into the meeting
                message.guild.channels.fetch()
                .then(channels => {
                    channels.forEach(channel => {
                        if (channel.type === 'GUILD_VOICE') {
                            for (const [memberID, member] of channel.members) {
                                console.log(member, "was present");
                                // Add the meet to this user. Can't add twice, no need to await cause it'll finish on it's own time
                                handler.addMeetByMessage(member.user.id, message.guild.id, message.id)
                            }
                        }
                    });
                }).catch(e => console.log(e));
            });

        } else {
            message.channel.send('There is no defined announcements channel! Please try running ~setup with option 2 to define this channel. :smile:');
        }
    }
}