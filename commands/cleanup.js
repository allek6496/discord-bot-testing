// list of items to delete during cleanup sorted by their types
var configValues= [
        'bot_spam', 
        'moderation',
        'new_members',
        'announcements',
        'new',
        'exec',
        'member'
]

const setup = require('./setup.js');
const { Permissions } = require('discord.js');
const handler = require('../configHandler');

module.exports = {
    name: 'cleanup',
    description: 'Removes the effects of a setup command',
    args: false,
    guildOnly: true,  
    hideHelp: false,
    permissions: "DEV",

    /**
     * Mainly for admin use, removes the effects of setup for easier testing and to revert the server to a previous state more easily. 
     * Also used if the bot is not desired anymore on the server, but they want to keep their server
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    async execute(message, args) {
        // A fair bit of guild information is needed for this command. Request it all at the start. This shouldn't be used often so it's not a big deal
        
        let prefix = await handler.getGuildValue('prefix', message.guild);
        
        if (!args.length || args[0].toLowerCase() != 'confirm') {
            message.channel.send(`Are you sure about this? This action cannot be undone. Running this command will delete every channel and role created by the bot. All of the messages contained in these channels will be deleted along with them.\nIf you're sure and would like to continue, run \`${prefix}cleanup confirm\``);
            return;
        }
        
        let data = await Promise.all([
            handler.getGuildValue('new_members', message.guild),
            handler.getGuildValue('announcements', message.guild),
            handler.getGuildValue('moderation', message.guild),
            handler.getGuildValue('bot_spam', message.guild),
            handler.getGuildValue('new', message.guild),
            handler.getGuildValue('member', message.guild),
            handler.getGuildValue('exec', message.guild)
        ]).catch(err => {console.log(`Error requesting data for server cleanup in ${message.guild.name}\n${err}`)});

        for (let i = 0; i < data.length; i++) {
            // these are part-way temp values, dont try and fetch them it won't work
            if (["false", "true", false, true].includes(data[i])) continue;
            else {
                // delete 4 channels
                if (i < 4) {
                    message.guild.channels.fetch(data[i])
                    .then(channel => {
                        if (channel) channel.delete().catch(err => {`Failed to delete channel in ${message.guild.name}\n${err}`});
                    }).catch(e => console.log(`Error fetching channel for cleanup\n${e}`));
                // and 4 roles
                } else {
                    message.guild.roles.fetch(data[i])
                    .then(role => {
                        if (role) role.delete().catch(err => {`Failed to delete role in ${message.guild.name}\n${err}`});
                    }).catch(e => console.log(e));
                }
            }
        }

        
        let category = message.guild.channels.cache.find(channel => channel.name.toLowerCase() === 'created channels');
        if (category) {
            data.push(category.id);
            category.delete().catch(err => {console.log(`Failed to delete Created Channels category in ${message.guild.name}\n${err}`)});
        }

        // reset the guild values to false
        configValues.forEach(val => handler.setGuildValue(val, false, message.guild));
        
        // some decent everyone permissions, I forget what they are
        message.guild.roles.everyone.setPermissions(Permissions.DEFAULT);
        
        // resets the setup function progress in this server
        setup.cleanup(message);

        // go through each of the commands, and if it used to reference a deleted object, erase that reference
        var commands = await handler.getGuildValue('commands', message.guild);
        if (commands) {
            for (var command in Object.values(commands)) {
                // only affect commands with channel restrictions
                if (command && ("channels" in command) && command.channels.length) {
                    command.channels = command.channels.filter(channel => {
                        !data.includes(channel)
                    });
                }
            }
            handler.setGuildValue('commands', commands, message.guild);
        }
        
        message.channel.send('Your server has been cleaned up!')
        // this just happened to me lol
        .catch(e => console.log(`Error sending from the channel, it was probably deleted haha`));
    }
}