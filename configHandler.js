const { Console } = require('console'); // idk what this does
const mongoose    = require('mongoose');
const {Snowflake} = require('discord.js')
const {SnowflakeUtil} = require('discord.js');

// https://mongoosejs.com/docs/index.html

if (!process.env.TOKEN) {
    require('dotenv').config();
}

const url = `mongodb+srv://bot:${process.env.DB_PASS}@csclub.h5asv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true 
}

mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ');
    })
    .catch( (err) => {
        console.log(`Error connecting to the database. \n${err}`);
    });

//#region Schemas
// Global scope decleration. They shouldn't be used before filling.
let Meet, User, Guild;

const db = mongoose.connection;
db.on('error', console.log.bind(console, "DB CONNECTION ERROR:"));
db.once('open', function() {
    // Schema definining a meeting. Specific to one club, either from google meets or from discord
    const meetSchema = new mongoose.Schema({
        date: {
            type: Date,
            default: Date.now
        },

        // Store the ID of the guild that this meeting was inside of
        guildID: String,

        // Keep track of the message linked to this meeting. Become useless upon closure of the meeting
        anouncementID: String,

        // Whether or not the meet is currently running
        active: {
            type: Boolean,
            default: 1 // Default to active, as when the meeting is made, there's an active meeting
        }, 
    });

    Meet = mongoose.model("Meet", meetSchema);

    // Schema defining a user. Each discord account gets one User object, identified by their snowflake id.
    const userSchema = new mongoose.Schema({
        id: String, // User's snowflake

        name: String,
        email: String,

        // List of meets for every club, and whether or not they're valid. Information about which club each meet was for is inside the meet
        meets: [{
            meet: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Meet"
            },

            valid: {
                type: Boolean,
                default: false
            }
        }]
    });

    User = mongoose.model("Member", userSchema);

    // Schema defining a guild/club. This has a variety of settings that may or may not be used, but this is the setup haha
    const guildSchema = new mongoose.Schema({
        // Guild info
        id: String,
        name: {
            type: String, 
            default: ""
        },

        // Guild specific setup stuff
        prefix: {
            type: String,
            default: '~'
        },

        bot_spam: String, // Snowflakes
        moderation: String,
        new_members: String,
        announcements: String,
        new: String,
        exec: String,
        member: String,

        // command_name: {perms: "ADMINISTRATOR", channels: ["empty for all channels, otherwise channel ids for accepted channels"]}
        commands: {
            type: Map,
            of: {
                permissions: String,
                channels: [String] // List of snowflakes for valid channels
            }
        },

        // List of meets that have been run in this guild
        meets: [{
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Meet"
        }],

        // An object for each non-existent user. Tagged with email and name, it stores the unclaimed meetings. When a discord user verifies ownership of this email, delete the object from the array
        unclaimed: [{ 
            email: String,
            name: String,
            meets: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Meet"
            }] // When put into the user's meets, assume all are verified
        }],

        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member"
        }]
    });

    Guild = mongoose.model("Guild", guildSchema);
});
//#endregion

// Here to remember what information is needed in a guild object
// const guildTemplate = {
//     "id": false, 
//     "prefix": '~', 
//     "bot_spam": false, 
//     "moderation": false, 
//     "new_members": false, 
//     "announcements": false,
//     "new": false,
//     "exec": false,
//     "member": false,
//     "commands": {
//         // "cleanup": {"permissions": "ADMINISTRATOR"}, 
//         // "close": { "permissions": "ADMINISTRATOR"},
//         // "data": { "permissions": "ADMINISTRATOR"},
//         // "gmeet": { "permissions": "ADMINISTRATOR"},
//         // "log": { "permissions": "ADMINISTRATOR"},
//         // "open": {"permissions": "ADMINISTRATOR"},
//         // "prefix": {"permissions": "ADMINISTRATOR"}, 
//         // "reload": {"permissions": "ADMINISTRATOR"}, 
//         // "setchannels": {"permissions": "ADMINISTRATOR"},
//         // "setpermissions": {"permissions": "ADMINISTRATOR"},
//         // "setup": {"permissions": "ADMINISTRATOR"}, 
//         // "setvalue": {"permissions": "ADMINISTRATOR"},
//     },
//     "meetings": {

//     },
//     "on_open": {},
//     "on_start": {}
// };

const dmSettings = {"prefix": '~'};


// @async flag used to show which functions return promises, idk the correct form for this but it should help

//#region Users
/**
 * Adds a user to the database, free of logged meets.
 * @param {Snowflake} ID ID of the user to add
 * @param {string} name Full name of the user
 * @param {string} email WRDSB email of the user
 * @param {(Meet[]|string[])} meets List of meets the user has attended
 * @returns {Promise} Returns a promise for user object created
 * @async
 */
function addUser(ID, name, email, meets=[]) {
    if (!typeof(ID) != "string") {
        return console.log(`Invalid user ID type. Expected string, recieved ${typeof(ID)}: ${ID}`);
    }
    
    return User.create({
        id: ID, 
        name: name, 
        email: email,
        meets: meets
    }).catch(error => {
        console.log(`Error thrown while creating user ${name} with id ${ID}\n${error}`);
    });
}

/**
 * Returns the user object with a given id.
 * @param {Snowflake} ID ID of the user to get
 * @returns {Promise} Promise to the requested user object
 * @async
 */
function getUser(ID) {
    return User.findOne({id: ID})
    .populate("meets")
    .exec()
    .catch(err => {
        console.log(`Error getting user with id ${ID}\n${err}`);
    });
}

/**
 * Gets the list of dates a user has attended and been verified for from a specific guild
 * @param {Snowflake} uID User ID
 * @param {Snowflake} guildID ID of the guild to get this user's attendance in
 * @returns List of dates the user attended in YYYY-MM-DD format
 * @async
 */
 async function getAttendance(uID, guildID) {
    let user = await getUser(uID);
    let out = [];

    for (let meet of user.meets) {
        if (meet.valid && meet.meet.guildID == guildID) {
            out += [meet.meet.date.toISOString().substring(0, 9)] // should be YYYY-MM-DD
        } 
    }

    return out;
}

/**
 * Logs a user as valid in a certain meet. Just slightly easier than getUser
 * @param {Snowflake} uID ID of the user to log
 * @param {Snowflake} guildID ID of the guild to log in
 * @param {Snowflake} messageID ID of the message connected to the meet, for id purposes
 * @returns {boolean} Whether or not they were already verified
 * @async
 */
function log(uID, guildID, messageID) {
    getUser(uID)
    .then(user => {
        let verified = false;
        
        // Go through each meet, looking for one with valid guild and message, and log it as validated
        user.meets.some(meet => {
            if (meet.meet.guildID == guildID && meet.meet.guildID == messageID) {
                verified = user.meet.valid;
                user.meet.valid = true;
                return true;
            } return false;
        });
        
        user.save();
        return verified;
    });
}
//#endregion

//#region Meets
// There's actually so many functions here, I've got no acutal training so I'm not sure if this is good form or not
// I basically just make a new function whenever I need to interact with the db in a way that isn't already covered KEKW

/**
 * Creates a new meeting.
 * @param {String} guildID ID of the guild to make the new meeting in
 * @param {Object} args {`date`, `messageID`, `active`}
 * @returns {Promise<Meet>} Promise for the created meet.
 * @async
 */
function newMeet(guildID, args) {
    let messageID, date, active;
    
    if ("messageID" in args) messageID = args.messageID;
    if ("date" in args) date = args.date;
    if ("active" in args) active = args.active;
    
    if (!(messageID || date)) {
        console.log("Tried to create a meeting with no information");
    } else if (messageID) {
        if (date) {
            return Meet.create({
                date: date,
                guildID: guildID,
                announcementID: messageID,
                active: active
            });
        } else {
            let date = SnowflakeUtil.deconstruct(messageID).date;
            
            // e.g. "21" dont worry about "01" situation, that's a while away lol
            let year = date.getFullYear().toString();
            
            // Starts at 0 for some reason
            let month = date.getMonth() + 1;  
            
            // Ensure the date is always 2 digits
            if (month < 10) month = '0' + month.toString();
            else month = month.toString();
            
            // Same with day
            let day = date.getDate();
            
            if (day < 10) day = '0' + day.toString();
            else day = day.toString();
            
            let thisDate = [year, month, day].join("-");
            
            return Meet.create({
                date: thisDate,
                guildID: guildID,
                announcementID: messageID,
                active: active
            })
        }
    } else {
        return Meet.create({
            date: date,
            guildID: guildID,
            active: active
        });
    }
}

/**
 * Finds a meet given the guildID and either messageID or date
 * @param {Snowflake} guildID ID of the guild to look in
 * @param {Object} args {`messageID`, `date`} One is required to run. Can search with either. Will default to messageID given both.
 * @returns Promise for the meet requested
 * @async
 */
function getMeet(guildID, args) {
    let messageID, date;
    if ('messageID' in args) messageID = args.messageID;
    if ('date' in args) date = args.date;

    if (!(messageID || date)) {
        console.log("Tried to get meet with no information");
    } else if (messageID) {
        return Meet.find({
            guildID: guildID,
            announcementID: messageID
        }).then(meets => {
            if (meets.length) {
                return meets[0]
            } else {
                console.log(`Failed to find meet with messageID ${messageID} in ${guildID}`);
                return null;
            }
        }).catch(err => {console.log(`Error finding meet with messageID ${messageID}\n${err}`)});
    } else {
        let start = new Date(date).setHours(00, 00, 00);
        let end   = new Date(date).setHours(23, 59, 59);

        // First, look for an existing meet at this date in this guild
        return Meet.find({
            date: {
                $gte: start,
                $lte: end
            }, 
            guildID: guildID
        }).then(meets => {
            // If it exists, add it to the user's list of attended meets
            if (meets.length()) {
                if (meets.length > 1) console.log(`WARNING, MULTIPLE MEETINGS ON DATE ${date} IN GUILD ${guildID} RETURNING ONE AT RANDOM`);
                return meet;

            } else {
                return null;
            }
        }).catch(err => {
            console.log(`Error finding a meet at date ${date}\n${err}`);
            return null;
        });
    }
}

/**
 * Gets all users that were present in a specific meeting, verified and unverified.
 * @param {Snowflake} guildID ID of the guild to look in
 * @param {Object} args {`messageID`, `date`} One is required to run. Can search with either. Will default to messageID given both.
 * @returns {[User]} Returns list of users that were a part of this meeting
 */
async function meetMembers(guildID, args) {
    // First look for the meet
    let meet = await getMeet(guildID, args);

    return User.find({
        meets: {$in: [{
            meet: meet._id,
            valid: {$exists: true}
        }]}
    }).populate('meets')
    .catch(err => {console.log(`Error finding all members present in meets matching ${args} in guild ${guildID}\n${err}`)});
}


//I could probably combine these two but whatever
/**
 * Adds a meet to a user in a specific guild using the attahced announcement message.
 * @param {Snowflake} uID ID of the user to add the meeting to
 * @param {Snowflake} guildID ID of the guild the meeting belongs to
 * @param {Snowflake} messageID ID of the message attached to the meeting
 * @returns {Promise<Meet>} Returns a promise for the meeting added
 * @async
 */
function addMeetByMessage(uID, guildID, messageID) {
    return getMeet(guildID, {messageID: messageID})
    .then(meet => {
        if (meet) {
            User.updateOne({
                id: uID
            }, {
                $push: {meet: meet._id, valid:false}
            }).catch(err => {console.log(`Error adding meet with messageID ${messageID} to user ${uID} in ${guildID}\n${err}`)});

            return meet;
        } else {
            console.log("Tried to add a meet based off a message, but the meet hasn't been created yet. Please create the meeting first before using this command.");
            return null;
        }
    });
}

/**
 * Assigns a meet to a user. Will always set the meet as verified. This will pick the "first" meeting if multiple lie on the same day. I'm nost sure if this will be used, messageID is always better.
 * @param {Snowflake} uID ID of the user to add attendance to
 * @param {Snowflake} guildID The id of the guild in question
 * @param {String} date A string representing the date
 * @returns {Meet} The meeting added
 * @async
 */
function addMeetByDate(uID, guildID, date) {
    return getMeet(guildID, {date: date})
    .then(async meet => {
        // If it exists, add it to the user's list of attended meets
        if (meet) {
            User.updateOne({
                id: uID
            }, {
                $push: {meet: meet._id, valid: true}
            });

            return meet;
        // If it doesn't create a meet and then add it to the user
        } else {
            let thisMeet = await newMeet(guildID, {date: date})
            .catch(err => {console.log(`Error building new meet using only date ${date}\n${err}`)});

            User.updateOne({
                id: uID
            }, {
                $push: {meet: thisMeet._id, valid: true}
            }).catch(err => {
                console.log(`Error pushing new meet to user ${uID}'s meet list\n${err}`);
            });

            return thisMeet;
        }
    });
}

