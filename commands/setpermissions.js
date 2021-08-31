const handler = require("../configHandler.js");

// list of valid permissions, straight from the discord website except for the "NONE" entry that removes restrictions
const validPermissions = [
    ['ADMINISTRATOR', '(implicitly has all permissions, and bypasses all channel overwrites)'],
    ['CREATE_INSTANT_INVITE', '(create invitations to the guild)'],
    ['KICK_MEMBERS'],
    ['BAN_MEMBERS'],
    ['MANAGE_CHANNELS', '(edit and reorder channels)'],
    ['MANAGE_GUILD', '(edit the guild information, region, etc.)'],
    ['ADD_REACTIONS', '(add new reactions to messages)'],
    ['VIEW_AUDIT_LOG'],
    ['PRIORITY_SPEAKER'],
    ['STREAM'],
    ['VIEW_CHANNEL'],
    ['SEND_MESSAGES'],
    ['SEND_TTS_MESSAGES'],
    ['MANAGE_MESSAGES', '(delete messages and reactions)'],
    ['EMBED_LINKS', '(links posted will have a preview embedded)'],
    ['ATTACH_FILES'],
    ['READ_MESSAGE_HISTORY', '(view messages that were posted prior to opening Discord)'],
    ['MENTION_EVERYONE'],
    ['USE_EXTERNAL_EMOJIS', '(use emojis from different guilds)'],
    ['VIEW_GUILD_INSIGHTS'],
    ['CONNECT', '(connect to a voice channel)'],
    ['SPEAK', '(speak in a voice channel)'],
    ['MUTE_MEMBERS', '(mute members across all voice channels)'],
    ['DEAFEN_MEMBERS', '(deafen members across all voice channels)'],
    ['MOVE_MEMBERS', '(move members between voice channels)'],
    ['USE_VAD', '(use voice activity detection)'],
    ['CHANGE_NICKNAME'],
    ['MANAGE_NICKNAMES', '(change other members\' nicknames)'],
    ['MANAGE_ROLES'],
    ['MANAGE_WEBHOOKS'],
    ['MANAGE_EMOJIS'],
    ['NONE', '(allows any user to use this command)']
];

module.exports = {
    name: 'setpermissions',
    description: `Gives a specific command a required permission to be run. This is a very important command for security reasons. To see the list of options, enter options instead of a command name. To remove restrictions, enter none instead of a command name. To see the current restrictions on a command, only include the command and no permissions to set it to (you can also use the help command).`,
    args: true,
    guildOnly: true,
    usage: '<command name> <permission required>',
    hideHelp: false,
    aliases: ['permissions'],
    permissions: "ADMINISTRATOR",

    execute(message, args) {
        // give them the list of permissions in a nice to see format. Takes kinda long to send though :/
        if (args[0] === 'options') {
            message.channel.send('Here is a list of valid permissions: ');

            var output = [];

            // just some stuff to make the output look nice while saving work while I was parsing it earlier
            for (var p = 0; p < validPermissions.length; p++) {
                var thisPermission = validPermissions[p];
                if (thisPermission.length === 1) output.push(`\`${thisPermission[0]}\``);
                else output.push(`\`${thisPermission[0]} ${thisPermission[1]}\``);
            }

            message.channel.send(output.join('\n'));
            return;
        }

        const prefix = handler.getGuildValue('prefix', message.guild);
        const commandName = args[0];
        var commandInfo = handler.getCommandInfo(message.guild, message.client, commandName);

        // make sure it isn't null? I don't remember if this does anything
        if (!commandInfo) commandInfo = {};

        // if there's just one argument, and there's no current permissions, tell them that because one argument means just to tell the current permissions (kinda unintuitive)
        if (args.length === 1 && (!commandInfo || !commandInfo.hasOwnProperty('permissions'))) {
            message.channel.send(`This command does not currently have any required permissions, this means anyone in the server can use it. To change this, type \`${prefix}setpermissions ${commandName} <new permission>\` or \`${prefix}setpermissions options\` to view the possible choices for required permissions.`);
        }
 
        // if they just want to know the permissions and they exist tell them
        else if (args.length === 1) {
            var permissions = commandInfo['permissions'];
            message.channel.send(`The command \`${commandName}\` requires the user to have \`${permissions}\` permissions.
                                  \n To change this, type \`${prefix}setpermissions ${commandName} <new permission>\` or \`${prefix}setpermissions options\` to view the possible choices for required permissions.`);
        } 
        
        // set the permissions for this command as per their request
        else if (args.length >= 2) {
            // all permissions are in upper case so fix it in case they didn't do it that way
            const newPermission = args[1].toUpperCase();
            
            console.log(`Setting ${commandName} to require ${newPermission} in ${message.guild.name}`);

            // check if it's a valid permission in the list
            var isValid = false;
            for (var p = 0; p < validPermissions.length; p++) {
                if (validPermissions[p][0] == newPermission) { 
                    isValid = true;
                    break;
                }
            }

            // if they wanted none, remove everything
            if (newPermission.toLowerCase() == 'none') {
                commandInfo["permissions"] = null;
                handler.setCommandInfo(message.guild, commandName, commandInfo);
                message.channel.send(`You have successfully removed permission requirements for ${commandName}, anybody in this server can use the command now.`);
            
            // if it's a valid permission in the list
            } else if (isValid) {
                // the only difference here is the response, but I wanted the response to be after the setting in case there's an eror
                if (commandInfo.hasOwnProperty('permissions')) {
                    commandInfo.permissions = newPermission;
                    handler.setCommandInfo(message.guild, commandName, commandInfo);
                    message.channel.send(`You have successfully changed the permissions of ${commandName} from ${oldPermission} to ${newPermission}`);
                } else {
                    commandInfo['permissions'] = newPermission;
                    handler.setCommandInfo(message.guild, commandName, commandInfo);
                    message.channel.send(`You have successfully added the required permission ${newPermission} to ${commandName}. It was usable by anyone previously`);
                }
            
            // if it's not a valid permission, prompt them with the list of valid permissions
            } else {
                message.channel.send('That is not a valid permission, here is the list of valid permissions: ');

                var output = [];

                // same thing as above
                for (var p = 0; p < validPermissions.length; p++) {
                    var thisPermission = validPermissions[p];
                    if (thisPermission.length === 1) output.push(`\`${thisPermission[0]}\``);
                    else output.push(`\`${thisPermission[0]} ${thisPermission[1]}\``);
                }

                message.channel.send(output.join('\n'));
            }
        }
    }
}