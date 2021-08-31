// list of items to delete during cleanup sorted by their types
var toDelete = {
    channels: [
        'Created Channels',
        'new-members',
        'announcements',
        'moderation',
        'bot-spam',
    ], 
    roles: [
        'new',
        'exec',
        'member',
    ],
    configValues: [
        'bot_spam', 
        'moderation',
        'new_members',
        'announcements',
        'new',
        'exec',
        'member'
    ]
}

const setup = require('./setup.js');
const { Permissions } = require('discord.js');
const handler = require('../configHandler');

module.exports = {
    name: 'cleanup',
    description: 'Removes the effects of a setup command',
    args: false,
    guildOnly: true,  
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    /**
     * Mainly for admin use, removes the effects of setup for easier testing and to revert the server to a previous state more easily. 
     * Also used if the bot is not desired anymore on the server, but they want to keep their server
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        // keep track of the deleted channels
        var deletedIDs = [];
        
        message.guild.channels.cache.forEach(channel => {
            if (toDelete.channels.includes(channel.name)) {
                deletedIDs.push(channel.id);
                channel.delete().catch(e => console.log(`Failed to delete ${channel.name}\n${e}`));
            }
        });
        
        // same for roles, if the role matches the name of one of the roles in the delete list, delete it
        message.guild.roles.cache.forEach(role => {
            if (toDelete.roles.includes(role.name)){
                deletedIDs.push(role.id);
                role.delete().catch(e => console.log(`Failed to delete ${role.name}\n${e}`));
            }
        });
        
        // reset the guild values to false
        toDelete.configValues.forEach(val => handler.setGuildValue(val, false, message.guild));
        
        // some decent everyone permissions, I forget what they are
        message.guild.roles.everyone.setPermissions(new Permissions(70274625))
        
        // resets the setup function progress in this server
        setup.cleanup(message);

        // go through each of the commands, and if it used to reference a deleted object, erase that reference
        var commands = handler.getGuildValue('commands', message.guild);
        for (var command in commands) {
            if (!command.hasOwnProperty('channels')) continue;

            command['channels'].filter(channel => {
                !deletedIDs.includes(channel)
            });
        }
        handler.setGuildValue('commands', commands, message.guild);

        
        message.channel.send('Your server has been cleaned up!');
    }
}