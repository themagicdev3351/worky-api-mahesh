const nodemailer = require('nodemailer');
const templateService = require('../services/templateService');
const { SMTPConfig } = require('../constant/appConstant');
const { staticResponseMessageObject } = require('../lib/responseMessages/message')

const transporter = nodemailer.createTransport({
    host: SMTPConfig.HOST,
    port: SMTPConfig.PORT,
    secure: false,
    requireTLS: true,
    auth: {
        user: SMTPConfig.EMAIL,
        pass: SMTPConfig.PASSWORD,
    },
    tls: { rejectUnauthorized: false },
})

const sendEmail = async (mailOptions) => {
    transporter.verify(async (error) => { if (error) throw staticResponseMessageObject.somethingWentToWrong });
    const emailResponse = await transporter.sendMail(mailOptions);
    console.log(emailResponse, 'emailResponse')
    if (!emailResponse.messageId) return { error: MESSAGES.SOMETHING_WENT_WRONG };
    return { result: 'Email sent successfully' };
}

module.exports = {
    sendForgotPasswordEmail: async (toEmail, name, url) => {
        const content = `Hey ${name}, seems like you forgot your password for workybook. If this is true, click below to reset your password.`;
        const subject = 'Restore Password';
        const title = 'Restore Password';
        const mainLink = url;

        const html = templateService.getForgotTemplate({ name, content, subject, title, mainLink });

        const mailOptions = {
            from: SMTPConfig.FROM_EMAIL,
            to: toEmail,
            subject: 'Request Reset Password',
            html
        }

        const sendEmailResponse = await sendEmail(mailOptions);
        if (!sendEmailResponse) throw staticResponseMessageObject.emailNotSent;

        return sendEmailResponse;
    },

    sendVerifyingUserEmail: async (toEmail, name, url) => {
        const content = `Please verify you email. If it's you, click below to verify email.`;
        const subject = 'Verify Email';
        const title = 'Verify Email';
        const mainLink = url;

        const html = templateService.getForgotTemplate({ name, content, subject, title, mainLink });

        const mailOptions = {
            from: SMTPConfig.FROM_EMAIL,
            to: toEmail,
            subject: 'Request Verify Email',
            html
        }

        console.log(mailOptions)

        const sendEmailResponse = await sendEmail(mailOptions);
        console.log(sendEmailResponse)
        if (!sendEmailResponse) throw staticResponseMessageObject.emailNotSent;

        return sendEmailResponse;
    },
}