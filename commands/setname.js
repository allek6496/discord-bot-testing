const handler = require('../configHandler')

module.exports = {
    name: 'setname',
    description: 'Sets your name if it isn\'t already available. Please use your real name, using a fake or joke name can result in loss of attendance. This can only be added once, and cannot be changed! :neutral_face:',
    args: true,
    guildOnly: true,  
    usage: '<your full name>',
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    execute(message, args) {
        const user = handler.getUser(message.guild.id, message.author.id);

        // if the user exists already
        if (user) {
            if (user.name == "N/A") {
                user.name = args.join(' ');
                message.channel.send(`Great! I've updated your name to ${user.name}`);
                handler.setUser(message.guild.id, message.author.id, user.name, user.email, user.meets);
            }
        } else {
            //TODO: Change this lol
            message.channel.send(`Sorry! :confused:\nWe couldn't seem to find an entry for you yet! You may need to claim your attendance first using the command \`${handler.getGuildValue("prefix", message.guild)}claim <email-address>\``);
        }
        
    }
}