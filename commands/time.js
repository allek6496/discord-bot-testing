const handler = require('../configHandler.js');

module.exports = {
    name: 'time',
    description: 'Checks how long a user has been in a meeting since starting.',
    args: false,
    guildOnly: true,
    hideHelp: false,

    /**
     * Checks how long a user has been in active meetings for.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command used as arguments
     */
    execute(message, args) {
        const channelHandler = message.guild.channels;

        // fetch the times from this user
        const times = this.evaluate(message.member);

        var reply = [];
        
        // for each entry, if they were in the meeting for more than a minute, say how many minutes they were there for
        for (var channel in times) {
            // if (times[channel] < 60000) continue;
            console.log(reply.push(`> ${channelHandler.resolve(channel)}: ${Math.round(times[channel]/60000)} minutes`));
        }

        // if there's no data for their times, they haven't been in any meetings
        if (!reply.length) {
            message.reply(`You have not been in any meetings.`);
        } else {
            message.reply(`This is a list of meetings you have joined and how long you were in them for:`);
            message.channel.send(reply, {split: true});
        }
    },

    /**
     * Returns an object with each active meeting, and the time this user spent in each.
     * @param {GuildUser} member The guild user object for the person in question
     */
    evaluate(member) {
        
        var on_start = handler.getGuildValue('on_start', member.guild);
        
        // they can have several times, a different number for each channel.
        var times = {}
        const currentTime = new Date().getTime();
        
        // if there's no data at all (no meetings happening anywhere) we know there must be no time at all
        if (on_start) {
            for (var channelID in on_start) {
                var channel = on_start[channelID];

                // if this user has spent time in this channel
                if(channel.hasOwnProperty(member.id)) {
                    // if they joined and haven't left yet, assume for timing they just left
                    if (channel[member.id].length % 2 === 1) times[channelID] = currentTime;
                    else times[channelID] = 0;
                    
                    // start out with the current time, and alternate subtracting and adding to get the total time spent in the call
                    var mod = -1;
                    channel[member.id].forEach(log => {
                        times[channelID] += log*mod 
                        mod *= -1;
                    });
                    console.log(`${member.user.username} is being evaluated: ${channelID} for ${times[channelID]} ms`);
                }
            }
        }

        return times;
    }
}