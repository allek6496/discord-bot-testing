const nodemailer = require('nodemailer');

var transporter = null;

module.exports = {
    transporter,
    
    /**
     * 
     * @param {Object} auth type, user, pass, clientId, clientSecret, refreshToken
     */
    initMailer(auth) {
        // If it's already been set up, don't set it up again.
        if (transporter) return true;
        
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth
        });

        return;
    },

    /**
     * Sends an email from "verifycsclub@gmail.com" using nodemailer
     * @param {string} contents The contents of the email to send
     * @param {string} title The subject line of the email to send
     * @param {string} recipient The email address to send to
     */
    async sendEmail(contents, title, recipient) {
        if (!this.transporter) await this.initMailer();

        const mailOptions = {
            from: "verifycsclub@gmail.com",
            to: recipient,
            subject: title,
            text: contents
        };
        
        this.transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return false;
            } else {
                return true;
            }
        });
    }
}