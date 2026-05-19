import cron from "node-cron";

import Task from "../models/Task.js";
import User from "../models/User.js";

import sendEmail from "../utils/sendEmail.js";

// ===========================================
// REMINDER CRON JOB (DEV MODE)
// ===========================================

const startReminderJob = () => {

    // Runs every 5 seconds
    cron.schedule("*/5 * * * * *", async () => {

        // console.log("Checking reminders...");

        try {

            const now = new Date();

            // 30 seconds ahead (DEV TESTING)
            const thirtySecondsLater = new Date(
                now.getTime() + 30 * 1000
            );

            // Find Upcoming Tasks
            const upcomingTasks = await Task.find({
                dueDate: {
                    $gte: now,
                    $lte: thirtySecondsLater,
                },

                completed: false,

                reminderSent: false,
            }).populate("user");

            //  console.log(
            //     `Found ${upcomingTasks.length} upcoming task(s)`
            // );

            // Loop Through Tasks
            for (const task of upcomingTasks) {

                const user = task.user;

                // Send Email
                await sendEmail(
                    user.email,
                    `Reminder: ${task.title}`,

                    `
                    <div style="
                        font-family: Arial;
                        padding: 20px;
                    ">

                        <h2>Chronova Reminder</h2>

                        <p>Hello ${user.username},</p>

                        <p>
                            This is a reminder that your task:
                        </p>

                        <h3>${task.title}</h3>

                        <p>
                            is scheduled for:
                        </p>

                        <strong>
                            ${new Date(
                                task.dueDate
                            ).toLocaleString()}
                        </strong>

                        <p>
                            Stay productive!
                        </p>

                        <hr />

                        <p>
                            Chronova
                            <br />
                            Your Tasks. Your Time.
                        </p>

                    </div>
                    `
                );

                // Mark Reminder As Sent
                task.reminderSent = true;

                await task.save();

                console.log(
                    `Reminder sent for task: ${task.title}`
                );
            }

        } catch (error) {

            console.error(
                "Reminder Job Error:",
                error.message
            );
        }
    });
};

export default startReminderJob;