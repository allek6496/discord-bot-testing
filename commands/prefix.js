module.exports = {
    name: 'prefix',
    description: 'Allows an admin to change the prefix',
    args: true,
    usage: '<new prefix>',
    aliases: ['symbol'],
    guildOnly: true,
    permissions: "ADMINISTRATOR",

    /**
     * Allows changing the prefix of the bot on a specific server.
     * @param {Message} message The discord message object for the triggering event.
     * @param {string Array} args The list of words following the triggering command (prefix).
     */
    execute(message, args) {
        var handler = require('../configHandler');

        handler.setGuildValue('prefix', args[0], message.guild)
        // i'm not sure if u is necessary, but I just want a .then
        .then(u => {
            console.log(u);
            message.channel.send(`The prefix has been changed to ${args[0]}`);
        });
    }
}