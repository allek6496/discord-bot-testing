const handler = require('../configHandler.js');
const emailer = require('../functions/emailHandler.js');
const {SnowflakeUtil} = require('discord.js');
const crypto = require('crypto');

if (!process.env.TOKEN) {
    require('dotenv').config();
}

// some code taken from justinboyerwriter.com (highly adapted)
const encrypt = email => {
    console.log(process.env.KEY);
    console.log(process.env.KEY.length);
    let cypher = crypto.createCipheriv("aes256", process.env.KEY, process.env.IV);
    return cypher.update(email, "utf8", "hex") + cypher.final("hex");
}

const decrypt = code => {
    console.log(code);
    let cypher = crypto.createDecipheriv("aes256", process.env.KEY, process.env.IV);
    // cypher.setAutoPadding(false);
    return cypher.update(code, "hex", "utf8") + cypher.final("utf8");
}

module.exports = {
    name: 'claim',
    aliases: ['claimAttendance'],
    description: 'Officially claim both Google Meet as well as Discord based attendance.',
    args: true,
    permissions: "DEV",
    usage: "`followed by `<email address>` OR `code <code>",
    guildOnly: false,
    hideHelp: true,

    /**
     * Allows a user to claim their attendance under their real identity by providing an email address.
     * @param {Message} message Discord message obect representing the triggering message.
     * @param {string Array} args The list of words following the triggering command (not used).
     * Async because it may need to wait for the guild to be fetched before continuing.
     */
    async execute(message, args) {
        return null;

//TODO: COMMAND DISABLED UNTIL FURTHER PROGRESS ELSEWHERE

//         //TODO: Add multiple times 
//         // first check if they've already done this. If they've finished the process, there should be a user object for them in handler.getUser

//         // If they pass in a valid email, retrieve their attendance count and email a code to them
//         if (args[0].includes('@')) {
//             if (!message.guild) {
//                 message.channel.send("Please use this half of the command in the server you wish to claim the attendance of. You can send the code the email gives you in this dm channel if you like.");
//                 return;
//             }

//             if (await handler.getUser(message.guild.id, message.author.id)) {
//                 message.reply("you've already done this! You can't do it multiple times :laughing:");
//                 return;
//             }

//             let email = args[0];
            
//             if (email.split('@')[1] === "wrdsb.ca") {

//                 let meetNum = this.getMeets(message.guild, message.author.id, email).length;

//                 if (meetNum == 0) {
//                     return message.reply("I didn't find any recorded meets under your account! :sob:\n\nPlease check you've put in the correct email and are logged into the correct discord account. If you believe this is a mistake, please contact an exec.");
//                 }

//                 let code = message.guild.id.toString() + '|' + email;

//                 let contents = 
// `
// Hi there!

// You currently have ${meetNum} unverified attendances, please claim them now by sending this code via DM to AttendanceTracker#5186.

// ~claim code ${encrypt(code)}

// Please don't share this code with anyone else, or they may be able to claim your attendance logs. Once you send it, all your attendance will be claimed and you won't be able to run this command again.

// Thanks!
// CS Club Attendance Tracker.
// `;
                
//                 if (!emailer.sendEmail(contents, "Please verify your account to claim attendance!", email)) {
//                     message.reply(`There's been an error sending mail to ${email}`);
//                 } else {
//                     message.reply(`Success, we have sent the email to ${email}. You may need to check your spam folder :sob: because Gmail thinks we are a bit SUS :flushed:`);
//                     if (message.guild) {
//                         message.delete({timeout: 1000})
//                             .catch(console.error);
//                     }
//                 }
//             } else {
//                 message.reply("Please enter a valid wrdsb email address");
//             }
//         } else if (args[0] === "code") {
//             // The code should be of the form "GUILDID|email@wrdsb.ca"
//             let decrypted = decrypt(args[1]).split('|');
//             let email = decrypted[1];
//             let guildId = decrypted[0];
            
//             // There's 0 chance it randomly includes this haha. It must've worked
//             if (!email.includes("@wrdsb.ca")) {
//                 return message.reply("That code was invallid. Please make sure you copied the whole command from the email.");
//             }

//             if (message.guild) {
//                 var guild = message.guild;
//             // If this is a dm channel, look for the guild with this id
//             } else {
//                 var guild = await message.client.guilds.resolve(guildId);
//             }

//             if (await handler.getUser(guild.id, message.author.id)) {
//                 message.reply("You've already done this! You can't do it multiple times :laughing:");
//                 return;
//             }

//             // check if they have any google meet meets. if they do, pull their name from there and use that. if no google meets are found, still log their meetings, name them "NO NAME GIVEN" and ask them to run ~setname "full name", warning an invalid name could invalidate attendance eligibility
//             const meetTemp = require("../meetTemp.json");
//             let name;

//             // Check if the guild has anything, and if it does, does it have this user. 
//             //TODO: Check other servers for a name under this account.
//             if (meetTemp && meetTemp.hasOwnProperty(guild.id) && meetTemp[guild.id]["users"].hasOwnProperty(email)) {
//                 name = meetTemp[guild.id]["users"][email]["name"];
//             } else {
//                 name = "N/A";
//                 message.channel.send("No name has been found for you! Please update your name using the command `~setname <your-full-name>`\nThis won't be acessible by other users, only the exec team will be able to view it for the purposes of verifying attendance.");
//                 //I think this works the way I want?
//             }

//             let oldnum = await handler.getAttendance(message.author.id, guild.id).length;
            
//             handler.setUser(guild.id, message.author.id, name, email, this.getMeets(guild, message.author.id, email));

//             //TODO: getMeets needs to be changed/removed
//             let meets = this.getMeets(guild, message.author.id, email);


//             // meets.forEach(date => {
//             //     handler.addMeet(guild.id, message.author.id, date);
//             // });

//             message.channel.send(`Updated! ${meets.length - oldnum} meets have been added to your account!`)

//             // Only delete the message if it's in a guild. It'll throw an error otherwise.
//             if (message.guild) {
//                 return message.delete({timeout: 100})
//                     .catch(console.error);
//             } else {
//                 return;
//             }
//         } else {
//             message.channel.send("What? :confused:\nI'm not sure what that is! Please see `~help claim` for usage instructions.")
//         }
    }
}