const handler = require('../configHandler.js');

module.exports = {
    name: 'attendance',
    aliases: ['att'],
    description: 'Check a user\'s verified attendance',
    guildOnly: true,  
    usage: '<user> [leave blank for self]',
    hideHelp: false,

    // countMeets(guild, UID) {
    //     const handler = require('../configHandler.js');


    // },

    execute(message, args) {
        let userID;

        if (args.length == 0) { // self
            userID = message.author.id;
        } else if (message.member.permissionsIn(message.channel).has('ADMINISTRATOR')){
            // parse out just the snowflake from the arg
            userID = args[0].substring(3, args[0].length-1);
        } else {
            message.channel.send(`<@${message.author.id}> You can't use that command in this way!\nAs a member you may only view your own attendance.`);
            return;
        }

        let user = handler.getUser(message.guild.id, userID);
        if (user) var meetCount = user.meets.length;
        else var meetCount = 0;

        // Enough participation
        if (meetCount >= 9) {
            if (user.name == "N/A") message.channel.send(`${message.client.users.resolve(userID).username} has been verified for ${meetCount} meets! This is enough to qualify for a club credit, but you're not done yet! I'm afraid I don't know your name! :slight_smile:\nPlease use the command \`${handler.getGuildValue("prefix", message.guild)}setname <your full name>\` to finish verifying your attendance. `);
            else message.channel.send(`${message.client.users.resolve(userID).username} has been verified for ${meetCount} meets. This is enough to qualify for a club credit! :clap:`);
        // nonzero participation
        } else if (meetCount) {
            if (user.name == "N/A") message.channel.send(`${message.client.users.resolve(userID).username} has been verified for ${meetCount} meets, but I'm afraid I don't know your name! :slight_smile:\nPlease use the command \`${handler.getGuildValue("prefix", message.guild)}setname <your full name>\` to finish verifying your attendance. `);
            else message.channel.send(`${message.client.users.resolve(userID).username} has been verified for ${meetCount} meets. This is sadly not enough for a club credit :sob:, but I hope you had fun! If you're returning to SJAM next year, please consider coming back to CS Club!`);
            
        } else {
            message.reply(`Sorry! I didn't find any meetings under this account. Assuming you came to at least one meeting, please claim this under your email address by running \`${handler.getGuildValue("prefix", message.guild)}claim <email address>\``);
        }

    }
 
    /**
     * Checks the attendance for a user, or one's self if no user is specified
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    /* This function is old. Rather than fixing it, it's been re-written for the 2020-2021 attendance claiming. Will have to chaing again
    execute(message, args) {
        const handler = require('../configHandler.js');

        if (args.length == 0) { // self
            userID = message.author.id;
        } else if (message.member.permissionsIn(message.channel).has('ADMINISTRATOR')){
            // parse out just the snowflake from the arg
            var userID = args[0].substring(3, args[0].length-1);
        } else {
            message.channel.send(`<@${message.author.id}> You can't use that command in this way!\nAs a member you may only view your own attendance.`);
            return;
        }

        // each meeting in meetings contains a bool "active" and a list of users with their level of verification
        var meetings = handler.getGuildValue('meetings', message.guild);

        var attended = {};
        
        var valid;
        var totalAttended = 0;
        var present = false;

        // if there's an active meeting
        var active = false;
        
        Object.keys(meetings).forEach(function(meetingID) {
            var meeting = meetings[meetingID];

            // if the user was present
            if (meeting.users.hasOwnProperty(userID)) {
                // store if they were present cause it matters for the future if block
                present = true;
                
                // only define valid once it's determined if the user was in this meeting, otherwise valid will be null
                valid = meeting.users[userID].valid
                
                if (meeting.users[userID].hasOwnProperty("channel")) {
                    var channel = meeting.users[userID].channel;
                } else {
                    var channel = false;
                }
                
                // if the user was verified
                if (valid) {
                    totalAttended++;

                    // if there's no connected channel, just log it as a channel with id "0": will always show as "deleted-channel"
                    if (!channel) {
                        if (attended.hasOwnProperty("0")) {
                            attended["0"]++;    
                        } else {
                            attended["0"] = 1;
                        }
                    // pull the id of the meeting's channel
                    } if (attended.hasOwnProperty(channel)) {
                        attended[channel]++;
                    } else {
                        attended[channel] = 1;
                    }
                }
            }

            // if the meeting is still active, tell them whether or not it has worked
            if (meeting.active) {
                active = true;
            } else {
                valid = false;
            }
        });

        // if there's an active meeting give information relative to that, otherwise give attendance history information
        if (active) {
            // present and verified
            if (valid) {
                message.channel.send(`<@${userID}> have successfully verified for this meeting!`);
            // not present
            } else if (!present) {
                message.channel.send(`<@${userID}> were not detected in a voice channel when attendance opened. If you've been present for a large portion of the meeting, or you believe an error has occured, please contact an exec.`);
            // present but not verified
            } else {
                message.channel.send(`<@${userID}> have not yet been verified for the current meeting, please react to the message in <#${handler.getGuildValue("announcements", message.guild)}>\nIf you've already done this and think there's been a mistake, please contact an exec`);
            } 
            message.channel.send(`If you'd rather view <@${userID}>'s attendance history, please wait until after the current meeting finishes.`);
        } else {
            message.channel.send(`<@${userID}> have sucessfully verified in ${totalAttended} meetings.\nPLEASE NOTE: THIS DOES NOT INCLUDE GOOGLE MEETS ATTENDANCE YET`);
        }
    }
    */
}