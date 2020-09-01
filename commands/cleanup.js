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
        'new_members'
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

    /**
     * For admin use, removes the effects of setup for easier testing and to revert the server to a previous state more easily.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    execute(message, args) {
        message.guild.channels.cache.filter(channel => toDelete.channels.includes(channel.name)).map(channel => channel.delete().catch(e => console.log(e)));
        message.guild.roles.cache.filter(role => toDelete.roles.includes(role.name)).map(role => role.delete().catch(e => console.log(e)));
        toDelete.configValues.forEach(val => handler.setGuildValue(val, false, message.guild));
        message.guild.roles.everyone.setPermissions(new Permissions(70274625))
        setup.cleanup(message);
    }
}