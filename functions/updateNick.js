const handler = require('../configHandler.js');

function update(uID, guildId) {
    handler.getUser(uID)
    .then(user => {
        if (!user) {
            console.log("Attempted to update a user's nicknames, but they have no account set up");
            return;
        } 

        if (!("name" in user)) {
            console.log("Attempted to update a user's nicknames before their name has been given.");
            throw "This command can't be used right now!";
        }

        let first = user.name.split(' ')[0];
        let last = user.name.split(' ')[1];

        let newName = first.replace(/^\w/, (c) => c.toUpperCase()) + ' ' + last[0].toUpperCase();

        // first letter capitlization from digitalocean.com
        return message.member.setNickname(newName)
        .catch(e => console.log(`Error setting nickname for ${message.author.username} to ${newName}`));
    });

}

module.exports = {
    update: update
}