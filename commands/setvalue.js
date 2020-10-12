module.exports = {
    name: 'setvalue',
    description: 'Dev tool to manually set a guild value',
    args: true,
    guildOnly: false,
    usage: "<name> <value>",
    hideHelp: true,

    /**
     * Response whenever the bot is notified.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command.
     */
    execute(message, args) {
        const handler = require('../configHandler');

        // get the list of eligible devs based on their snowflakes (added by hand)
        var devs = handler.getConfigVar('devs');
        
        // only allow the dev team to run this command
        if (!devs.includes(message.author.id.toString())) {
            console.log(`${message.author.username} tried to run the reload command but lacked permission. Their id was ${message.author.id} but this doesn't match the eligible dev ids of ${devs}`);
            return;
        }

        handler.setGuildValue(args[0], args[1], message.guild);

        message.channel.send("Set the value!");
    }
}