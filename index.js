/*
This bot was primarially made by Kegan Allen for the purpose of creating, moderating, and tracking attendance in online clubs at SJAM, specifically the Computer Science club, with help from Trever Du and Aditya Keerthi.
-A and -T are used to denote code taken from Aditya and Trevor respectively
*/

const disc     = require('discord.js');
const fs       = require('fs');
// const config   = require('./config.json');
const handler  = require('./configHandler.js');
const {update} = require('./commands/command_archive/start.js');
const emailer  = require('./functions/emailHandler.js');
const nicknamer= require('./functions/updateNick.js');
const limiter  = require('discord.js-rate-limiter');

//#region A
// -A
// ================= WEB SERVER ===================

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Verification Bot is online!'));

app.listen(port, () => console.log(`Verification bot online`));

// ================= BOT CODE ===================

const admin = require('firebase-admin');
const serviceaccountkey = require('./serviceaccountkey.json');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

admin.initializeApp({
    credential: admin.credential.cert(serviceaccountkey),
    databaseURL: `https://verification-bot-18c90.firebaseio.com`
});

const db = admin.firestore();

const verificationpassword = process.env.VERIFICATION_PASSWORD;

const help_message = new disc.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Verification Bot')
    .setAuthor('Verification Bot', 'https://i.imgur.com/Azowi2p.png')
    .setDescription('This bot, among other features, requires all users to verify their accounts to gain access to this server.')
    .setThumbnail('https://i.imgur.com/Azowi2p.png')
    .setTimestamp();

const exec_discord_ids = [
    "761013455644786699", // TEST
    "594841647087484928", // Aditya
    "221666425956335627", // Cristian
    "124999183806496770", // Trevor
    "410572592731389953", // Michelle
    "446845494950363208", // Yina
    "552890476089573396", // Kegan
    "155721447648526337" // Kevin
];

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'verifycsclub@gmail.com',
        pass: process.env.EMAIL_PASSWORD
    }
});

