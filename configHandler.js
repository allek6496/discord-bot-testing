const guildTemplate = {"id": false, "prefix": '~', "bot_spam": false, "moderation": false, "new_members": false};
const dmSettings = {"prefix": ''};

module.exports = {
    name: 'prefixHandler',
    description:'Tools to get and set the prefix of the bot for a certain guild',

    /**
     * Sets a value within a guild
     * @param {string} value The value to change
     * @param {var} newValue The new value to change it to
     * @param {Guild} guild The object representing the guild
     */
    setValue(value, newValue, guild) {
        if (guild == null) {
            console.log('You can\'t set value in a dm channel');
        }

        const config = require('./config.json');
        const fs = require('fs');
        const guildID = guild.id;

        var thisGuild = config.guilds.find(guild => guild.id == guildID);
        
        // check if the guild exists in the json before attempting to set it
        if (thisGuild) {
            if (!thisGuild[value]) {
                console.log(`Added the new property ${value} to guild ${guild.name}.`)
            }
            thisGuild[value] = newValue;
        
        // if it doesn't exist already, then add a guild entry
        } else {
            // set up a new guild template with updated value
            var newGuild = guildTemplate;
            newGuild.id = guildID;
            newGuild[value] = newValue;

            config.guilds.push(newGuild);
        }

        fs.writeFile('./config.json', JSON.stringify(config), (e) => {
            if (e) throw err;
        });

        return true;
    },

    /**
     * Gets a value from a specific guild
     * @param {string} value A string for the property you want to get
     * @param {Guild} guild The guild object the message came from, null if dm
     */
    getValue(value, guild) {
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
        
        const config = require('./config.json');
        const fs = require('fs');
        const guildID = guild.id;

        var thisGuild = config.guilds.find(guild => guild.id === guildID);


        // if the guild exists get the value from it
        if (thisGuild) {
            if (thisGuild[value]) {
                return thisGuild[value];
            } else {
                console.log(`Tried to read ${value} from ${guild.name}, but it doesn't exist as a property`);
            }

        // if it doesn't exist create it and return the default value
        } else {
            console.log(`Recieved request for ${value} from ${guild.name}, but ${guild.name} doesn't exist. Creating a new entry.`)

            // set up a new guild template with updated value
            var newGuild = guildTemplate;
            newGuild.id = guildID;

            config.guilds.push(newGuild);

            fs.writeFile('./config.json', JSON.stringify(config), (e) => {
                if (e) throw err;
            });
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

        const config = require('./config.json');
        const fs = require('fs');
        const guildID = guild.id;

        var thisGuild = config.guilds.find(guild => guild.id = guildID);

        // if the guild exists get the value from it
        if (thisGuild) {
            // go through each guild and remove the first one with a matching ID
            var i = 0;
            for (guild of config.guilds) {
                if (guild.id === guildID) {
                    config.guilds.splice(i, 1);
                    return true;
                }
            } 

            // if we get here then something went wrong
            console.log('Failed to remove guild!')
            return false;

        // if it doesn't exist then there's nothing to do
        } else {
            console.log(`Tried to delete a guild named ${guild.name} that doesn't exist yet`);
            return false;
        }
    }
}