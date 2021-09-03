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
        const user = handler.getUser(message.author.id);

        // if the user exists already
        if (user) {
            if ("email" in user) {
                // 

                user.name = args.join(' ');
                user.save().then(user => {
                    message.channel.send(`Great! I've updated your name to ${user.name}`);
                });
            }
        } else {
            // idk what this means, it's fine?
            message.channel.send(`Sorry! :confused:\nWe couldn't seem to find an entry for you yet! You may need to claim your attendance first using the command \`${handler.getGuildValue("prefix", message.guild)}claim <email-address>\``);
        }
        
    }
}