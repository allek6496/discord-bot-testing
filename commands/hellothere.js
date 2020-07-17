module.exports = {
    name: 'hellothere',
    description: 'Responds to the user that @tted the bot',

    /**
     * Response whenever the bot is notified.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        message.channel.send(`Hello there ${message.author.username}`);
    }
}