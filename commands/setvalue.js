module.exports = {
    name: 'setvalue',
    description: 'Dev tool to manually set a guild value',
    args: true,
    guildOnly: true,
    usage: "<name> <value>",
    hideHelp: false,
    permissions: "DEV",

    /**
     * Response whenever the bot is notified.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command.
     */
    execute(message, args) {
        const handler = require('../configHandler');

        handler.setGuildValue(args[0], args[1], message.guild);

        message.channel.send("Set the value!");
    }
}