const encode = email => {
    let cipher = crypto.createCipher('aes-256-ctr', verificationpassword);
    let crypted = cipher.update(email, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

const decode = code => {
    let decipher = crypto.createDecipher('aes-256-ctr', verificationpassword);
    let decrypted = decipher.update(code, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
//#endregion -A

const myIntents = new disc.Intents();
myIntents.add(disc.Intents.FLAGS.GUILD_MEMBERS, disc.Intents.FLAGS.GUILDS, disc.Intents.FLAGS.GUILD_MESSAGES, disc.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, disc.Intents.FLAGS.DIRECT_MESSAGES);

const client = new disc.Client({ intents: myIntents, partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
client.commands = new disc.Collection();

// only attempt to draw from my .env file if it's needed, it should always be but whatever
if (!process.env.TOKEN) {
    require('dotenv').config();
}

// output a log when the bot is set up
client.once('ready', () => {
    emailer.initMailer({
        type: 'OAuth2',
        user: 'verifycsclub@gmail.com',
        pass: process.env.EMAIL_PASSWORD,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    });

    console.log('Ready!');

    client.user.setActivity('for ~help', { type: 'WATCHING' });
});

// pull all the command files into an array
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// go through each of the command files and get it's contents
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    if ("execute" in command) client.commands.set(command.name, command);
}

client.on('messageCreate', async message => {
    // prevent bot from responding to own messages
    if (message.author.bot) return;

    // find the correct prefix to use
    if (message.channel.type === 'GUILD_TEXT') {
        var prefix = await handler.getGuildValue('prefix', message.guild);
    } else {
        // there's currently no option to change prefix in a dm channel
        var prefix = '~'
    }

    // parse the message info to get both the command and the arguments for that command
    const args = message.content.replace('<', '').replace('>', '').slice(prefix.length).trim().split(' ').map(arg => arg.toLowerCase());
    
    // first check for special commands not requiring the prefix
    if (message.content.includes('🔔')) {
        // if they send just a bell emoji, respond with two bell emojis and "Ding Dong"
        // note command doesn't work because there's no prefix here
        client.commands.get('🔔').execute(message, args);
        
    // checks if the bot was @tted
    } else if (message.mentions.has(client.user) && message.guild && !message.mentions.has(message.guild.roles.everyone)) { 
        client.commands.get('hellothere').execute(message, args);

    //#region A 
    // if the message was sent in the new-members channel, delete the message and respond
    // } else if (message.guild && message.channel.id == handler.getGuildValue("new_members", message.guild)) {
    //     // -A (comments by Kegan)
    //     // I could've integrated this better, for example, seperateing the code into commands, but that's a lot of work when the code pretty much works as-is
    //     // it would also be nice to create a command to allow execs to verify users manually, much like the manual attendance tracking, but that's a small nicity not worth looking at right now

    //     // if there's no prefix, the user may not be familiar with the bot, so send them some basic instructions
    //     if (!message.content.startsWith(prefix)) {
    //         // delete their message and dm some instructions on how to learn to use the bot
    //         return setTimout(() => message.delete(), 1)
    //         .then(msg => msg.author.send(`If you require help please type ${prefix}help in the help channel, and only send messages with the prefix '${prefix}'`))
    //         .catch(e => {
    //             console.log("Error deleting the message from the user, or sending basic help message. Could be due to being blocked or invalid permissions");
    //             console.log(e);
    //         });
    //     };
    
    //     // parsing commands to parse the data, I could've integrated this with mine but it's easier to just do it again
    //     const commandBody = message.content.slice(prefix.length);
    //     const args = commandBody.split(' ');
    //     const command = args.shift().toLowerCase(); 
    
    //     // help command, uses a nice embed that is all fancy and cool, I'll change the rest of the bot's help commands into embeds at some point
    //     if (command === "help") {
    //         // delete the message and send a nice, premade help message to guild users
    //         return setTimeout(() => {
    //             message.delete()
    //             .then(msg => msg.author.send({ embeds: [help_message
    //                 .setFooter(`Type help '${prefix}<CommandName>' for details on a command`)
    //                 .addField(`${prefix}verify <email address>`, 'Please send this command using your wrdsb email address, and follow the instructions from there.')
    //             ]}))
    //             .catch(console.error);
    //         }, 1);
    //     }
    
    //     // first step for account verification
    //     else if (command === "verify") {
    //         // all messages are deleted after sending them to reduce spam
    //         message.delete({ timeout: 1 });

    //         const email = args[0];
    //         if (!email) {
    //             return message.author.send(`Please enter an email as an arugment.`)
    //         };
    //         if (!email.includes("@wrdsb.ca")) {
    //             return message.author.send(`Please enter an email with a WRDSB account.`)
    //         };

    //         // from here there's just a bunch of db stuff I don't really understand but seems to work
    //         const WRDSBLogin = args[0].split('.')[0];
    
    //         const verifieddata = await db.collection('schema').doc('verified').get();
    //         const verificationcode = encode(email);
    
    //         if (verifieddata.data()[WRDSBLogin] === undefined) {
    //             db.collection('schema').doc('verified').update({
    //                 [WRDSBLogin]: false
    //             });
    //             db.collection('schema').doc('ongoing').update({
    //                 [WRDSBLogin]: verificationcode
    //             });
    //         } else if (verifieddata.data()[WRDSBLogin] === false) {
    //             db.collection('schema').doc('ongoing').update({
    //                 [WRDSBLogin]: verificationcode
    //             });
    //         } else if (verifieddata.data()[WRDSBLogin] === true) {
    //             return message.author.send(`Your email has already been verified, if there is a problem with this please contact sjamcsclub@gmail.com`);
    //         };
    
    //         const mailOptions = {
    //             from: "verifycsclub@gmail.com",
    //             to: email,
    //             subject: `Verify Code for CS Club Discord Server`,
    //             text: `
    //             Here is the command you have to type in the Discord channel: ~verifycode ${verificationcode}
                
    //             Sincerely,
    
    //             Verification Bot on behalf of SJAM's Computer Science Club Executive Team
    //             `
    //         };
            
    //         transporter.sendMail(mailOptions, (error, info) => {
    //             if (error) {
    //                 return message.author.send(`${error}`);
    //             } else {
    //                 return message.author.send(`Success, we have sent the email to ${email}`);
    //             };
    //         });
    //     } 
        
        // // once they've recieved the command in the mail, they can continue to the final step of verification
        // } else if (command === "verifycode") {
        //     setTimeout(() => message.delete(), 1);
    
        //     // make sure they gave a code
        //     const code = args[0];
    
        //     if (!code) {
        //         return message.author.send(`Please enter the code you receieved as an arugment, in the form of "~verifycode <code>"`);
        //     };
    
        //     // data parsing ig
        //     const WRDSBLogin = decode(code).split('.')[0];
        //     const member = message.member;
    
        //     // more db stuff?
        //     const verifieddata = await db.collection('schema').doc('verified').get();
        //     const ongoingdata = await db.collection('schema').doc('ongoing').get();
    
        //     if (verifieddata.data()[WRDSBLogin]) {
        //         return message.delete({ timeout: 1 })
        //             .then(msg => msg.author.send(`You are already verified.`))
        //             .catch(console.error);
        //     } else if (ongoingdata.data()[WRDSBLogin] === code) {
        //         db.collection('schema').doc('verified').update({
        //             [WRDSBLogin]: true
        //         });
        //         db.collection('schema').doc('ongoing').update({
        //             [WRDSBLogin]: false 
        //         });
        //         db.collection('schema').doc('discord').update({
        //             [member.id]: WRDSBLogin 
        //         });
    
        //         let NewlyJoined = message.guild.roles.cache.find(role => role.name === "newly joined");
        //         let MemberRole = message.guild.roles.cache.find(role => role.name === "member");
    
        //         member.roles.remove(NewlyJoined).catch(console.error);
        //         member.roles.add(MemberRole).catch(console.error); 
    
        //         return message.author.send(`You are now verified.`);
        //     } else {
        //         return message.author.send(`Incorrect Code..`);
        //     };
        // } else {
        //     return setTimeout(() => {
        //             message.delete()
        //             .then(msg => msg.author.send(help_message))
        //             .catch(console.error);
        //         }, 1);
        // }
    //#endregion -A

    // if there's no special case, continue as normal
    } else {
        // first, if there's no prefix, don't respond
        if (message.content.slice(0, prefix.length) != prefix) return;

        const commandName = args.shift();

        // try and get the command
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        // if the command doesn't exist, don't continue
        if (!command) return;

        var commandInfo = await handler.getCommandInfo(message.guild, client, commandName);

        // check for command info (this shouldn't be needed because every command should have a commandInfo entry)
        if (commandInfo) {
            // if they don't have the correct permissions, don't let them run the command
            if (commandInfo.hasOwnProperty('permissions')) {
                if (commandInfo['permissions'] == "DEV") {
                    var devs = await handler.getConfigVar('devs');
        
                    // only allow the dev team to run this command
                    if (!devs.includes(message.author.id.toString())) {
                        console.log(`${message.author.username} tried to run the reload command but lacked permission. Their id was ${message.author.id} but this doesn't match the eligible dev ids of ${devs}`);
                        return;
                    }
                }

                if (message.member && !message.member.permissionsIn(message.channel).has(commandInfo['permissions'])) return;
            }
            
            // if the channel isn't allowed for this command, don't run the command
            if (commandInfo.hasOwnProperty('channels')) {
                if (!(commandInfo['channels'].includes(message.channel.id)) && commandInfo['channels'].length) return;
            }
        }

        // if it's a dm message, but the command can't be used in a dm, let them know
        if (command.guildOnly && message.channel.type != 'GUILD_TEXT') {
            message.channel.send(`You can't use the command ${commandName} in a DM! For a list of commands you can use type "~help"`)
            return;
        } 
        
        // make sure that commands requiring arguments are given arguments
        if (command.args && !args.length) {
            message.channel.send('That command requires arguments! Here are the details for this command:');
            
            // if they make a mistake, be sure to give them the proper usage
            client.commands.get('help').execute(message, [commandName])
            return;
        }
        
        // log the message usage, could get spammy so might be removed
        console.log(`\n${message.author.username} is calling ${commandName} in ${message.guild}!`);
        
        // try executing the command, and if it doesn't work give them a visible error sign, without giving error information so they can alert a dev there's something wrong
        try {
            //TODO: use slash commands, starting with the commands that return private info, eventually every command. I've got no clue as of now what's involved in that
            command.execute(message, args);
        } catch (e) {
            console.log(e);
            message.reply(`There was an error trying to execute the command ${prefix}${commandName} :sob:`);
        }
    }
});

// message sent when the bot first joins the server
client.on('guildCreate', async guild => {
    // send a message when entering the server
    guild.systemChannel.send(`Hello, ${guild.name}, I'm happy to be here! :bell: Set me up using the command \`~setup\``); 

    // create the guild entry
    handler.createNewGuild(guild);
    // handler.setGuildValue('id', guild.id, guild);

    // send me (the dev) a link to the server
    //TODO: do this for each dev
    let kegan = await client.users.fetch('552890476089573396');
    guild.systemChannel.createInvite({
        maxAge: 0,
        maxUses: 4,
        unique: true,
        reason: 'Invite a dev to the server to make sure it\'s a real club server'
    }).then(invite => {
        kegan.send(`Bot was invited to ${guild.name}, here's the invite link:\n` + invite.url);
    });
    
});

// remove the guild entry when the bot leaves
client.on('guildDelete', guild => {
    handler.deleteGuild(guild);
});

// spam protection, giving the new role to new members so they can't get immediate access to the server
client.on('guildMemberAdd', async member => {
    let devs = await handler.getConfigVar('devs');
    let user = await handler.getUser(member.user.id);
    // ik I said I'd promise.all with more than 2 but i don't wanna so sue me
    let prefix = await handler.getGuildValue("prefix", member.guild);

    try {
        // if the user was a dev, don't restrict them
        if (devs.includes(member.id)) {
            var memberRole = await handler.getGuildValue('member', member.guild);

            // if there's no member role, the server isn't set up so it's fine to do nothing
            // it's also possible they aren't using the verification of the bot, but that's fine too, I can just join however is normal
            if (memberRole) {
                member.roles.add(memberRole);
            } 
        
            // name devs too, cause we're lazy
            nicknamer.update(member.user.id, member.guild.id);

        // if they've signed up, just let them in without needing to re-verify
        } else if (user && "name" in user) {
            handler.getGuildValue("member", member.guild)
            .then(memberRole => {
                if (memberRole) {
                    member.roles.add(newRole)
                } 

                nicknamer.update(member.user.id, member.guild.id);
            }).catch(e => console.log(e));

        // all other users should be given the new role, do nothing otherwise
        } else {
            handler.getGuildValue('new', member.guild)
            .then(newRole => {
                if (newRole) {
                    member.roles.add(newRole);
                } else {
                    console.log("Couldn't find new role");
                }
            }).catch(e => console.log(e)); 

            member.user.send(`Hi there ${member.user.username}! Welcome to ${member.guild.name}!\nI'm the friendly attendance and moderation bot built by Kegan (blatherskite#3060). If you want to get access to this server, I'm going to need to make sure you're a student!\nPlease run \`~verify <your-wrdsb-email>\` in this dm channel, or \`${prefix}verify <your-wrdsb-email>\` over in the server you're trying to join! This command will step you through the verification process.\n\nI'm looking forward to seeing you around! :wave:`);
        }
    } catch(e) {
        console.log(e);
    }
});

client.on('messageReactionAdd', async (messageReaction, user) => {
    if (!messageReaction.partial) {
        await messageReaction.fetch()
        .catch(e => console.log(e));
    }

    let messageID = messageReaction.message.id;
    let guildId = messageReaction.message.guild.id;

    if (messageReaction.emoji.name === '✅') {
        var meeting = await handler.getMeet(guildId, {messageID: messageID});

        // Check if a meeting was found tied to this message
        if (meeting) {
            // only check active meetings
            if (meeting.active) {
                // if the triggering user was the bot, don't continue
                if (user.bot) {
                    console.log("Bot successfully reacted to the message.");
                    return;
                };

                var userID = user.id;
                
                handler.log(userID, guildId, messageID)
                .then(verified => {
                    // No harm in re-verifying, just don't spam them with messages
                    if (verified == 2) {
                        user.send('You\'ve successfully logged attendance!')
                        .catch(e => console.log(`Error in dm sending to ${user.username}. Attendance has been logged.\n${e}`))
                    } if (verified == 1) {
                        console.log("Double verified");
                        return;
                    } else {
                        user.send('You were not in the meeting when attendance opened, and so can\'t log attendance. If you believe this is a mistake please contact an exec of the club :hugging:');
                    }
                }).catch(e => {
                    // don't let them spam this
                    if (e == "UNVERIFIED") {
                        if (user.dmChannel) {
                            let lastMessage = user.dmChannel.lastMessage;
                            if (lastMessage && (Date.now() - lastMessage.createdTimestamp)/1000 > 30) {
                                user.send("You can't sign up for attendance until you make an account! Please sign up using `~verify`. To save spam in the server you're attending, it's advisable to do it in this channel here. Thanks :)")
                                .catch(e => console.log(`Error in dm sending to ${user.username}. They haven't verified. Attendance has not been logged.\n${e}`))
                            }
                        } else {
                            user.createDM()
                            .then(dm => {
                                user.send("You can't sign up for attendance until you make an account! Please sign up using `~verify`. To save spam in the server you're attending, it's advisable to do it in this channel here. Thanks :)")
                                .catch(e => console.log(`Error in dm sending to ${user.username}. They haven't verified. Attendance has not been logged.\n${e}`))
                            }).catch(e => console.log(e));
                        }
                    } else {
                        console.log(e);
                    }
                });
            }
        }
    }
});

// report errors to me, and kill the program asap afterwards
process.on('uncaughtException', err => {
    console.log(err);
    client.users.fetch('552890476089573396')
    .then(user => {
        user.send(`ERROR:\n${err.stack}`)
        .then(msg => {
            process.abort();
        });
    });
});

// log into discord using the token
client.login(process.env.TOKEN);
