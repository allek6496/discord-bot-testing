const request = require('request');
const fs = require('fs');

module.exports = {
    name: 'gmeet',
    aliases: ['meet'],
    description: 'Input a google meeting attendance file, input data into the database.',
    args: false,
    guildOnly: true,  
    usage: '<file>',
    hideHelp: false,
    permissions: "ADMINISTRATOR",

    /**
     * Turns duration into int showing seconds.
     * This will break if given a time ranging in days, and will always round down the previous minute.
     * @param {String} string Duration
     */
    toSec(string) {
        try {
            var times = string.split(' ');
            if(string.includes("hr")) {
                return 3600*parseInt(times[0]) + 60*parseInt(times[2])
            } if (string.includes("min")) {
                return 60*parseInt(times[0]);
            }
        // if there's an error, always return some number
        } catch (error) {
            console.log(`Failed to convert ${string} to seconds`);
            return 0;
        }
    },

    /**
     * Manually adds attendance for a specific user
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     */
    async execute(message, args) {
        
        const handler = require('../configHandler.js');
                
        if (message.attachments.first()) {
            if (message.attachments.first().filename in ["csv", "txt"]) {
                console.log(`Reading from ${message.attachments.first().url}`)
                // console.log(typeof(message.attachments.first().url));
                // console.log(message.attachments.first().url.split('/').slice(-1)[0].substring(0, 13)); 
                request(message.attachments.first().url, {json:true}, (err, res, body) => {
                    if (err) {
                        message.channel.send("An error was thrown while reading your file!");
                        return console.log(err);
                    }

                    var arr = body.split('\n');
                    arr.shift();

                    var data = [];
                    arr.forEach(line => {
                        data.push(line.split(','));
                    });

                    var meets = require('../meetTemp.json');
                    const guildID = message.guild.id;

                    data.forEach(entry => {
                        // console.log(entry);

                        if (entry.length <= 3) return;

                        var shift = 0;
                        if (entry[1].includes('@')) { //Older versions have "name1 name2" newer versions have "name1, name2", this accounts for that difference
                            shift = -1
                            
                        } if (entry[2 + shift].includes('@')) { // Only check acceptable data
                            const email = entry[2 + shift];
                             // the date here is so incredibly janky but it works and i'm tired :weary: Just some way to show different meetings are different
                            const meetEntry = {"date": message.attachments.first().url.split('/').slice(-1)[0].substring(0, 10), "duration": this.toSec(entry[3+shift])}

                            // account for different name storage methods. Becomes "First Last"
                            if (shift==0) var name = entry[0] + " " + entry[1];
                            else var name = entry[0];

                            if (guildID in meets) {
                                if (meets[guildID]["users"].hasOwnProperty(email)) {
                                    meets[guildID]["users"][email]["meets"].push(meetEntry);
                                } else {
                                    meets[guildID]["users"][email] = {"name": name, "meets": [meetEntry]};
                                }
                            } else {
                                meets[guildID] = {
                                    "users": {
                                        [email]: {
                                            "name": name, 
                                            "meets": [meetEntry]
                                        }
                                    }
                                }
                            }
                        }
                    });

                    fs.writeFile('./meetTemp.json', JSON.stringify(meets), (e) => {
                        if (e) {
                            console.log(`Error thrown while writing to meetTemp.json`);
                            message.channel.send("An error was thrown while writing the file!");
                            throw e;
                        } else {
                            message.channel.send(`Sucessfully added data from ${data.length} users!`);
                        }
                    });
            
                });
            }
        }
    }
}