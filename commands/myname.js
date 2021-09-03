const handler = require('../configHandler.js');

module.exports = {
    name: 'myname',
    aliases: ['name'],
    description: 'Check a user\'s name.',
    guildOnly: true,  
    usage: '<user> [leave blank for self]',
    hideHelp: false,

    async execute(message, args) {
        let userID;

        if (args.length == 0) { // self
            userID = message.author.id;

            let user = await handler.getUser(userID);
            let prefix = await handler.getGuildValue("prefix", message.guild);

            if (user) {
                message.author.send(`Your name is set as ${user.name}. If you would like this changed to a name you prefer, please contact an admin.`);
            } else {
                message.author.send(`We didn't find a user account for you! Create one using \`${prefix}verify <email address>\` to gain access to clubs and attendance!`);
            }
            
        } else if (message.member.permissionsIn(message.channel).has('ADMINISTRATOR')){
            // parse out just the snowflake from the arg
            userID = args[0].substring(3, args[0].length-1);

            let discordUser = message.client.users.resolve(userID);
            let user = await handler.getUser(userID);

            if (user && "name" in user) {
                message.author.send(`${discordUser.username}'s name is ${user.name}.`);
            } else if (user) {
                message.author.send(`An account was found, but no name has been set for ${discordUser.username}`);
            } else {
                message.author.send(`No account was found for ${discordUser.username}`);
            }
        } else {
            message.channel.send(`<@${message.author.id}> You can't use that command in this way!\nAs a member you may only view your own name.`);
            return;
        }
    }
}