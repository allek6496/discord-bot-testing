const handler = require('../configHandler.js');
const fs = require('fs');
const codeLength = 5;

module.exports = {
    name: 'open',
    description: 'Opens the attendance window in a voice channel(but actually just checks who\'s in a call',
    args: false,
    guildOnly: true,
    hideHelp: false,

    /**
     * Will open the attendance window, but for now just checks who's in the discord call.
     * @param {Message} message The Discord message object representing the triggering message.
     * @param {string Array} args The list of words following the triggering command used as arguments
     */
    execute(message, args) {
        try {
            // respond with all the active meetings so they know where the bot will be, as well as fill an array with the appropriate channel objects
            var onStart = handler.getGuildValue('on_start', message.guild);
            var channels = [];

            if (!Object.keys(onStart).length) return;

            message.channel.send(`Opening attendence for these channels (all the channels with an active meeting): `);
            
            for (var channelID in onStart) {
                var channel = message.guild.channels.resolve(channelID)
                message.channel.send(`> ${channel}`);
                channels.push(channel);
            }            

            // generate a code of numbers
            const code = this.newCode();

            // make a list of all the audio files
            var messageList = [fs.createReadStream('./resources/prompt.mp3')];

            code.forEach(digit => {
                messageList.push(fs.createReadStream('./resources/'+digit+'.mp3'));
            });

            messageList.push(fs.createReadStream('./resources/repeat.mp3'));

            code.forEach(digit => {
                messageList.push(fs.createReadStream('./resources/'+digit+'.mp3'));
            });

            const playMessage = (messages, connection) => {
                console.log(`beginning a new message, ${messages.length} left`);
                if (messages.length === 0) return new Promise((resolve, reject) => {
                    resolve();
                });
                
                return new Promise((resolve, reject) => {
                    var audio = messages.shift();
    
                    var dispatcher = connection.play(audio, {volume: 2});
    
                    dispatcher.on('error', console.error);
                    dispatcher.on('finish', () => {
                        playMessage(messages, connection).then(() => {
                            console.log(`Finished saying audio, ${messages.length} left to say to channel ${connection.channel.name}`)
                            resolve();
                        });
                    });
                });
            }

            const playMessages = (channel, messageList) => {
                return new Promise((resolve, reject) => {
                    console.log(`Sending messages to ${channel.name}`);
                    channel.join()
                    .catch(e => console.error(e))
                    .then(connection => {
                        playMessage(messageList, connection)
                        .then(() => {
                            connection.disconnect();
                            setTimeout(resolve, 1000);
                        });
                    });
                });
            };

            const joinChannels = (channels, messageList) => {
                let messages = [...messageList];
                if (channels.length === 0) return new Promise((resolve, reject) => {resolve();});

                return new Promise((resolve, reject) => {
                    var channel = channels.shift();
                    playMessages(channel, messages)
                    .then(() => {
                        joinChannels(channels, messages)
                        .then(() => {
                            resolve();
                        });
                    });
                });
            }

            joinChannels(channels, messageList);

            // give the code to each channel
            // var currentConnections = message.client.voice.connections.filter(connection => connection.channel.guild === message.guild);
            // if (currentConnections.length) {
            //     currentConnections.forEach(connection => {
            //         connection.disconnect();
            //     });
            //     setTimeout(playMessages(channel, messageList), 3000);
            // var promise = playMessages(channels.shift(), messageList);
            // channels.forEach(async channel => {
            //     promise.then(() => {playMessages(channel, messageList)});
            // });
        } catch (err) {
            console.log(err);
        }
    },

    // generates a code of a certain length
    newCode() {
        var code = [];

        for (var i = 0; i < codeLength; i++) {
            code.push(Math.floor(Math.random()*10).toString());
        }

        return code;
    }
}