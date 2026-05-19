import cron from "node-cron";
import Task from "../models/Task.js";
import sendEmail from "../utils/sendEmail.js";

// ===========================================
// REMINDER CRON JOB
// ===========================================

const startReminderJob = () => {
  // Runs every minute (more realistic than every few seconds)
  cron.schedule("*/1 * * * *", async () => {
    try {
      const now = new Date();

      // Small buffer window to avoid missing tasks due to cron timing
      const nextMinute = new Date(now.getTime() + 60 * 1000);

      const upcomingTasks = await Task.find({
        dueDate: {
          $gte: now,
          $lte: nextMinute,
        },
        completed: false,
        reminderSent: false,
      }).populate("user");

      if (!upcomingTasks.length) return;

      for (const task of upcomingTasks) {
        if (!task.user?.email) continue;

        await sendEmail(
          task.user.email,
          `Reminder: ${task.title}`,
          `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Chronova Reminder</h2>

            <p>Hello ${task.user.username || "there"},</p>

            <p>This is a reminder for your task:</p>

            <h3>${task.title}</h3>

            <p>Scheduled for:</p>

            <strong>
              ${new Date(task.dueDate).toLocaleString()}
            </strong>

            <p>Stay productive!</p>

            <hr />

            <p>
              Chronova<br />
              Your Tasks. Your Time.
            </p>
          </div>
          `
        );

        task.reminderSent = true;
        await task.save();
      }
    } catch (error) {
      // In production we avoid console spam, but still keep error visibility
      console.error("Reminder job failed");
    }
  });
};

export default startReminderJob;