module.exports = {
    name: 'contact',
    aliases: ['report'],
    description: 'Send a message to the dev team (Kegan)',
    args: true,
    guildOnly: false,  
    usage: '<message>',
    hideHelp: false,

    /**
     * Allows users and execs to send issues/requests to me
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        let note = args.join(' ');

        // TODO: make this work with other people?

        message.client.users.fetch('552890476089573396')
        .then(user => {
            user.send(`MESSAGE FROM ${message.author.name} in ${message.guild.name}:\n\`${note}\``);
            message.channel.send("Sent!");
        })
    }
}