const handler = require("../configHandler.js");
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
    ['MANAGE_EMOJIS']
];

module.exports = {
    name: 'setPermissions',
    description: 'Gives a specific command a required permission to be run. This is a very important command for security reasons.',
    args: true,
    guildOnly: true,
    usage: '<command name> <permission required>',
    hideHelp: false,

    execute(message, args) {
        var permissions = handler.getValue('permissions', message.guild);
        const prefix = handler.getValue('prefix', message.guild);
        const commandName = args[0];

        if (args.length == 1) {
            if (commandName in permissions) message.channel.send(`The command \`${commandName}\` requires the user to have \`${permissions[commandName]}\` permissions.
                                                               \n To change this, type \`${prefix}${setPermissions} ${commandName} <new permission>\``);
            else message.channel.send('This command does not currently have any required permissions, this means anyone in the server can use it. To change this, type `${prefix}${setPermissions} ${commandName} <new permission>`');
        } else if (args.length >= 2) {
            const permission = args[1];
            
            var isValid = false;

            for (var p in validPermissions) {
                if (permission in p) { 
                    isValid = true;
                    break;
                }
            }

            if (isValid) {
                var oldPermission = permissions[commandName];
                permissions[commandName] = permission;

                if (commandName in permissions) {
                    handler.setValue('permissions', permissions, message.guild)
                    .then(x => {
                        message.channel.send(`You have successfully changed the permissions of ${commandName} from ${oldPermission} to ${permission}`);
                    });
                } else {
                    handler.setValue('permissions', permissions, message.guild)
                    .then(x => {
                        message.channel.send(`You have successfully added the required permission ${permission} to ${commandName}. It was usable by anyone previously`);
                    })
                }

            } else {
                message.channel.send('That is not a valid permission, here is the list of valid permissions: ');

                for (var p in validPermissions) {
                    if (p.length = 1) message.channel.send(`\`${p[0]}\``);
                    else message.channel.send(`\`${p[0]} ${p[1]}\``);
                }
            }
        }
    }
}