//#endregion

//#region Guilds
/**
* Creates a guild document in the database
* @param {Guild} guild The guild object to create an entry for
* @returns {Object(guild)} Returns the guild object, as though just pulled from Guild.findOne(). No promise or async
*/
function createNewGuild(guild) {
    const newGuild = new Guild({
        id: guild.id,
        name: guild.name,
        prefix: '~',
    });
 
    newGuild.save()
    .then(guild => {
     console.log(`Created guild named ${guild.name}`);
    });
 
    return newGuild;
 }
 

/**
 * Sets a value within a guild
 * @param {string} value The value to change
 * @param {var} newValue The new value to change it to
 * @param {Guild} guild The object representing the guild
 * @async
 */
function setGuildValue(value, newValue, guild) {
    if (guild === null) {
        return;
    } else if (typeof guild === 'string') {
        return console.log('ERROR: PASSED ID AS GUILD, PLEASE PASS GUILD OBJECT');
    }

    let query = {};
    query[`${value}`] = newValue
    
    return Guild.updateOne({id: guild.id}, {$set: query})
    .catch(err => {
        console.log(`Error setting ${value} in ${guild.name} to ${newValue}\n${err}`);
    });
}

/**
 * Gets a value from a specific guild
 * @param {string} value A string for the property you want to get
 * @param {Guild} guild The guild object the message came from, null if dm
 * @async
 */
