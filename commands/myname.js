const handler = require('../configHandler.js');

//TODO: merge myname and attendance into one "account" command that gives all needed info about a user
module.exports = {
    name: 'myname',
    aliases: ['name', 'account'],
    description: 'Check a user\'s name.',
    guildOnly: true,  
    usage: '<@user> [leave blank for self]',
    hideHelp: false,

    async execute(message, args) {
        let userID;

        if (args.length == 0) { // self
            userID = message.author.id;

            let user = await handler.getUser(userID);
            let prefix = await handler.getGuildValue("prefix", message.guild);

            if (user && "name" in user && "email" in user) {
                message.author.send(`Your name is set as ${user.name}, and email as ${user.email}. If you would like your named to be changed to a name you prefer, please contact a dev using \`${prefix}contact <message>\`.`);
            } else if (user && "email" in user) {
                message.author.send(`Your email is set as ${user.email}. Please add your name to complete the setup process using the command \`${prefix}setname <first> <last>\`.`);
            } else if (!user) {
                message.author.send(`We didn't find a user account for you! Create one using \`${prefix}verify <email address>\` to gain access to clubs and attendance!`);
            // shouldn't ever be here
            } else {
                message.author.send(`Whoops! Something went wrong.`);
                console.log(`Strange user state:\n${user}`);
            }
        } else if (message.member.permissionsIn(message.channel).has('ADMINISTRATOR')){
            // parse out just the snowflake from the arg
            userID = args[0].substring(3, args[0].length-1);

            let discordUser = message.client.users.resolve(userID);

            if (!discordUser) {
                message.channel.send("Please @ the user you would like to find the name of! This didn't work.")
            }

            let user = await handler.getUser(userID);

            // I don't think it's the best idea to give email to every admin, but it's still important to remove anonymity to prevent trolling and cyberbullying
            if (user && "name" in user) {
                message.author.send(`${discordUser.username}'s name is ${user.name}.`);
            } else if (user) {
                message.author.send(`An account was found , but no name has been set for ${discordUser.username}`);
            } else {
                message.author.send(`No account was found for ${discordUser.username}`);
            }
        } else {
            message.channel.send(`<@${message.author.id}> You can't use that command in this way!\nAs a member you may only view your own name.`);
            return;
        }
    }
}