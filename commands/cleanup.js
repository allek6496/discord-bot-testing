var toDelete = {
    channels: [
        'Created Channels',
        'new-members',
        'announcements',
        'moderation',
    ], 
    roles: [
        'new',
        'exec',
        'member',
    ]
}

const reload = require('./reload.js');
const { Permissions } = require('discord.js');


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
        message.guild.channels.cache.filter(channel => toDelete.channels.includes(channel.name)).map(channel => channel.delete());
        message.guild.roles.cache.filter(role => toDelete.roles.includes(role.name)).map(role => role.delete());
        message.guild.roles.everyone.setPermissions(new Permissions(103926849 ))
        reload.execute(message, ['setup']);
    }
}