function getGuildValue(value, guild) {
    if (guild == null) {
        if (value in dmSettings) {
            return dmSettings[value];
        } else {
            console.log(`${value} is not set as a default value for dm channels`);
            return null;
        }
    } else if (typeof guild === 'string') {
        return console.log('ERROR: PASSED ID AS GUILD, PLEASE PASS GUILD OBJECT');
    }


    const thisGuild = Guild.findOne({id: guild.id}, [value, "name"]);

    if (value in ["meets", "members"]) {
        thisGuild.populate(value);

    // I don't know if this works or not
    } else if (value == "unclaimed") {
        thisGuild.populate("meets")
    }

    return thisGuild
    .then(thisGuild => {
        if (thisGuild && value in thisGuild) {
            // console.log(`Found that ${value} is ${thisGuild[value]} in ${thisGuild.name}`)
            return thisGuild[value];
        } else if (!thisGuild) {
            const newGuild = createNewGuild(guild);
                    
            if (value in newGuild) {
                return newGuild[value];
            } else {
                console.log(`Created new guild named ${guild.name} following request for ${value}, but this value isn't default.`);
                return null;
            }
        } else {
            console.log(`Tried to read ${value} from ${guild.name}, but it doesn't exist as a property. Returning null.`);
            
            return null;
        }
    }).catch(err => {
        console.log(`Error getting ${value} from ${thisGuild.id}\n${err}`);
        return null;
    });

}

