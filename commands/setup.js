// newCommand: {guildID: false, userID: false, commandName: false, step: 1},
var commandProgress = {
    ongoingCommands: []
}

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
        

        if (call) {
            const handler = require('../configHandler.js');
            const prefix = handler.getValue('prefix', message.guild);
            const steps = [this.step1, this.step2];

            steps[call.step](message, args);

            commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step++;

        } else {
            commandProgress.ongoingCommands.push({
                guildID: message.guild.ID,
                userID: message.author.ID,
                step: 1
            });

            message.channel.send('You are beginning to set up your server, please enter the same command to confirm your decision');
        }
    },

    step1(message, args, prefix) {
        message.channel.send(`You are beginning setup for ${message.guild.name}, please select which option you prefer by typing \`${prefix}setup <choice #>\`\n> 1: Use all the defaults and quickly set up the whole server for me! (please use this on a fresh and unchanged server)\n> 2: Walk me through the process, asking for input on how I want the server built.\n> 3: Just tell me what I should do and I'll do it myself.`);
    },

    step2(message, args, prefix) {
        switch (args[0]) {
            case 1:
                var newMembersID; 
                await message.guild.roles.create({
                    data: {
                        name: 'New',
                        color: 'RED',
                        hoist: true,
                        position: 0,
                        mentionable: true
                    },
                    reason: 'Create a role for un-verified users, to prevent spam'
                })
                .then(role => newMembersID = role)
                .catch(console.error);

                message.guild.channels.create(
                    'new-members',
                    {
                        type: 'text',
                        topic: 'Use this channel to get access to the rest of the server',
                        permissionOverwrites: [
                            {
                                id: message.guild.id,
                                deny: ['VIEW_CHANNEL']
                            },
                            {
                                id: newMembersID,
                                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                            }
                        ],
                        reason: 'Channel for new members, not current ones'
                    }
                )
                .catch(console.error);

                break;
            
            case 2:
                //This is probably the harder part
                break;

            case 3:
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