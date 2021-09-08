module.exports = {
    name: 'invite',
    aliases: ['link'],
    description: 'Sends the link to invite the bot to another server.',
    args: false,
    hideHelp: false,
 
    /**
     * Manually adds attendance for a specific user
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    async execute(message, args) {
        message.channel.send("https://discord.com/oauth2/authorize?client_id=730835597429571584&scope=bot&permissions=8")
    }
}