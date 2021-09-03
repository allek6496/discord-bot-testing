module.exports = {
    name: 'close',
    aliases: ['finish'],
    description: 'Closes all meetings in a server, preventing further entries.',
    args: false,
    guildOnly: true,  
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    /**
     * Closes attendance by deleting the messsage and marking the meeting as no longer active.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    async execute(message, args) {
        const handler = require("../configHandler.js");

        var meetings = await handler.getGuildValue('meets', message.guild);

        // if there's an announcements channel, the attendance message will be there
        var announcementID = await handler.getGuildValue('announcements', message.guild);
        if (announcementID) {
            // fetch the announcements channel
            var channel = message.guild.channels.resolve(announcementID)

            // go through each active meeting
            meetings.forEach(meeting => {
                // if it's active it shouldn't be and delete the message
                if (meeting.active) {
                    meeting.active = false;

                    if ("announcementID" in meeting) {
                        channel.messages.fetch(meeting.announcementID)
                        .then(message => {
                            message.delete()
                            .catch(e => console.log(`Error deleting attendance message in ${message.guild.name}. Could have been deleted already.`));
                        });
                    }
                }
            });

            message.channel.send('Meetings closed! :octagonal_sign:');
            handler.setGuildValue('meets', meetings, message.guild);
        } else {
            message.channel.send('There is no defined announcements channel! Please try running ~setup with option 2 to define this channel. :smile:');
        }
    }
}