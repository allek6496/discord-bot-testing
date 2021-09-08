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
        guildId: String,

        // Keep track of the message linked to this meeting. Become useless upon closure of the meeting
        announcementID: String,

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
                permissions: {
                    type: String,
                    default: ""
                },
                channels: [{
                    type: String,
                    default: ""
                }] // List of snowflakes for valid channels
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
    if (typeof(ID) != "string") {
        return Promise.reject(`Invalid user ID type. Expected string, recieved ${typeof(ID)}: ${ID}`);
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

function findEmail(email) {
    return User.findOne({email: email}).exec()
    .catch(e => console.log(e));
}

/**
 * Returns the user object with a given id.
 * @param {Snowflake} ID ID of the user to get
 * @returns {Promise} Promise to the requested user object
 * @async
 */
function getUser(ID) {
    return User.findOne({id: ID})
    .populate("meets.meet")
    .exec()
    .catch(err => {
        console.log(`Error getting user with id ${ID}\n${err}`);
    });
}

/**
 * Gets the list of dates a user has attended and been verified for from a specific guild
 * @param {Snowflake} uID User ID
 * @param {Snowflake} guildId ID of the guild to get this user's attendance in
 * @returns List of dates the user attended in YYYY-MM-DD format
 * @async
 */
 async function getAttendance(uID, guildId) {
    let user = await getUser(uID);
    let out = [];

    for (let meet of user.meets) {
        if (meet.valid && meet.meet.guildId == guildId) {
            out += [meet.meet.date.toISOString().substring(0, 9)] // should be YYYY-MM-DD
        } 
    }

    return out;
}

/**
 * Logs a user as valid in a certain meet. Just slightly easier than getUser
 * @param {Snowflake} uID ID of the user to log
 * @param {Snowflake} guildId ID of the guild to log in
 * @param {Snowflake} messageID ID of the message connected to the meet, for id purposes
 * @returns {int} 0: they weren't present, 1: they were present and already verified, 2: they were present and just verified
 * @async
 */
function log(uID, guildId, messageID) {
    return getUser(uID)
    .then(user => {
        // don't let unverified users log
        if (!user || !user.name || user.name == 'N/A') {
            // console.log("Failed to find a user");
            return Promise.reject("UNVERIFIED");
        }
        
        let verified = 0;

        // Go through each meet, looking for one with valid guild and message, and log it as validated
        user.meets.some(meet => {
            if (meet.meet.guildId == guildId && meet.meet.announcementID == messageID) {
                if (meet.valid) verified = 1;
                else verified = 2;
                user.meets[user.meets.indexOf(meet)].valid = true;
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
 * @param {String} guildId ID of the guild to make the new meeting in
 * @param {Object} args {`date`, `messageID`, `active`}
 * @returns {Promise<Meet>} Promise for the created meet.
 * @async
 */
function newMeet(guildId, args) {
    let messageID, date, active;

    active = true;
    
    if ("messageID" in args) messageID = args.messageID;
    if ("date" in args) date = args.date;
    if ("active" in args) active = args.active;
    
    if (!(messageID || date)) {
        console.log("Tried to create a meeting with no information");
    } else if (messageID) {
        if (date) {
            return Meet.create({
                date: date,
                guildId: guildId,
                announcementID: messageID,
                active: active
            }).then(meet => {
                // console.log('1', meet);
                Guild.updateOne({id: guildId}, {$push: {meets: meet._id}}).exec();
            });
        } else {
            let thisDate = Date.now();
            
            return Meet.create({
                date: thisDate,
                guildId: guildId,
                announcementID: messageID,
                active: active
            }).then(meet => {
                // console.log('2', meet);
                Guild.updateOne({id: guildId}, {$push: {meets: meet._id}}).exec();
            });
        }
    } else {
        return Meet.create({
            date: date,
            guildId: guildId,
            active: active
        }).then(meet => {
                // console.log('3', meet);
                Guild.updateOne({id: guildId}, {$push: {meets: meet._id}}).exec();
        });
    }
}

/**
 * Finds a meet given the guildId and either messageID or date
 * @param {Snowflake} guildId ID of the guild to look in
 * @param {Object} args {`messageID`, `date`} One is required to run. Can search with either. Will default to messageID given both.
 * @returns Promise for the meet requested
 * @async
 */
function getMeet(guildId, args) {
    let messageID, date;
    if ('messageID' in args) messageID = args.messageID;
    if ('date' in args) date = args.date;

    if (!(messageID || date)) {
        console.log("Tried to get meet with no information");
    } else if (messageID) {
        return Meet.find({
            guildId: guildId,
            announcementID: messageID
        }).then(meets => {
            if (meets.length) {
                return meets[0]
            } else {
                // as stated elsewhere, this is fine because it's inside of a promise.
                // these @async commands can't return non-promises, because they're often .then'ed
                console.log(`Failed to find meet with messageID ${messageID} in ${guildId}`);
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
            guildId: guildId
        }).then(meets => {
            // if the meet was found, return the most recent on the day
            if (meets.length) {
                if (meets.length > 1) console.log(`WARNING, MULTIPLE MEETINGS ON DATE ${date} IN GUILD ${guildId} RETURNING MOST RECENT`);
                let greatest = Math.max.apply(Math, meets.map(meet => {return meet.date.getTime()}));
                return meets.find(meet => meet.date.getTime() == greatest);
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
 * @param {Snowflake} guildId ID of the guild to look in
 * @param {Object} args {`messageID`, `date`} One is required to run. Can search with either. Will default to messageID given both.
 * @returns {[User]} Returns list of users that were a part of this meeting
 */
async function meetMembers(guildId, args) {
    // First look for the meet
    let meet = await getMeet(guildId, args);

    return User.find({
        meets: {$in: [{
            meet: meet._id,
            valid: {$exists: true}
        }]}
    }).populate('meets.meet')
    .catch(err => {console.log(`Error finding all members present in meets matching ${args} in guild ${guildId}\n${err}`)});
}


//I could probably combine these two but whatever
/**
 * Adds a meet to a user in a specific guild using the attahced announcement message.
 * @param {Snowflake} uID ID of the user to add the meeting to
 * @param {Snowflake} guildId ID of the guild the meeting belongs to
 * @param {Snowflake} messageID ID of the message attached to the meeting
 * @returns {Promise<Meet>} Returns a promise for the meeting added
 * @async
 */
function addMeetByMessage(uID, guildId, messageID, valid=false) {
    return getMeet(guildId, {messageID: messageID})
    .then(meet => {
        if (meet) {
            User.updateOne({
                id: uID
            }, {
                $push: {meets: {meet: meet._id, valid: valid}} 
            }).catch(err => {console.log(`Error adding meet with messageID ${messageID} to user ${uID} in ${guildId}\n${err}`)});

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
 * @param {Snowflake} guildId The id of the guild in question
 * @param {String} date A string representing the date
 * @returns {Meet} The meeting added
 * @async
 */
function addMeetByDate(uID, guildId, date) {
    return getMeet(guildId, {date: date})
    .then(async meet => {
        // If it exists, add it to the user's list of attended meets
        if (meet) {
            User.updateOne({
                id: uID
            }, {
                $push: {meets: {meet: meet._id, valid: true}}
            });

            return meet;
        // If it doesn't create a meet and then add it to the user
        } else {
            let thisMeet = await newMeet(guildId, {date: date})
            .catch(err => {console.log(`Error building new meet using only date ${date}\n${err}`)});

            User.updateOne({
                id: uID
            }, {
                $push: {meets: {meet: thisMeet._id, valid: true}}
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
* @async
*/
function createNewGuild(guild) {
    const newGuild = new Guild({
        id: guild.id,
        name: guild.name,
        prefix: '~',
    });
 
    return newGuild.save()
    .then(guild => {
        console.log(`Created guild named ${guild.name}`);
        return newGuild;
    });
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
        // I don't want an error message here, so just resolve as null
        return Promise.resolve(null);
    } else if (typeof(guild) === 'string') {
        return Promise.reject('ERROR: PASSED ID AS GUILD, PLEASE PASS GUILD OBJECT');
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
            // need to return a 
            return Promise.resolve(dmSettings[value]);
        } else {
            console.log(`${value} is not set as a default value for dm channels`);
            return Promise.resolve(null);
        }
    } else if (typeof(guild) === 'string') {
        // an error is probably better form, but this should work and it saves space
        return Promise.reject('ERROR: PASSED ID AS GUILD, PLEASE PASS GUILD OBJECT');
    }

    const thisGuild = Guild.findOne({id: guild.id}, [value, "name"]);

    if (value == "meets") {
        thisGuild.populate("meets")
    } else if (value == "unclaimed") {
        thisGuild.populate("unclaimed.meets")
    }

    return thisGuild
    .then(async thisGuild => {
        // console.log("Looking for", value, "found", thisGuild);
        if (thisGuild && value in thisGuild) {
            // console.log(`Found that ${value} is ${thisGuild[value]} in ${thisGuild.name}`)
            return thisGuild[value];
        } else if (!thisGuild) {
            // await to prevent multiple creations
            const newGuild = await createNewGuild(guild);
                    
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
        return Promise.resolve(null);
    }

    if (!guild) {
        return Promise.resolve(clientCommand);
    }

    // I know I'm really inconsistent with using await vs .then, I don't really have a method to this madness
    // however, after await it returns a promise, so normal returns work following this keyword
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
    if (!guild) return Promise.resolve(null);

    var commands = await getGuildValue('commands', guild);
    if (!commands) commands = {};

    // There's a much smarter way to handle this, but I can't be bothered, cause this should also work (though it'll probably be a bit slower)
    if ((commands && commandName in commands) || //The command is saved and has some value (normal case)
        guild.client.commands.get(commandName) || // The command or the command's alias is saved as a valid command for the client
        guild.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))) {
        
        commands[commandName] = newInfo;
        console.log(commands, newInfo);
        return setGuildValue('commands', commands, guild);

    } else {
        // setGuildValue('commands', commands, guild);
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
        console.log('Tried to delete a dm channel');
        // i suppose the better way to do this would be to use Promise.resolve(handler.function()) outside if this module, that way I don't have to return like this
        // but this works so chill I'm tyring to finish this
        return Promise.resolve(false);
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
    findEmail: findEmail,
    getAttendance: getAttendance,
    getCommandInfo: getCommandInfo,
    setCommandInfo: setCommandInfo,
    getConfigVar: getConfigVar,
    setConfigVar: setConfigVar,
    getGuildValue: getGuildValue,
    setGuildValue: setGuildValue,
    deleteGuild: deleteGuild
}