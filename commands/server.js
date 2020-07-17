module.exports = {
    name: 'server',
    description: 'returns the name of the current server',

    /**
     * Returns the name of the current server, or guild, for tetsting purposes.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command.
     */
    execute(message, args) {
        message.channel.send(`The current server name is: ${message.guild.name}`);
    }
}