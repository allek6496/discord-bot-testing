const handler = require('../configHandler.js');
const emailer = require('../functions/emailHandler.js');
const {SnowflakeUtil} = require('discord.js');
const crypto = require('crypto');

if (!process.env.TOKEN) {
    require('dotenv').config();
}

// some code taken from justinboyerwriter.com (highly adapted)
const encrypt = email => {
    // console.log(process.env.KEY);
    // console.log(process.env.KEY.length);
    let cypher = crypto.createCipheriv("aes256", process.env.KEY, process.env.IV);
    return cypher.update(email, "utf8", "hex") + cypher.final("hex");
}

const decrypt = code => {
    if (typeof(code) != "string" || code.length != 64) return "";
    console.log(code);
    let cypher = crypto.createDecipheriv("aes256", process.env.KEY, process.env.IV);
    // cypher.setAutoPadding(false);
    return cypher.update(code, "hex", "utf8") + cypher.final("utf8");
}

module.exports = {
    name: 'verify',
    description: 'Register your Discord account with a wrdsb email address, granting you access to clubs and attendance.',
    args: true,
    usage: "`followed by `<email address>` OR `code <code>",
    guildOnly: false,
    hideHelp: false,

    /**
     * Allows a user to create a user account, granting access to all clubs the bot is managing
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     * @async
     */
    async execute(message, args) {
        // first check if this user already has an account
        let user = await handler.getUser(message.author.id);
        let prefix = await handler.getGuildValue("prefix", message.guild);

        if (user && user.email && user.name) {
            message.channel.send(`You're already verified! Unfortunately, you can't ***double verify***. To check if your information is correct, use \`${prefix}myname\``)
            // i never know what to return here, null, false, true, NaN... They're all handled the same but it's still a decision I have to make, a weight I must bear. As I sit here at 9:22pm working away I feel my bones decay and rot even though I just went for a walk
            return null;
        } if (user && user.email) {
            message.channel.send(`You're almost done! Now just add your name using the command \`${prefix}setname <first> <last>\``);
        } if (user) {
            // if they've got a blank user account tied to their id, but no email, check for a valid code
            // if the code checks out, add the email to their account and save it, just like before
            // then sync all their meetings from unclaimed. Addding a name is needed to 
        } else {
            // check for an email and do the exact same thing as before

            if (args[0].includes('@')) {    
                let email = args[0];
                let found = await handler.findEmail(email);

                if (found) {
                    return message.channel.send(`This email was found in another account!`);
                }
                
                if (email.split('@')[1] === "wrdsb.ca") {   
                    let code = email;
    
                    let contents = 
    `
Hi there!

You're beginning to set up your user account, please validate your email address by sending this command via DM to AttendanceTracker#5186.

~verify code ${encrypt(code)}

Please don't share this code with anyone else, or they may be able to claim your account. This action is ireversible.

Thanks!
CS Club Attendance Tracker.
    `;
                    
                    if (!emailer.sendEmail(contents, "Please verify your account to claim attendance!", email)) {
                        message.reply(`There's been an error sending mail to ${email}`);
                    } else {
                        message.reply(`Success, we have sent the email to ${email}. You may need to check your spam folder :sob: because Gmail thinks we are a bit SUS :flushed:`)
                        .then(reply => {
                            if (message.guild) {
                                setTimeout(() => {
                                    message.delete()
                                    .catch(e => console.log(e));
                                }, 1000)
                                
                                setTimeout(() => {
                                    reply.delete()
                                    .catch(e => console.log(e));
                                }, 10000);
                            }
                        });
                    }
                } else {
                    message.reply("Please enter a valid wrdsb email address");
                }
            } else if (args[0] === "code") {
                // always delete the code, much bigger deal than email
                if (message.guild) {
                    message.delete()
                    .catch(e => console.log(e));
                }
                
                // The code should be of the form "abcde1234@wrdsb.ca"
                let email = decrypt(args[1]);
                
                // There's 0 chance it randomly includes this haha. It must've worked
                if (!email.includes("@wrdsb.ca")) {
                    return message.reply("That code was invallid. Please make sure you copied the whole command from the email.");
                }

                // from here, they have a valid email. use this email to make a use account for them, leaving name blank
                handler.addUser(message.author.id, "N/A", email)
                .then(user => {
                    message.channel.send(`Updated! To finish this process, please give your name using \`${prefix}setname <first> <last>\``);
                });

                // Keeping this just in case

                // check if they have any google meet meets. if they do, pull their name from there and use that. if no google meets are found, still log their meetings, name them "NO NAME GIVEN" and ask them to run ~setname "full name", warning an invalid name could invalidate attendance eligibility
                // const meetTemp = require("../meetTemp.json");
                // let name;
    
                // // Check if the guild has anything, and if it does, does it have this user. 
                // //TODO: Check other servers for a name under this account.
                // if (meetTemp && meetTemp.hasOwnProperty(guild.id) && meetTemp[guild.id]["users"].hasOwnProperty(email)) {
                //     name = meetTemp[guild.id]["users"][email]["name"];
                // } else {
                //     name = "N/A";
                //     message.channel.send("No name has been found for you! Please update your name using the command `~setname <your-full-name>`\nThis won't be acessible by other users, only the exec team will be able to view it for the purposes of verifying attendance.");
                //     //I think this works the way I want?
                // }
    
                // let oldnum = await handler.getAttendance(message.author.id, guild.id).length;
                
                // handler.setUser(guild.id, message.author.id, name, email, this.getMeets(guild, message.author.id, email));
    
                // //TODO: getMeets needs to be changed/removed
                // let meets = this.getMeets(guild, message.author.id, email);
    
    
                // // meets.forEach(date => {
                // //     handler.addMeet(guild.id, message.author.id, date);
                // // });
    
                // message.channel.send(`Updated! ${meets.length - oldnum} meets have been added to your account!`)
    
                // // Only delete the message if it's in a guild. It'll throw an error otherwise.
                // if (message.guild) {
                //     return message.delete({timeout: 100})
                //         .catch(console.error);
                // } else {
                //     return;
                // }
            } else {
                message.channel.send(`What? :confused:\nI'm not sure what that is! Please see \`${prefix}help verify\` for usage instructions.`)
            }
        }
    }
}