const handler = require('../configHandler');
const updater = require('../functions/updateNick.js');

module.exports = {
    name: 'setname',
    description: 'Sets your name. Only usable after verification, and only settable once. Contact a dev to have it changed. Please use the name tied to your wrdsb account.',
    args: true,
    guildOnly: false,  
    usage: '<first> <last>',
    hideHelp: false,

    async execute(message, args) {
        const user = await handler.getUser(message.author.id);
        const prefix = await handler.getGuildValue("prefix", message.guild);

        // if the user exists already
        if (user) {
            if ("email" in user && (!("name" in user) || user.name == "N/A" || !user.name) ) {
                // make sure that the name matches the email saved. If they have a preferred name, for security purposes they'll have to contact a dev to change it

                let name = args[0] + ' ' + args[1];

                let usernameChunk = user.email.split('@')[0];
                let nameChunk = usernameChunk.substring(0, usernameChunk.length-4);

                let lastChunk = nameChunk.substring(0, nameChunk.length-1);
                let firstChunk = nameChunk[nameChunk.length-1];
                
                // console.log(firstChunk + " " + lastChunk + " " + name);

                if (name[0].toLowerCase() == firstChunk && name.toLowerCase().includes(lastChunk)) {
                    user.name = args.join(' ');
                    user.save().then(user => {
                        message.channel.send(`Great! I've updated your name to ${user.name}`);

                        // for each guild
                        message.client.guilds.fetch()
                        .then(OAuthGuilds => {
                            for (let [guildID, OAuthGuild] of OAuthGuilds) {
                                // delete their roles in this guild
                                OAuthGuild.fetch()
                                .then(guild => {
                                    guild.members.fetch(message.author.id)
                                    .then(member => {
                                        if (member) {
                                            handler.getGuildValue("new", guild)
                                            .then(newRole => {
                                                if (newRole) {
                                                    member.roles.remove(newRole)
                                                    .catch(e => console.log(`Error taking "new" role from user\n${e}`));
                                                }
                                            });
                                            
                                            handler.getGuildValue("member", guild)
                                            .then(memberRole => {
                                                if(memberRole) {
                                                    member.roles.add(memberRole)
                                                    .catch(e => console.log(`Error giving member role to user\n${e}`));
                                                }
                                            });
                                        }
                                    // no error message, this usually fails
                                    }).catch(e => {return;});

                                    // add any unclaimed meets to their account                            
                                    handler.getGuildValue("unclaimed", message.guild)
                                    .then(unclaimed => {
                                        let meetList = unclaimed.find((entry) => 
                                        entry.email == user.email || entry.name.toLowerCase() == name);
                                        
                                        if (meetList) {
                                            meetList.meets.forEach(meet => {
                                                if ("announcementID" in meet) {
                                                    handler.addMeetByMessage(user.id, guild.id, meet.announcementID)
                                                } else {
                                                    // It should always have either a message or a date
                                                    handler.addMeetByDate(user.id, guild.id, meet.date);
                                                }
                                            });
                                        }
                                    }).catch(e => console.log(`Error giving unclaimed meets to ${message.author.nickname}`));
                                }).catch(e => console.log(`Error fetching guild during setname\n${e}`));
                            }
                        }).catch(e => console.log(`Error fixing user roles\n${e}`));
                    });
                } else {
                    message.channel.send(`That name doesn't seem to match your email address! Please use the name coresponding to your wrdsb email for setup. If you'd rather be called by another name, for security please contact a dev using the command \`${prefix}contact <message>\``)
                }
            
            // if they have an email and a name
            } else if ("email" in user) {
                message.channel.send(`You've already set up your name! If you'd like to have it changed please contact a dev using \`${prefix}contact <message>\`. Otherwise, you're good to go!`);
            } else {
                // There should never be a user without an email.
                message.channel.send(`Sorry! Something went wrong :confused:`);
                console.log(user);
            }
        } else {
            // idk what this means, it's fine?
            message.channel.send(`Sorry! :confused:\nI don't have an account set up for you yet! Please make one first using the command \`${prefix}verify <email-address>\``);
        }
    }
}