/**
 * Gets guild specific information for a command
 * @param {Guild} guild The guild object for the specific instance of the command. Null if DM channel
 * @param {String} commandName Name of the command to get information from
 * @async
 */
async function getCommandInfo(guild, client, commandName) {
    // Handle dm channels differently
    let clientCommand = client.commands.get(commandName);
    if (!clientCommand) clientCommand = client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    
    if (!clientCommand) {
        console.log(`Tried to pull value for ${commandName} in ${guild.name}, but there is no information for this loaded into the discord client. Most likely requested a command which doesn't exist.`);
        return null;
    }

    if (!guild) {
        return clientCommand;
    }
    
    let commands = await getGuildValue("commands", guild);

    if (!commands || !(commandName in commands)) {
        return clientCommand;
    }

    for (const info in commands[commandName]) {
        clientCommand[info] = guild.commands[commandName][info];
    }

    return clientCommand;
}

/**
 * Sets command specific information for a specific guild
 * @param {Guild} guild Guild object for the specific instance of the command
 * @param {String} commandName Name of the command to set the info for
 * @param {Object} newInfo New information to give to the command (replaces, doesn't add)
 * @returns {any} Returns the value set (not really useful)
 * @async
 */
async function setCommandInfo(guild, commandName, newInfo) {
    // This does nothing in a dm channel
    if (!guild) return;

    var commands = await getGuildValue('commands', guild);

    // There's a much smarter way to handle this, but I can't be bothered, cause this should also work (though it'll probably be a bit slower)
    if ((commands && commandName in commands) || //The command is saved and has some value (normal case)
        guild.client.commands.get(commandName) || // The command or the command's alias is saved as a valid command for the client
        guild.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))) {
        
        commands[commandName] = newInfo;
        return setGuildValue('commands', commands, guild);

    } else {
        return console.log(`Tried to set ${commandName} to ${newInfo} in ${guild.name}, but it doesn't exist as a valid command!`);
    }
}

