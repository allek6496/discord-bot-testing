const { Console } = require('console'); // idk what this does
const mongoose    = require('mongoose');
const {Snowflake} = require('discord.js')

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
//         // "setpermissions": {"permissions": "ADMINISTRATOR"}, //TODO: this is awful
//         // "setup": {"permissions": "ADMINISTRATOR"}, 
//         // "setvalue": {"permissions": "ADMINISTRATOR"},
//     },
//     "meetings": {

//     },
//     "on_open": {},
//     "on_start": {}
// };

const dmSettings = {"prefix": '~'};

/**
* Creates a guild document in the database
* @param {Guild} guild The guild object to create an entry for
* @returns {Object} Returns the guild object, as though just pulled from Guild.findOne()
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
 * Adds a user to the database, free of logged meets.
 * @param {Snowflake} ID ID of the user to add
 * @param {string} name Full name of the user
 * @param {string} email WRDSB email of the user
 * @param {(Meet[]|string[])} meets List of meets the user has attended
 * @returns {Promise} Returns a promise for user object created
 */
function addUser(ID, name, email, meets=[]) {
    if (!typeof(ID) != "string") {
        return console.log(`Invalid user ID type. Expected string, recieved ${typeof(guildID)}: ${ID}`);
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
 */
function getUser(ID) {
    return User.findOne({id: ID})
    .populate("meets")
    .exec()
    .catch(err => {
        console.log(`Error getting user with id ${ID}\n${err}`);
    });
}

//FLAG
/**
 * Assigns a meet to a user. Will always set the meet as unverified.
 * @param {Snowflake} uID ID of the user to add attendance to
 * @param {Snowflake} guildID The id of the guild in question
 * @param {String} date A string representing the 
 */
function addMeet(uID, guildID, date) {
    let start = new Date(date).setHours(00, 00, 00);
    let end   = new Date(date).setHours(23, 59, 59);

    // First, look for an existing meet at this date in this guild
    Meet.findOne({
        date: {
            $gte: start,
            $lte: end
        }, 
        guildID: guildID
    }).exec()
    .then(meet => {
        // If it exists, add it to the user's list of attended meets
        if (meet) {
            User.updateOne({
                id: uID
            }, {
                $push: {meet: meet._id, valid: false}
            });

            return meet;
        // If it doesn't create a meet and then add it to the user
        } else {
            Meet.create({
                date: new Date(date),
                guildID: guildID 
                // active defaults to true
            }).then(newMeet => {
                User.updateOne({
                    id: uID
                }, {
                    $push: {meet: newMeet._id, valid: false}
                }).catch(err => {
                    console.log(`Error pushing new meet to user ${uID}'s meet list\n${err}`);
                });

                return newMeet;
            }).catch(err => {
                console.log(`Error creating a new meet at date ${start}\n${err}`);
                return null;
            })
        }
    }).catch(err => {
        console.log(`Error finding a meet at date ${date}\n${err}`);
        return null;
    });
}

/**
 * Gets the list of dates a user has attended and been verified for from a specific guild
 * @param {Snowflake} uID User ID
 * @param {Snowflake} guildID ID of the guild to get this user's attendance in
 * @returns List of dates the user attended in YYYY-MM-DD format
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
 * Sets a value within a guild
 * @param {string} value The value to change
 * @param {var} newValue The new value to change it to
 * @param {Guild} guild The object representing the guild
 */
function setGuildValue(value, newValue, guild) {
    if (guild === null) {
        return;
    }
    
    return Guild.updateOne({id: guild.id}, {value: newValue})
    .catch(err => {
        console.log(`Error setting ${value} in ${guild.name} to ${newValue}\n${err}`);
    })
}

/**
 * Gets a value from a specific guild
 * @param {string} value A string for the property you want to get
 * @param {Guild} guild The guild object the message came from, null if dm
 */
async function getGuildValue(value, guild) {
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
    
    const thisGuild = await Guild.findOne({id: guild.id}, [value, "name"])
    .catch(err => {
        console.log(`Error getting ${value} from ${thisGuild.id}\n${err}`);
        return null;
    });

    if (thisGuild && value in thisGuild) {
        console.log(`Found that ${value} is ${thisGuild[value]} in ${thisGuild.name}`)
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
}

/**
 * Gets guild specific information for a command
 * @param {Guild} guild The guild object for the specific instance of the command. Null if DM channel
 * @param {String} commandName Name of the command to get information from
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
 */
function setCommandInfo(guild, commandName, newInfo) {
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
        console.log(`Tried to set ${commandName} to ${newInfo} in ${guild.name}, but it doesn't exist as a valid command!`);
    }
}

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


/**
 * Removes a guild from the json file after it's no longer needed.
 * @param {Guild} guild The ID of the guild to remove.
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

module.exports = {
    name: 'configHandler',
    description:'Tools to get and set bot information on a guild-specific or general basis',
    createNewGuild: createNewGuild,
    addUser: addUser,
    getUser: getUser,
    addMeet: addMeet,
    getAttendance: getAttendance,
    getCommandInfo: getCommandInfo,
    setCommandInfo: setCommandInfo,
    getConfigVar: getConfigVar,
    setConfigVar: setConfigVar,
    getGuildValue: getGuildValue,
    setGuildValue: setGuildValue,
    deleteGuild: deleteGuild
}