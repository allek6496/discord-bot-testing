const emailer = require('../emailHandler.js');

module.exports = {
    name: 'emailtest',
    description: 'Tests the email service, dev only.',
    args: false,
    guildOnly: false,  
    hideHelp: true,

    /**
     * Sends an email to kna1307@gmail.com (my personal email, won't be deleted after graduation)
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        if (emailer.sendEmail("Test", `Testing email sent by ${message.author.username}.`, "kna1307@gmail.com")) {
            message.reply("Sent sucessfully! :slight_smile:");
        } else {
            message.reply("There was an error! :sob:");
        }
    }
}