module.exports = {
    name: 'reload',
    description: 'Dev tool to reload and update a command',
    args: true,
    guildOnly: false,
    hideHelp: false,
    permissions: "DEV",

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

        // note that a command is never called if the user can't run it, so checks aren't neccecary. This is an edge case because this is a dev only command
        
        // attempt to find the command
        const commandName = args[0].toLowerCase();
        const command = message.client.commands.get(commandName)
                        || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        // if it doesn't exist, let them know and don't try to reload it
        if (!command) return message.channel.send(`Couldn't find command named ${commandName}`);

        // delete the cache for this command
        delete require.cache[require.resolve(`./${command.name}.js`)];

        // add the command back into the cache and add it back to the client
        try {
            const newCommand = require(`./${command.name}.js`);
            message.client.commands.set(newCommand.name, newCommand);
            message.channel.send(`Command ${command.name} was reloaded!`);

        // i'm not sure why this would happen, but just in case
        } catch (error) {
            console.log(error);
            message.channel.send(`There was an error while reloading the command \`${command.name}\`, failed to fetch. \n\`${error.message}\``);
        }
    }
}