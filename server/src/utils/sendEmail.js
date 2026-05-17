import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
    try {
        // Create Transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",

            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email Options
        const mailOptions = {
            from: `"Chronova" <${process.env.EMAIL_PASS}>`,
            to,
            subject,
            html,
        };

        // Send Email
        await transporter.sendMail(mailOptions);

        console.log(`Email sent to ${to}`);

    } catch (error) {
        console.error("Email Error:", error.message);
    }
}

export default sendEmail;