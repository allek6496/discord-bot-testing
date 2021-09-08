const handler = require('../../configHandler.js');

module.exports = {
    name: 'start',
    description: 'Begins a club session in a voice chat. Used for attendence.',
    args: true,
    usage: '<voice channel> <other voice channel> ...',
    guildOnly: true,
    hideHelp: false,

    /**
     * Starts a club session in a channel. Can have multiple active sessions in one guild.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command.
     */
    execute(message, args) {
        // go through each of the arguments one at a time
        while (args.length > 0) {
            var channel = args.shift();

            // attempt to find a channel matching the name given as the first item in args
            var correctChannel = message.guild.channels.cache.find(possible => possible.name.toLowerCase() === channel && possible.type === 'voice');
                
            // if it doesn't exist, let them know
            if (!correctChannel) {
                message.channel.send(`Could not find a voice channel named ${channel}`);
            } else {
                // get a list of all users currently in this vc
                var members = correctChannel.members;

                // fetch the object to store the logs in 
                var onStart = handler.getGuildValue('on_start', message.guild);

                const channelId = correctChannel.id;

                // it doesn't matter what was in here before, it needs to be empty
                onStart[channelId] = {}

                message.channel.send(`Starting a meeting in ${correctChannel}`);

                var date = new Date().getTime();

                // everyone "joins" at the same time
                members.forEach(member => {
                    onStart[channelId][member.id] = [date];
                });

                handler.setGuildValue('on_start', onStart, message.guild);
            }
        }
    },

    /**
     * Checks if they joined or left a chat with an active session, and if so, log the time they changed. To be run every time a user joins a vc
     * @param {GuildUser} user The GuildUser for the person that joined or left a voice chat
     */
    update(user, channel) {
        // retrieve the logs for this guild
        var onStart = handler.getGuildValue('on_start', user.guild);

        // if the channel requested has an entry in on_start 
        if (onStart.hasOwnProperty(channel.id)) {
            // get the time in milliseconds since long ago, to put into the object as a log
            var date = new Date().getTime();

            // if they already have an entry, add to that, otherwise make a new entry with just this time in it
            if (onStart[channel.id].hasOwnProperty(user.id)) {
                onStart[channel.id][user.id].push(date);
            } else {
                onStart[channel.id][user.id] = [date];
            }
        }

        // push the updated logs back to config
        handler.setGuildValue('on_start', onStart, user.guild);
    },

    clear(channel) {
        var onStart = handler.getGuildValue('on_start', channel.guild);

        if (onStart.hasOwnProperty(channel.id)) {
            delete onStart[channel.id];
            handler.setGuildValue('on_start', onStart, channel.guild);
        } else {
            console.log(`Failed to clear data ${channel.name} from ${channel.guild.name}`);
        }
    }
}