/**
 * Removes a guild from the json file after it's no longer needed.
 * @param {Guild} guild The ID of the guild to remove.
 * @returns promise for the guild deletion
 * @async
 */
 function deleteGuild(guild) {
    if (guild == null) {
        console.log('Tried to delete a dm channel')
        return false;
    }

    return Guild.deleteOne({id: guild.id})
    .catch(err => {
        console.log(`Error deleting guild ${guild.name}\n${err}`);
    });
}
//#endregion

//#region Config
/**
 * Gets a value from the config.json file
 * @param {String} value Property to get the value from
 */
function getConfigVar(value) {
    var config = require('./config.json');

    if (value in config) return config[value];
    else {
        console.log(`Tried to read value ${value} from config, but it doesn't exist there.`);
        return null;
    }
}

/**
 * Sets a value in the root config.json
 * @param {String} value Name of property to set
 * @param {any} newValue Value to set the property to
 */
function setConfigVar(value, newValue) {
    var config = require('./config.json');
    const fs = require('fs');

    if (value in config) config[value] = newValue;
    else {
        console.log(`Added new paramater ${value} with value ${newValue} to the root config json.`);
        config[value] = newValue;
    }
    
    fs.writeFile('./config.json', JSON.stringify(config), (e) => {
        if (e) {
            console.log(`Error thrown when writing ${newValue} to ${value} in config.json`);
            throw e;
        };
    });
    return true;
}
//#endregion

module.exports = {
    name: 'configHandler',
    description:'Tools to get and set bot information on a guild-specific or general basis',
    createNewGuild: createNewGuild,
    addUser: addUser,
    getUser: getUser,
    newMeet: newMeet,
    addMeetByMessage: addMeetByMessage,
    addMeetByDate: addMeetByDate,
    getMeet: getMeet,
    meetMembers: meetMembers,
    log: log,
    getAttendance: getAttendance,
    getCommandInfo: getCommandInfo,
    setCommandInfo: setCommandInfo,
    getConfigVar: getConfigVar,
    setConfigVar: setConfigVar,
    getGuildValue: getGuildValue,
    setGuildValue: setGuildValue,
    deleteGuild: deleteGuild
}