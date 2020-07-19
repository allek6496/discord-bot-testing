
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
        if (commandProgress.ongoingCommands.some(call => (call.guildID === message.guild.ID && 
                                                 call.userID === message.author.ID &&
                                                 call.commandName === 'setup'))) {

            call = commandProgress.ongoingCommands.filter(call => (call.guildID === message.guild.ID && 
                                                          call.userID === message.author.ID &&
                                                          call.commandName === 'setup'))[0];
            message.channel.send(`You are ${call.step} steps through this command!`);
            commandProgress.ongoingCommands[commandProgress.ongoingCommands.indexOf(call)].step++;
        } else {
            commandProgress.ongoingCommands.push({
                guildID: message.guild.ID,
                userID: message.author.ID,
                commandName: 'setup',
                step: 1
            });

            message.channel.send('You are beginning to set up your server, please enter the same command to confirm your decision');
        }
    }
}