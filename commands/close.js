module.exports = {
    name: 'close',
    aliases: ['finish'],
    description: 'Closes all meetings in a server, preventing further entries.',
    args: false,
    guildOnly: true,  
    hideHelp: false,

    /**
     * Closes attendance by deleting the messsage and marking the meeting as no longer active.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        const handler = require("../configHandler.js");

        var meetings = handler.getGuildValue('meetings', message.guild);

        // if there's an announcements channel, the attendance message will be there
        var announcementID = handler.getGuildValue('announcements', message.guild);
        if (announcementID) {
            // fetch the announcements channel
            var channel = message.guild.channels.resolve(announcementID)
            // go through each active meeting
            for (var meeting in meetings) {
                if (meetings.hasOwnProperty(meeting)) {
                    // if it's active it shouldn't be and delete the message
                    if (meetings[meeting].active) {
                        meetings[meeting].active = false;

                        channel.messages.fetch(meeting)
                        .then(message => {
                            message.delete()
                            .catch(e => console.log(`Error deleting attendance message in ${message.guild.name}. Could have been deleted already.`));
                        });
                    }
                }
            }

            message.channel.send('Meetings closed! :octagonal_sign:');
            handler.setGuildValue('meetings', meetings, message.guild);
        } else {
            message.channel.send('There is no defined announcements channel! Please try running ~setup with option 2 to define this channel. :smile:');
        }
    }
}