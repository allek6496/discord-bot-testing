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
        
        const prefix = handler.getValue('prefix', message.guild);
        if (call) {
            const steps = [this.step1, this.step2];

            steps[call.step](message, args, prefix);

            commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step++;

        } else {
            commandProgress.ongoingCommands.push({
                guildID: message.guild.ID,
                userID: message.author.ID,
                step: 0
            });

            message.channel.send(`You are beginning to set up your server, please enter the same command to confirm your decision. \nYou can undo most of the changes with ${prefix}cleanup, but @everyone role permissions, as well as some other settings, will stay chaged even after running the cleanup command. Only do this if you are absolutely sure this is what you want to do (it is recomended not to run this command on a server that is already set up)`);
        }
    },

    step1(message, args, prefix) {
        message.channel.send(`You are beginning setup for ${message.guild.name}, please select which option you prefer by typing \`${prefix}setup <choice #>\`\n> 1: Use all the defaults and quickly set up the whole server for me! (please use this on a fresh and unchanged server)\n> 2: Walk me through the process, asking for input on how I want the server built.\n> 3: Just tell me what I should do and I'll do it myself.`);
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
                })
                .catch(error => {
                    console.log(error);
                    message.channel.send(`An error occurred!\n\`${error.message}\``);
                });

                message.channel.send(`Great! Step one done :smile:\nI created a few channels for you in the 'Created Channels' section, feel free to order them however you wish.\nThere is also a new role called @exec, please give this role to everyone you wish to have administrator permissions. You can do this by right clicking on their name, going down to 'Roles' and clicking 'exec'. `)
                message.channel.send(`Type ${prefix}setup again to continue to the next step after you've done this`)
                break;
            
            case '2':
                //This is probably the harder part
                break;

            case '3':
                //TODO: Write instructions to set up the server
                break;

            default:
                message.channel.send('Please respond with a number 1, 2 or 3 representing your choice for how to set up the server!');
                var call = commandProgress.ongoingCommands.find(call => (call.guildID === message.guild.ID && 
                                                                         call.userID === message.author.ID));
                
                if (call) commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step--;

                break;
        }
    }
}