const handler = require('../configHandler.js');

module.exports = {
    name: 'time',
    description: 'Checks how long a user has been in a meeting before.',
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
        const times = this.evaluate(message.author);

        message.author.reply(`This is a list of meetings you have joined and how long you were in them for:`);

        // for each entry, if they were in the meeting for more than a minute, say how many minutes they were there for
        for (var channel in times) {
            if (times[channel] < 60000) continue;
            message.channel.send(`> ${channelHandler.resolve(channel)}: ${Math.round(times[channel]/60000)} minutes`)
        }
    },

    /**
     * Returns an object with each active meeting, and the time this user spent in each.
     * @param {GuildUser} user The guild user object for the person in question
     */
    evaluate(user) {
        var on_start = handler.getGuildValue('on_start', user.guild);

        // they can have several times, a different number for each channel.
        var times = {}
        const currentTime = new Date().getTime();

        on_start.forEach(channel => {
            // if this user has spent time in this channel
            if(channel.hasOwnProperty(user.id)) {

                // if they joined and haven't left yet, assume for timing they just left
                if (channel[user.id].length % 2 == 1) times[channel] = currentTime;

                // start out with the current time, and alternate subtracting and adding to get the total time spent in the call
                var mod = -1;
                channel.user.id.forEach(log => {
                    times[channel] += log*mod
                    mod *= -1;
                });
            }
        });

        return times;
    }
}