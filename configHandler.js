const guildTemplate = {"id": false, "prefix": '~'};
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
        if (guildTemplate[value] == null){
            console.log(`Tried to set ${value} in config.json, but it doesn't exist`);
            return false;
        } else if (guild == null) {
            console.log('You can\'t set value in a dm channel');
        }

        const config = require('./config.json');
        const fs = require('fs');
        const guildID = guild.id;

        // check if the guild exists in the json before attempting to set it
        if (config.guilds.some(guild => guild.id == guildID)) {
            config.guilds.filter(guild => guild.id == guildID)[0][value] = newValue;
        
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
        if (guildTemplate[value] == null){
            console.log(`Tried to read ${value} from config.json, but it doesn't exist`);
            return null;
        } else if (guild == null) {
            if (dmSettings[value] == null) {
                console.log(`${value} is not set as a default value for dm channels`);
                return null;
            } else {
                return dmSettings[value];
            }
        }

        const config = require('./config.json');
        const fs = require('fs');
        const guildID = guild.id;

        // if the guild exists get the value from it
        if (config.guilds.some(guild => guild.id == guildID)) {
            return config.guilds.filter(guild => guild.id == guildID)[0][value];

        // if it doesn't exist create it and return the default value
        } else {
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

        // if the guild exists get the value from it
        if (config.guilds.some(guild => guild.id == guildID)) {

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
            console.log(`Tried to delete a guild named ${guild.name} that doesn\'t exist yet`);
            return false;
        }
    }
}