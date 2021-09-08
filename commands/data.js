module.exports = {
    name: 'data',
    aliases: ['pull', 'json'],
    description: 'Pulls data from the json file for storage, dev only.',
    args: false,
    guildOnly: false,  
    hideHelp: false,
    permissions: "DEV",

    /**
     * Prints the json data
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        const config = require('../config.json');
        message.channel.send(JSON.stringify(config));
    }
}