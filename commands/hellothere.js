module.exports = {
    name: 'hellothere',
    description: 'Responds to the user that @tted the bot',
    args: false,
    guildOnly: false,
    hideHelp: true,

    /**
     * Response whenever the bot is notified.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        const handler = require('../configHandler.js')

        message.channel.send(`Hello ${message.author}, if you're confused how to use me, try typing ${handler.getValue('prefix')}help! :bell:`);
    }
}