// ================= WEB SERVER ===================

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Verification Bot is online!'));

app.listen(port, () => console.log(`online`));

// ================= BOT CODE ===================

const admin = require('firebase-admin');
const serviceaccountkey = require('./serviceaccountkey.json');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Discord = require('discord.js'); // REMOVE

admin.initializeApp({
    credential: admin.credential.cert(serviceaccountkey),
    databaseURL: `https://verification-bot-18c90.firebaseio.com`
});

const db = admin.firestore();

const verificationpassword = process.env.VERIFICATION_PASSWORD;

const client = new Discord.Client();
const prefix = `~`;

const help_message = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Verification Bot')
    .setAuthor('Verification Bot', 'https://i.imgur.com/Azowi2p.png')
    .setDescription('Some description here')
    .setThumbnail('https://i.imgur.com/Azowi2p.png')
    .addField('Inline field title', 'Some value here', true)
    .setTimestamp()
    .setFooter("Type '~help <CommandName>' for details on a command");

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

client.on("guildMemberAdd", async guildMember => {
    let NewlyJoined = guildMember.guild.roles.cache.find(role => role.name === "newly joined");
    let Executive = guildMember.guild.roles.cache.find(role => role.name === "exec");
    let Member = guildMember.guild.roles.cache.find(role => role.name === "member");

    const discorddata = await db.collection('schema').doc('discord').get();
    const verifieddata = await db.collection('schema').doc('verified').get();

    const WRDSBLogin = discorddata.data()[guildMember.id];

    if (exec_discord_ids.includes(guildMember.id)) {
        return guildMember.roles.add(Executive).catch(console.error);
    } else {
        if (WRDSBLogin) {
            if (verifieddata.data()[WRDSBLogin]) {
                return guildMember.roles.add(Member).catch(console.error);
            }
        }

        return guildMember.roles.add(NewlyJoined).catch(console.error);
    };
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (message.channel.name !== "verify") return;
    if (!message.content.startsWith(prefix)) {
        return message.delete({ timeout: 1 })
            .then(msg => msg.author.send("If you require help please type in the help channel, and only send messages with the prefix '~'"))
    };

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase(); 

    if (command === "help") {
        return message.delete({ timeout: 1 })
            .then(msg => msg.author.send(help_message))
            .catch(console.error);
    }

    else if (command === "verify") {
        message.delete({ timeout: 1 })
        const email = args[0];
        if (!email) {
            return message.author.send(`Please enter an email as an arugment.`)
        };
        if (!email.includes("@wrdsb.ca")) {
            return message.author.send(`Please enter an email with a WRDSB account.`)
        };
        const WRDSBLogin = args[0].split('.')[0];

        const verifieddata = await db.collection('schema').doc('verified').get();
        const verificationcode = encode(email);

        if (verifieddata.data()[WRDSBLogin] === undefined) {
            db.collection('schema').doc('verified').update({
                [WRDSBLogin]: false
            });
            db.collection('schema').doc('ongoing').update({
                [WRDSBLogin]: verificationcode
            });
        } else if (verifieddata.data()[WRDSBLogin] === false) {
            db.collection('schema').doc('ongoing').update({
                [WRDSBLogin]: verificationcode
            });
        } else if (verifieddata.data()[WRDSBLogin] === true) {
            return message.author.send(`Your email has already been verified, if there is a problem with this please contact sjamcsclub@gmail.com`);
        };

        const mailOptions = {
            from: "verifycsclub@gmail.com",
            to: email,
            subject: `Verify Code for CS Club Discord Server`,
            text: `
            Here is the command you have to type in the Discord channel: ~verifycode ${verificationcode}
            
            Sincerely,

            Verification Bot on behalf of SJAM's Computer Science Club Executive Team
            `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return message.author.send(`${error}`);
            } else {
                return message.author.send(`Success, we have sent the email to ${email}`);
            };
        });
    } 

    else if (command === "verifycode") {
        message.delete({ timeout: 1 })
        const code = args[0];

        if (!code) {
            return message.author.send(`Please enter the code you receieved as an arugment, in the form of "~verifycode <code>"`);
        };

        const WRDSBLogin = decode(code).split('.')[0];
        const member = message.member;

        const verifieddata = await db.collection('schema').doc('verified').get();
        const ongoingdata = await db.collection('schema').doc('ongoing').get();

        if (verifieddata.data()[WRDSBLogin]) {
            return message.delete({ timeout: 1 })
                .then(msg => msg.author.send(`You are already verified.`))
                .catch(console.error);
        } else if (ongoingdata.data()[WRDSBLogin] === code) {
            db.collection('schema').doc('verified').update({
                [WRDSBLogin]: true
            });
            db.collection('schema').doc('ongoing').update({
                [WRDSBLogin]: false 
            });
            db.collection('schema').doc('discord').update({
                [member.id]: WRDSBLogin 
            });

            let NewlyJoined = message.guild.roles.cache.find(role => role.name === "newly joined");
            let MemberRole = message.guild.roles.cache.find(role => role.name === "member");

            member.roles.remove(NewlyJoined).catch(console.error);
            member.roles.add(MemberRole).catch(console.error); 

            return message.author.send(`You are now verified.`);
        } else {
            return message.author.send(`Incorrect Code..`);
        };
    } else {
        return message.delete({ timeout: 1 })
            .then(msg => msg.author.send(help_message))
            .catch(console.error);
    }
});


/*
NOTE TO KEGAN:
For some reason on my machine it's not letting me do process.env.DISCORD_TOKEN to access the token fron the .env file.
So the token is in below just in case you can't either. I forget how to deploy stuff on Heroku but if you need any help, ping me on Discord.
*/

// client.login(process.env.DISCORD_TOKEN);
client.login("NzU5NDYyOTU0OTA2MTU3MTM2.X292_g.TcDK5BXO154BAmx9NrUHxzpiF5c");