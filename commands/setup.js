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
    
    execute(message, args) {
        // check if this person already has progress through the message chain
        var commandProgress = handler.getConfigVar('commandProgress');
        
        // if there is no command progress entry (unlikely, mostly for during testing) create one
        if (!commandProgress){
            handler.setConfigVar('commandProgress', {'ongoingSetup': []});
            commandProgress = {'ongoingSetup': []};

        // if this command doesn't have any progress, create it for the command. Currently no other commands use this feature, but they could
        } else if (!commandProgress.hasOwnProperty('ongoingSetup')) {
            commandProgress['ongoingSetup'] = [];
        }

        // try to pick up the progress
        var call = commandProgress.ongoingSetup.find(call => (call.guildID === message.guild.ID && 
                                                             call.userID === message.author.ID));
        
        const prefix = handler.getGuildValue('prefix', message.guild);

        // if we could pick up, call the next step
        if (call) {
            const steps = [this.step1, this.step2, this.step3, this.lastStep];

            steps[call.step](message, args, prefix);

            // increase the step for next time
            commandProgress.ongoingSetup[commandProgress.ongoingSetup.indexOf(call)].step++;

        } else {
            // start the setup with a new entry
            commandProgress.ongoingSetup.push({
                guildID: message.guild.ID,
                userID: message.author.ID,
                step: 0
            });

            message.channel.send(`You are beginning to set up your server, please enter the same command to confirm your decision. \nYou can undo most of the changes with \`${prefix}cleanup\`, but @everyone role permissions, as well as some other settings, will stay chaged even after running the cleanup command. Only do this if you are absolutely sure this is what you want to do (it is recomended not to run this command on a server that is already established)`);
        }

        handler.setConfigVar('commandProgress', commandProgress);
    },

    // confirmation
    step1(message, args, prefix) {
        message.channel.send(`You are beginning setup for ${message.guild.name}, please select which option you prefer by typing \`${prefix}setup <choice #>\`\n> 1: Quickly set up the whole server for me! (It is reccomended to use this on a fresh and unchanged server)\n> 2: Just tell me what I should do and I'll do it myself.`);
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

                message.channel.send(`Great! Step one done :smile:\nI created a few channels for you in the 'Created Channels' section, feel free to order them however you wish.\nThere is also a new role called ${message.guild.roles.resolve(handler.getGuildValue('exec', message.guild))}, please give this role to everyone you wish to have administrator permissions. You can do this by right clicking on their name, going down to 'Roles' and clicking the checkbox next to'exec'. `)
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

                break;
        }
    },

    // this one is only used if option 2 is chosen. This assigns the important values to the bot's storage
    step3(message, args, prefix) {
        const guild = message.guild;

        /// channels
        const new_members = handler.getGuildValue('new_members', guild);
        const announcements = handler.getGuildValue('announcements', guild);
        const moderation = handler.getGuildValue('moderation', guild);
        const bot_spam = handler.getGuildValue('bot_spam', guild);

        // permissions
        const newPermission = handler.getGuildValue('new', guild);
        const members = handler.getGuildValue('members', guild);
        const exec = handler.getGuildValue('exec', guild);

        // names and information and prompts for each needed piece of information
        const reqInfo = [
            ['new_members', new_members, 'the channel you would like to use for new members'], 
            ['moderation', moderation, 'the channel you would like to use for private admin messages'], 
            ['bot_spam', bot_spam, 'the channel you would like to use for general bot commands'],
            ['new', newPermission, 'the role you would like to use for new, un-verified users'],
            ['members', members, 'the role you would like to use for verified club members'],
            ['announcements', announcements, 'the channel you would like to use for server announcements and attendance notifications'],
            ['exec', exec, 'the role you would like to use for club execs/administrators']
        ];

        // go through each, but if it's been done just skip it. this results in the first needed piece of information being requested each time
        for (required of reqInfo) {
            // ask for the information
            if (!required[1]) {
                message.channel.send(`Please send the name of ${required[2]} by using the command \`${prefix}setup <name>\`.  \:)`);
                required[1] = true;
                break;

            // if the first option is set to true (asked for)
            } else if (required[1] === true) {
                // if they didn't give any arguments, ask for the arguments
                if (!args) {
                    message.channel.send(`Please respond with the name of a channel on this server in the form \`${prefix}setup <channel-name>`);
                
                // if they did give arguments, try and set them
                } else {
                    // lol, I wrote this another way everywhere else, I forgot I could do it this way
                    var channel = message.guild.channels.fetch(args[0])

                    // after the channel is recieved, if successful, set the guild value to the channel id, otherwise ask to try again
                    .then(channel => {
                        if (channel) {
                            handler.setGuildValue(required[0], channel.id, guild);
                        } else {
                            message.channel.send(`Failed to find channel named ${args[0]}, try again please. You may need to change the channel name or create a new channel, this is totally fine just respond with \`${prefix}setup <channel_name>\`.`);
                        }
                    })
                    .error(e => {
                        console.log(e);
                        message.channel.send('An error occured while trying to fetch that channel, please try again');
                    });
                }
                break;

            // if it's been done
            } else if (typeof required[1] === 'string') {
                continue;
            }
        }

        // if they've done everything, let them know they're done
        if (!reqInfo.filter(channel => typeof channel[1] !== 'string').length) {
            message.channel.send(`Perfect! All channels and roles have been saved. Please continue to the next step by typing ${prefix}setup`);
        
        // if there are still more things to do stop them from progressing
        } else {
            // prevent the command from progressing (this block of code is used a lot but idrc about that)
            var commandProgress = handler.getConfigVar('commandProgress');

            var call = commandProgress.ongoingSetup.find(call => (call.guildID === guild && 
                call.userID === message.author.ID));

            if (call) commandProgress.ongoingSetup[commandProgress.ongoingSetup.indexOf(call)].step--;

            handler.setConfigVar('commandProgress');
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
        } catch (e) {
            console.log('Couldn\'t find an ongoing setup command after attempting to cleanup');
            console.log(e);
        }
    },

    lastStep(message, args, prefix) {
        message.channel.send(`Wonderful! :tada: \nYou have completed setup of your server! Go and have some fun!`);

        //delete the setup progress from this person, letting them run it again (not sure why they would want to do that though)
        cleanup(message);
    }
}