import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Complaint from '../models/complaint.js'; 

// 1. Configure the email transporter using credentials from .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 2. Define the function that finds and processes stale complaints
const checkAndSendReminders = async () => {
    console.log('Running daily reminder check...');
    try {
        // Find complaints that were created more than 14 days ago and are still awaiting a response
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        const staleComplaints = await Complaint.find({
            status: { $in: ['Filed', 'Awaiting Response'] },
            createdAt: { $lte: twoWeeksAgo }
        }).populate('user');  

        if (staleComplaints.length === 0) {
            console.log('No stale complaints found.');
            return;
        }

 
        console.log(`Found ${staleComplaints.length} stale complaints. Sending reminders...`);

        // 3. Loop through the stale complaints and send an email for each one
        for (const complaint of staleComplaints) {
            if (complaint.user && complaint.user.email) {
                const mailOptions = {
                    from: '"AI Complaint Assistant" <noreply@anycomplaint.ai>',
                    to: complaint.user.email,
                    subject: `💡 Time to follow up on your complaint about "${complaint.category}"`,
                    html: `
                        <p>Hello,</p>
                        <p>This is a reminder that it has been over two weeks since you filed your complaint regarding a "${complaint.category}" issue.</p>
                        <p>Following up is often necessary to get a resolution. You can generate an AI-drafted follow-up letter by clicking the link below:</p>
                        <a href="http://localhost:${process.env.PORT || 8080}/follow-up/${complaint._id}" target="_blank">Generate Follow-Up Letter</a>
                        <p>Thank you for using the AI Complaint Assistant.</p>
                    `
                };

                const info = await transporter.sendMail(mailOptions);
                console.log(`Reminder email sent to ${complaint.user.email}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
        }
    } catch (error) {
        console.error('Error during reminder check:', error);
    }
};

// 4. Schedule the job to run once every day at 9:00 AM
export const startReminderService = () => {
    cron.schedule('34 10 * * *', checkAndSendReminders, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    console.log('Reminder service scheduled to run daily at 2:00 AM IST.');
};