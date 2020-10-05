const guildTemplate = {
    "id": false, 
    "prefix": '~', 
    "bot_spam": false, 
    "moderation": false, 
    "new_members": false, 
    "announcements": false,
    "new": false,
    "exec": false,
    "member": false,
    "commands": {
        "setup": {"permissions": "ADMINISTRATOR"}, 
        "cleanup": {"permissions": "ADMINISTRATOR"}, 
        "prefix": {"permissions": "ADMINISTRATOR"}, 
        "reload": {"permissions": "ADMINISTRATOR"}, 
        "setpermissions": {"permissions": "ADMINISTRATOR"},
        "setchannels": {"permissions": "ADMINISTRATOR"}
    },
    "meetings": {

    },
    "on_open": {},
    "on_start": {}
};

const dmSettings = {"prefix": ''};

module.exports = {
    name: 'prefixHandler',
    description:'Tools to get and set bot information for a certain guild',

    /**
     * Sets command specific information for a specific guild
     * @param {Guild} guild Guild object for the specific instance of the command
     * @param {String} commandName Name of the command to set the info for
     * @param {Object} newInfo New information to give to the command (replaces, doesn't add)
     */
    setCommandInfo(guild, commandName, newInfo) {
        var commands = this.getGuildValue('commands', guild);

        if (commandName in commands) {
            commands[commandName] = newInfo;
            this.setGuildValue('commands', commands, guild);
        } else {
            console.log(`Tried to set ${commandName} to ${newInfo} in ${guild.name}, but it doesn't exist as a valid command!`);
        }
    },

    /**
     * Gets guild specific information for a command
     * @param {Guild} guild The guild object for the specific instance of the command
     * @param {String} commandName Name of the command to get information from
     */
    getCommandInfo(guild, commandName) {
        const commands = this.getGuildValue('commands', guild);

        if (commandName in commands) {
            return commands[commandName];
        } else {
            console.log(`Tried to pull value for ${commandName} in ${guild.name}, but there is no information for this command here.`);
            return null;
        }
    },

    /**
     * Gets a value from the config.json file
     * @param {String} value Property to get the value from
     */
    getConfigVar(value) {
        var config = require('./config.json');

        if (value in config) return config[value];
        else {
            console.log(`Tried to read value ${value} from config, but it doesn't exist there.`);
            return null;
        }
    },

    /**
     * Sets a value in the root config.json
     * @param {String} value Name of property to set
     * @param {any} newValue Value to set the property to
     */
    setConfigVar(value, newValue) {
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
    },

    /**
     * Sets a value within a guild
     * @param {string} value The value to change
     * @param {var} newValue The new value to change it to
     * @param {Guild} guild The object representing the guild
     */
    setGuildValue(value, newValue, guild) {
        if (guild === null) {
            return;
        }

        var guilds = this.getConfigVar('guilds');

        const guildID = guild.id;
        var thisGuild = guilds.find(guild => guild.id == guildID);
        
        // check if the guild exists in the json before attempting to set it
        if (thisGuild) {
            if (!thisGuild[value]) {
                    console.log(`Adding the new property ${value} to guild ${guild.name}.`)
            }
            thisGuild[value] = newValue;
        
        // if it doesn't exist already, then add a guild entry
        } else {
            // set up a new guild template with updated value
            var newGuild = guildTemplate;
            
            newGuild.id = guildID;
            newGuild[value] = newValue;

            guilds.push(newGuild);
        }

        this.setConfigVar('guilds', guilds);

        return true;
    },

    /**
     * Gets a value from a specific guild
     * @param {string} value A string for the property you want to get
     * @param {Guild} guild The guild object the message came from, null if dm
     */
    getGuildValue(value, guild) {
        if (guild == null) {
            if (dmSettings[value] == null) {
                console.log(`${value} is not set as a default value for dm channels`);
                return null;
            } else {
                return dmSettings[value];
            }
        } else if (typeof guild === 'string') {
            return console.log('ERROR: PASSED ID AS GUILD, PLEASE PASS GUILD OBJECT');
        }
        
        const fs = require('fs');
        var guilds = this.getConfigVar('guilds');
        const guildID = guild.id;

        var thisGuild = guilds.find(guild => guild.id === guildID);


        // if the guild exists get the value from it
        if (thisGuild) {
            if (thisGuild[value]) {
                return thisGuild[value];
            } else {
                console.log(`Tried to read ${value} from ${guild.name}, but it doesn't exist as a property. Setting to default and returning.`);
                if (value in guildTemplate) {
                    this.setGuildValue(value, guildTemplate[value], guild);
                    return guildTemplate[value];
                } else {
                    console.log(`${value} was requested from ${guild.name}, but it's not a default value for guilds, returning null.`);
                    return null;
                }
            }

        // if it doesn't exist create it and return the default value
        } else {
            console.log(`Recieved request for ${value} from ${guild.name}, but ${guild.name} doesn't exist. Creating a new entry.`)

            // set up a new guild template with updated value
            var newGuild = guildTemplate;
            newGuild.id = guildID;

            guilds.push(newGuild);

            this.setConfigVar('guilds', guilds);
            
            return newGuild[value];
        }
    },

    /**
     * Removes a guild from the json file after it's no longer needed.
     * @param {Guild} guild The ID of the guild to remove.
     */
    deleteGuild(guild) {
        if (guild == null) {
            console.log('Tried to delete a dm channel')
            return false;
        }

        var guilds = this.getConfigVar('guilds');
        const fs = require('fs');
        const guildID = guild.id;

        var thisGuild = guilds.find(guild => guild.id = guildID);

        // if the guild exists get the value from it
        if (thisGuild) {
            // go through each guild and remove the first one with a matching ID
            var i = 0;
            for (guild of guilds) {
                if (guild.id === guildID) {
                    guilds.splice(i, 1);
                    this.setConfigVar('guilds', guilds);
                    return true;
                }
            } 

            // if we get here then something went wrong
            console.log(`Failed to remove guild named ${guild.name}!`)
            return false;

        // if it doesn't exist then there's nothing to do
        } else {
            console.log(`Tried to delete a guild named ${guild.name} that doesn't exist yet`);
            return false;
        }
    },

    /**
     * Adds empty values for all commands, so that they can be restricted to certian permissions or channels in the future.
     * @param {Discord Client} client The discord client running this command
     */
    updateCommands(client) {
        // go through each command and check if it's already in the guild template
        client.commands.forEach(command => {
            // if it's not already in the template, add it
            if (!guildTemplate.commands.hasOwnProperty(command.name)) {
                guildTemplate["commands"][command.name] = {};
            }
        });
    }
}