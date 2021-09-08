module.exports = {
    name: 'log',
    aliases: ['mark'],
    description: 'Manually marks a user\'s attendance for a specific meeting. Note that this will only work if the active meeting opened today.',
    args: true,
    guildOnly: true,  
    usage: '<@user>',
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    /**
     * Manually adds attendance for a specific user
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    async execute(message, args) {
        const handler = require('../configHandler.js');
        var userID = args[0].substring(3, args[0].length-1);
        var user = await handler.getUser(userID);

        handler.getMeet(message.guild.id, {"date": Date.now()})
        .then(meet => {
            // It probably should be in there if they've asked to log in it
            if (meet && "announcementID" in meet) {
                if (user.meets.some(userMeet => userMeet.meet.announcementID == meet.announcementID)) {
                    return message.channel.send(`<@!${userID}> has already been verified for attendance!`);
                }

                handler.addMeetByMessage(userID, message.guild.id, meet.announcementID, true)
                .then(n => {
                    // the thing about whether or not they were detected was mostly a debugging thing, assuming (knock on wood) this works, this is enough.
                    message.channel.send(`Logged <@!${userID}>'s attendance!`);
                }).catch(e => console.log(e));
            } else {                                                                                                                  //code for I don't care to make that work so eat shit and die. yes i'm tired, no I won't go back and manually give one person attendance for one meeting in a club I'm barely affiliated with 
                message.channel.send(`Sorry! No meet was found on discord today. If the meet you're tyring to log for was before today, there's very little that can be done. Please log on the same day as the meeting.`)
            }
        }).catch(e => console.log(e));
    }
}