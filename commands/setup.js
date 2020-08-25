// newCommand: {guildID: false, userID: false, commandName: false, step: 1},
var commandProgress = {
    ongoingCommands: []
}

const { Permissions } = require('discord.js');
const handler = require('../configHandler.js');

module.exports = {
    name: 'setup',
    description: 'Helps the user set up the bot and their server',
    args: false,
    guildOnly: true,
    usage: '<args>',
    
    execute(message, args) {
        // check if this person already has progress through the message chain
        var call = commandProgress.ongoingCommands.find(call => (call.guildID === message.guild.ID && 
                                                             call.userID === message.author.ID));
        
        const prefix = handler.getGuildValue('prefix', message.guild);
        if (call) {
            const steps = [this.step1, this.step2, this.step3, this.lastStep];

            steps[call.step](message, args, prefix);

            commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step++;

        } else {
            commandProgress.ongoingCommands.push({
                guildID: message.guild.ID,
                userID: message.author.ID,
                step: 0
            });

            message.channel.send(`You are beginning to set up your server, please enter the same command to confirm your decision. \nYou can undo most of the changes with ${prefix}cleanup, but @everyone role permissions, as well as some other settings, will stay chaged even after running the cleanup command. Only do this if you are absolutely sure this is what you want to do (it is recomended not to run this command on a server that is already established)`);
        }
    },

    step1(message, args, prefix) {
        message.channel.send(`You are beginning setup for ${message.guild.name}, please select which option you prefer by typing \`${prefix}setup <choice #>\`\n> 1: Quickly set up the whole server for me! (It is reccomended to use this on a fresh and unchanged server)\n> 2: Just tell me what I should do and I'll do it myself.`);
    },

    async step2(message, args, prefix) {
        switch (args[0]) {
            case '1':
                // ------------------------- remove default abillity to read messages from @everyone
                const everyonePermissions = new Permissions(67174464); // nickname, history and reactions
                message.guild.roles.everyone.setPermissions(everyonePermissions);

                // ------------------------- create a role for admin users
                message.guild.roles.create({
                    data: {
                        name: 'exec',
                        color: 'GREEN',
                        hoist: true,
                        position: 0,
                        mentionable: true
                    },
                    reason: 'Create a role for un-verified users, to prevent spam'
                })
                .then(role => {
                    const adminPermissions = new Permissions('ADMINISTRATOR');
                    role.setPermissions(adminPermissions);
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}`);
                });

                
                // ------------------------- create a role for members
                message.guild.roles.create({
                    data: {
                        name: 'member',
                        color: 'GRAY',
                        position: 10,
                        mentionable: true
                    },
                    reason: 'Create a role for verified users, allowing them to message'
                })
                .then(role => {
                    const permissions = new Permissions(103926849);
                    role.setPermissions(permissions);
                    
                    var i = 0;
                    message.guild.members.cache.forEach(member => {
                        try {
                            member.roles.add(role);
                        } catch (e) {
                            i++;
                        }
                    });
                    console.log(`Failed to write roles to ${i} user(s)`);
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}\``);
                });
                
                // ------------------------- create a role for new users
                var newRole;
                await message.guild.roles.create({
                    data: {
                        name: 'new',
                        color: 'RED',
                        hoist: true,
                        position: 0,
                        mentionable: true
                    },
                    reason: 'Create a role for un-verified users, to prevent spam'
                })
                .then(role => {
                    role.setPermissions(new Permissions(0)); // no permissions
                    newRole = role;
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}`);
                });
                
                // ------------------------- create a category for the new channels
                var newChannels;
                await message.guild.channels.create(
                    'Created Channels',
                    {
                        type: 'category'
                    }
                    )
                    .then(channel => {
                        newChannels = channel;
                    })
                    .catch(error => {
                        console.log(error);
                        message.channel.send(`An error occurred!\n\`${error.message}`);
                    });

                // ------------------------- create a channel for bot commands
                message.guild.channels.create(
                    'bot-spam', 
                    {
                        type: 'text',
                    }
                )
                .then(channel => {
                    channel.setParent(newChannels);
                    handler.setGuildValue('bot_spam', channel.id, message.guild);
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}\``);
                });
                
                // ------------------------- create a channel for the new users
                message.guild.channels.create(
                    'new-members', 
                    {
                        type: 'text',
                        permissionOverwrites: [
                            {
                                id: message.guild.id,
                                deny: ['VIEW_CHANNEL']
                            },
                            {
                                id: newRole,
                                allow: [
                                    'VIEW_CHANNEL',
                                    'SEND_MESSAGES',
                                    'ADD_REACTIONS',
                                    'READ_MESSAGE_HISTORY'
                                ]  
                            }
                        ]
                    }
                )
                .then(channel => {
                    channel.setParent(newChannels);
                    handler.setGuildValue('new_members', channel.id, message.guild);
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}\``);
                });

                // ------------------------- create a channel for announcements
                message.guild.channels.create(
                    'announcements', 
                    {
                        type: 'text',
                        permissionOverwrites: [
                            {
                                id: message.guild.id,
                                deny: ['SEND_MESSAGES']
                            },
                        ]
                    }
                )
                .then(channel => {
                    channel.setParent(newChannels);
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}\``);
                });

                // ------------------------- create a channel for only moderation messages
                message.guild.channels.create(
                    'moderation', 
                    {
                        type: 'text',
                    }
                )
                .then(channel => {
                    channel.setParent(newChannels);
                    handler.setGuildValue('moderation', channel.id, message.guild);
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}\``);
                });

                message.channel.send(`Great! Step one done :smile:\nI created a few channels for you in the 'Created Channels' section, feel free to order them however you wish.\nThere is also a new role called @exec, please give this role to everyone you wish to have administrator permissions. You can do this by right clicking on their name, going down to 'Roles' and clicking the checkbox next to'exec'. `)
                message.channel.send(`Type \`${prefix}setup\` again to continue to the next step after you've done this`)
                break;

            case '2':
                message.channel.send(`
                - Step #1:\n
                > Create all of the channels that you wish to use in your server. Some examples are: An announcement channel, a general channel or a bot spam channel.\n
                - Step #2:\n
                > Create a role for members as well as a role for the execs on your team. Execs should have administrator permissions, and just leave the members role as default. Everyone in the server right now should have one of these roles, do that before continuing.\n
                - Step #3:\n
                > Change the everyone permission to only allow them to react and change their nickname, read message history and add reactions. Everything else should be unchecked. This will allow you to restrict some people from viewing channels.\n
                - Step #4:\n
                > Create a role for new members with everything unchecked. And a new channel named \`new-members\`. Change the permissions on this to prevent members from viewing the channel, and allowing the new members role to view it as well as message in it.\n
                - Step #5:\n
                > Make sure to go back and change any permissions on other channels you’ve made, for example, preventing members from sending in the announcements channel.\n
                - Step #6:\n
                > You’re done! Now you can run ${prefix}setup again to activate spam protection on your server! :partying_face:\n                
                `, {split: true});
                break;

            default:
                message.channel.send('Please respond with a number 1 or 2 representing your choice for how to set up the server!');
                
                // prevent the command from progressing
                var call = commandProgress.ongoingCommands.find(call => (call.guildID === message.guild.ID && 
                                                                         call.userID === message.author.ID));
                
                if (call) commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step--;

                break;
        }
    },

    step3(message, args, prefix) {
        const guild = message.guild;
        const new_members = handler.getGuildValue('new_members', guild);
        const moderation = handler.getGuildValue('moderation', guild);
        const bot_spam = handler.getGuildValue('bot_spam', guild);
        const reqInfo = [['new_members', new_members], ['moderation', moderation], ['bot_spam', bot_spam]];

        for (required of reqInfo) {
            if (!required[1]) {
                switch (required[0]) {
                    case 'new_members':
                        message.channel.send(`Please send the name of the channel you would like to use for new members by using the command \`${prefix}setup <channel-name>\`.  \:)`);
                        break;
                
                    case 'moderation':
                        message.channel.send(`Please send the name of the channel you would like to use for moderation messages by using the command \`${prefix}setup <channel-name>\`.`);
                        break;

                    case 'bot_spam':
                        message.channel.send(`Please send the name of the channel you would like to use for bot command messages by using the command \`${prefix}setup <channel-name>\`.`);
                        break;

                    default:
                        break;
                }
                handler.setGuildValue(required[0], true, guild);
                break;
            } else if (required[1] === true) {
                if (!args) {
                    message.channel.send(`Please respond with the name of a channel on this server in the form \`${prefix}setup <channel-name>`);
                } else {
                    var channel = message.guild.channels.fetch(args[0])
                    .then(channel => {
                        if (channel) {
                            handler.setGuildValue(required[0], channel.id, guild);
                        } else {
                            message.channel.send(`Failed to find channel named ${args[0]}, try again please. You may need to change the channel name, this is totally fine just respond with \`${prefix}setup <channel_name>\`.`);
                        }
                    })
                    .error(e => {
                        console.log(e);
                        message.channel.send('An error occured while trying to fetch that channel, please try again');
                    });
                }
                break;
            } else if (typeof required[1] === 'string') {
                continue;
            }
        }

        if (!reqInfo.filter(channel => typeof channel[1] !== 'string').length) {
            message.channel.send(`Perfect! All channels have been saved. Please continue to the next step by typing ${prefix}setup`);
        } else {
            // prevent the command from progressing
            var call = commandProgress.ongoingCommands.find(call => (call.guildID === guild && 
                call.userID === message.author.ID));

            if (call) commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step--;
        }
    },

    lastStep(message, args, prefix) {
        message.channel.send(`Wonderful! :tada: \nYou have completed setup of your server! Go and have some fun!`);

        const reload = require('./reload.js');
        reload.execute(message, ['setup']);
    }
}