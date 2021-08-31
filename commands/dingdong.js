module.exports = {
    name: '🔔',
    description: 'dingdong',
    args: false,
    guildOnly: false,  
    hideHelp: true,

    /**
     * A fun little command that responds with `ding dong` and bell emojis.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        message.channel.send(':bell: Ding Dong :bell:');
    }
}