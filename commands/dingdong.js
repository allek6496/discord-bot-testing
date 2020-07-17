module.exports = {
    name: 'dingdong',
    description: 'dingdong',

    /**
     * A fun little command that responds with `ding dong` and bell emojis.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        message.channel.send('🔔 Ding Dong 🔔');
    }
}