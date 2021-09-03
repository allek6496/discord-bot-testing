// // newCommand: {guildID: false, userID: false, commandName: false, step: 1},
// var commandProgress = {
//     ongoingSetup: []
// }

const { Permissions } = require('discord.js');
const handler = require('../configHandler.js');

module.exports = {
    name: 'setup',
    description: 'Helps the user set up the bot and their server',
    args: false,
    guildOnly: true,
    usage: '<args>',
    permissions: "ADMINISTRATOR",
    
    async execute(message, args) {
        // check if this person already has progress through the message chain
        var commandProgress = handler.getConfigVar('commandProgress');
        
        var call;
        // This is a bit outdated, but I won't bother trying to add it to the new system, it should work in theory
        if (commandProgress && "ongoingSetup" in commandProgress) {
            var call = commandProgress.ongoingSetup.find(call => (call.guildID === message.guild.ID && 
                                                                  call.userID === message.author.ID));
        }
        
        const prefix = await handler.getGuildValue('prefix', message.guild);

        // if we could pick up, call the next step
        if (call) {
            const steps = [this.step1, this.step2, this.step3, this.lastStep];

            if (steps[call.setp] >= steps.length) call.step = steps.length-1;

            steps[call.step](message, args, prefix);

            // increase the step for next time
            call.step++;

        } else {
            // start the setup with a new entry
            if (!commandProgress) commandProgress = {};
            if (!("ongoingSetup" in commandProgress)) commandProgress["ongoingSetup"] = []

            commandProgress.ongoingSetup.push({
                "guildID": message.guild.ID,
                "userID": message.author.ID,
                "step": 0
            });

            message.channel.send(`You are beginning to set up your server, please enter the same command to confirm your decision. \nIf you chose option 1, you can undo most of the changes with \`${prefix}cleanup\`. However, @everyone role permissions, as well as some other settings, will stay chaged even after running the cleanup command.`);
        }

        handler.setConfigVar('commandProgress', commandProgress);
    },

    // confirmation
    step1(message, args, prefix) {
        message.channel.send(`You are beginning setup for ${message.guild.name}, please select which option you prefer by typing \`${prefix}setup <choice #>\`\n> 1: Quickly set up the whole server for me! (It is reccomended to use this on a fresh and unchanged server. Reverse the effects with \`${prefix}cleanup\`)\n> 2: Just tell me what I should do and I'll do it myself. (It is reccomended to use this on an established server, or one in which you want more fine control over the layout.\n\nAll values can be manually changed later on.`);
    },

    // creation or confirmation of server pieces
    async step2(message, args, prefix) {
        // there are two options, do everything, and do it themselves
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
                    reason: 'Create a exec users for differentiation and admin permissions'
                })
                .then(role => {
                    const adminPermissions = new Permissions('ADMINISTRATOR');
                    role.setPermissions(adminPermissions);

                    // store this role in config
                    handler.setGuildValue('exec', role.id, message.guild);
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
                    
                    // apply the role to every member
                    var i = 0;
                    message.guild.members.cache.forEach(member => {
                        try {
                            member.roles.add(role);
                        } catch (e) {
                            i++;
                        }
                    });
                    if (i) console.log(`Failed to write member roles to ${i} user(s) in ${message.guild}`);

                    // store this role in config
                    handler.setGuildValue('member', role.id, message.guild);
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

                    // store this role in config
                    handler.setGuildValue('new', role.id, message.guild);
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
                    handler.setGuildValue('announcements', channel.id, message.guild);
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

                message.channel.send(`Great! Step one done :smile:\nI created a few channels for you in the 'Created Channels' section, feel free to order them however you wish.\nThere is also a new role called exec, please give this role to everyone you wish to have administrator permissions. You can do this by right clicking on their name, going down to 'Roles' and clicking the checkbox next to'exec'. `)
                message.channel.send(`Type \`${prefix}setup\` again to continue to the next step after you've done this`)
                break;

            // give them the list of suggested steps
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

            // if it's neither of the above options, stall the progress and tell them they need a number
            default:
                var commandProgress = handler.getConfigVar('commandProgress');

                message.channel.send('Please respond with a number 1 or 2 representing your choice for how to set up the server!');
                
                // prevent the command from progressing
                var call = commandProgress.ongoingSetup.find(call => (call.guildID === message.guild.ID && 
                                                                         call.userID === message.author.ID));
                
                if (call) commandProgress.ongoingSetup[commandProgress.ongoingSetup.indexOf(call)].step--;

                handler.setConfigVar('commandProgress', commandProgress);
        }
    },

    // this one is only used if option 2 is chosen. This assigns the important values to the bot's storage
    // this might not be the best way to do this, but I'm so proud of it :D
    async step3(message, args, prefix) {
        const guild = message.guild;

        // Don't continue until every promise is finished
        let data = await Promise.all([
            handler.getGuildValue('new_members', guild),
            handler.getGuildValue('announcements', guild),
            handler.getGuildValue('moderation', guild),
            handler.getGuildValue('bot_spam', guild),
            handler.getGuildValue('new', guild),
            handler.getGuildValue('member', guild),
            handler.getGuildValue('exec', guild)
        ]);

        /// channels
        const new_members = data[0];
        const announcements = data[1];
        const moderation = data[2];
        const bot_spam = data[3];

        // permissions
        const newPermission = data[4];
        const member = data[5];
        const exec = data[6];

        // names and information and prompts for each needed piece of information
        const reqInfo = [
            ['new_members', new_members, 'the channel you would like to use for new members'], 
            ['moderation', moderation, 'the channel you would like to use for private admin messages'], 
            ['bot_spam', bot_spam, 'the channel you would like to use for general bot commands'],
            ['new', newPermission, 'the role you would like to use for new, un-verified users'],
            ['member', member, 'the role you would like to use for verified club members'],
            ['announcements', announcements, 'the channel you would like to use for server announcements and attendance notifications'],
            ['exec', exec, 'the role you would like to use for club execs/administrators']
        ];

        var skip = false;
        // go through each, but if it's been done just skip it. this results in the first needed piece of information being requested each time
        reqInfo.forEach(required => {
            if (!skip) {
                // ask for the information
                if (required[1] === false) {
                    message.channel.send(`Please send the name of ${required[2]} by using the command \`${prefix}setup <name>\`.  \:)`);
                    handler.setGuildValue(required[0], true, guild);
                    skip = true;

                // if the first option is set to true (asked for)
                } else if (required[1] === true) {
                    // if they didn't give any arguments, ask for the arguments
                    if (!args) {
                        message.channel.send(`Please send the name of ${required[2]} by using the command \`${prefix}setup <name>\`.  \:)`);
                    
                    // if they did give arguments, try and set them
                    } else {
                        var found = false;

                        try {
                            message.guild.channels.resolve(args[0].substring(2, args[0].length-1))

                            // after the channel is recieved, if successful, set the guild value to the channel id, otherwise ask to try again
                            .then(channel => {
                                if (channel) {
                                    console.log("found channel");
                                    handler.setGuildValue(required[0], channel.id, guild);
                                    found = true;
                                } 
                            })
                            .error(e => {
                                console.log(e);
                                message.channel.send('An error occured while trying to fetch that channel, please try again.');
                            });
                        } catch (e) {
                            console.log(`Failed to find channel with id ${args[0].substring(2, args[0].length-1)}`)
                        }

                        try {
                            message.guild.roles.resolve(args[0].substring(2, args[0].length-1))

                            .then(role => {
                                if (role) {
                                    handler.setGuildValue(required[0], role.id, guild);
                                    found = true;
                                }
                            })
                            .error(e => {
                                console.log(e);
                                message.channel.send('An error occured while trying to fetch that channel, please try again.')
                            })
                        } catch (e) {
                            console.log(`Failed to find role with id ${args[0].substring(2, args[0].length-1)}`)
                        }

                        if (!found) {
                            message.channel.send(`Failed to find channel/role named ${args[0]}, try again please. You may need to change the channel/role name or create a new channel/role, this is totally fine just respond with \`${prefix}setup <name>\`.`);
                        }
                    }
                    skip = true;

                // if it's been done
                } else if (typeof required[1] === 'string') {

                }
            }
        });

        // if they've done everything, let them know they're done
        if (!reqInfo.filter(channel => (typeof channel[1]) !== 'string').length) {
            message.channel.send(`Perfect! All channels and roles have been saved. Feel free to rename these channels and roles, their function is stored inside my massive brain (the cloud) regardless of their name. :smirk:\nPlease continue to the next step by typing \`${prefix}setup\``);
        
        // if there are still more things to do stop them from progressing
        } else {
            var commandProgress = handler.getConfigVar('commandProgress');
            
            // prevent the command from progressing
            var call = commandProgress.ongoingSetup.find(call => (call.guildID === message.guild.ID && 
                                                                        call.userID === message.author.ID));
            
            if (call) commandProgress.ongoingSetup[commandProgress.ongoingSetup.indexOf(call)].step--;

            handler.setConfigVar('commandProgress', commandProgress);
        }
    },
    
    lastStep(message, args, prefix) {
        message.channel.send(`Wonderful! :tada: \nYou have completed setup of your server! Go and have some fun!`);
        
        //delete the setup progress from this person, letting them run it again (not sure why they would want to do that though)
        var commandProgress = handler.getConfigVar('commandProgress');
    
        // attempt to remove the correct progress entry
        try {
            var thisSetup = commandProgress.ongoingSetup.find(call => (call.guildID === message.guild && 
                                                                    call.userID === message.author.ID));
    
            commandProgress.ongoingSetup.splice(commandProgress.ongoingSetup.indexOf(thisSetup), 1);
            handler.setConfigVar('commandProgress', commandProgress);
        } catch (e) {
            console.log('Couldn\'t find an ongoing setup command after attempting to cleanup');
            console.log(e);
        }
    },
    
    /**
     * Removes the saved progress for a specific server
     * @param {Message} message The triggering message
     */
    cleanup(message) {
        var commandProgress = handler.getConfigVar('commandProgress');
        
        // attempt to remove the correct progress entry
        try {
            var thisSetup = commandProgress.ongoingSetup.find(call => (call.guildID === message.guild && 
                                                                       call.userID === message.author.ID));
                
            commandProgress.ongoingSetup.splice(commandProgress.ongoingSetup.indexOf(thisSetup), 1);
            
            handler.setConfigVar('commandProgress', commandProgress);
        } catch (e) {
            console.log('Couldn\'t find an ongoing setup command after attempting to cleanup');
            console.log(e);
        }
    }
}