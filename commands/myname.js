const handler = require('../configHandler.js');

module.exports = {
    name: 'myname',
    aliases: ['name'],
    description: 'Check a user\'s name.',
    guildOnly: true,  
    usage: '<user> [leave blank for self]',
    hideHelp: false,

    execute(message, args) {
        let userID;

        if (args.length == 0) { // self
            userID = message.author.id;

            let user = handler.getUser(message.guild.id, userID);

            if (user) {
                message.author.send(`Your name in ${message.guild.name} is ${user.name}`);
            } else {
                message.author.send(`We didn't find a user account in ${message.guild.name} for you! If you attended meetings this year, please claim them using \`${handler.getGuildValue("prefix", message.guild)}claim <email address>\``);
            }
            
        } else if (message.member.permissionsIn(message.channel).has('ADMINISTRATOR')){
            // parse out just the snowflake from the arg
            userID = args[0].substring(3, args[0].length-1);

            let user = handler.getUser(message.guild.id, userID);

            if (user) {
                message.author.send(`${message.client.users.resolve(userID).username}'s real name is ${user.name}.`);
            } else {
                message.author.send(`No account was found for ${message.client.users.resolve(userID).username}`);
            }
        } else {
            message.channel.send(`<@${message.author.id}> You can't use that command in this way!\nAs a member you may only view your own name.`);
            return;
        }


    }
 
}