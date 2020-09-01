module.exports = {
    name: 'reload',
    description: 'Dev tool to reload and update a command',
    args: true,
    guildOnly: false,
    hideHelp: true,

    /**
     * Response whenever the bot is notified.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        // only allow the dev team to run this command
        
        //get the list of eligible devs based on their snowflakes (added by hand)
        const handler = require('../configHandler');
        var devs = handler.getConfigVar('devs');
        if (!devs.includes(message.author.id.toString())) {
            console.log(`${message.author.username} tried to run the reload command but lacked permission. Their id was ${message.author.id} but this doesn't match the eligible dev ids of ${devs}`);
            return;
        }

        const commandName = args[0].toLowerCase();
        const command = message.client.commands.get(commandName)
                        || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return message.channel.send(`Couldn't find command named ${commandName}`);

        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
            const newCommand = require(`./${command.name}.js`);
            message.client.commands.set(newCommand.name, newCommand);
            if (command.name != 'setup') message.channel.send(`Command ${command.name} was reloaded!`);
        } catch (error) {
            console.log(error);
            message.channel.send(`There was an error while reloading the command \`${command.name}\`, failed to fetch. \n\`${error.message}\``);
        }
    }
}