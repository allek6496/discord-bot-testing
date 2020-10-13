module.exports = {
    name: 'data',
    aliases: ['pull', 'json'],
    description: 'Pulls data from the json file for storage, dev only.',
    args: false,
    guildOnly: false,  
    hideHelp: true,

    /**
     * Prints the json data
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
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

        const config = require('../config.json');
        message.channel.send(config, {split: true});
    }
}