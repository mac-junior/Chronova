import cron from "node-cron";
import Task from "../models/Task.js";
import sendEmail from "../utils/sendEmail.js";

// =========================================================================
// CHRONOVA AUTOMATED EMAIL REMINDER SENTINEL ENGINE (PART 1)
// =========================================================================

const startReminderJob = () => {
  // Cron monitors launch on the absolute 00 second mark of every single minute
  cron.schedule("*/1 * * * *", async () => {
    try {
      const now = new Date();

      // OPTIMIZATION FIXED: Instead of tracking a tight 60-second window which skips 
      // tasks due to microsecond offsets, we fetch ALL uncompleted tasks whose 
      // deadline is less than or equal to the current clock time.
      const upcomingTasks = await Task.find({
        dueDate: { $lte: now },
        completed: false,
        // Fallback supports both field mappings to ensure high utility execution
        $or: [
          { isReminderSent: false },
          { isReminderSent: { $exists: false } },
          { reminderSent: false },
          { reminderSent: { $exists: false } }
        ]
      }).populate("user");

      // Silently return if no matching pending schedules are discovered
      if (!upcomingTasks.length) return;

            // =========================================================================
      // DISPATCH LOOP & FIELD UPDATE PIPELINE (PART 2)
      // =========================================================================
      for (const task of upcomingTasks) {
        // Enforce guard check preventing crashes on phantom or deleted users
        if (!task.user || !task.user.email) {
          console.warn(`[Chronova Cron]: Task ${task._id} skipped due to missing user relational arrays.`);
          continue;
        }

        try {
          await sendEmail(
            task.user.email,
            `Reminder: ${task.title}`,
            `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #09090b; color: #f4f4f5; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; max-w-md: 100%;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                <h2 style="color: #6366f1; margin: 0; font-size: 20px; font-weight: 800; tracking-tight; text-transform: uppercase;">Chronova</h2>
              </div>
              
              <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5;">Hello <strong>${task.user.username || "User"}</strong>,</p>
              <p style="font-size: 14px; color: #e4e4e7; line-height: 1.5;">This is an automated notification alert triggered for your active task memory block:</p>
              
              <div style="background-color: rgba(255,255,255,0.02); border-left: 3px solid #6366f1; padding: 12px 16px; margin: 20px 0; border-radius: 4px 12px 12px 4px;">
                <h3 style="color: #ffffff; margin: 0; font-size: 15px; font-weight: 600;">${task.title}</h3>
                ${task.description ? `<p style="color: #71717a; font-size: 12px; margin: 6px 0 0 0; line-height: 1.4;">${task.description}</p>` : ""}
              </div>
              
              <p style="font-size: 12px; color: #71717a;">Scheduled Execution Time:</p>
              <strong style="color: #f4f4f5; font-size: 13px; font-family: monospace;">
                ${new Date(task.dueDate).toLocaleString()}
              </strong>
              
              <p style="font-size: 13px; color: #a1a1aa; margin-top: 24px;">Maximize your output. Stay on schedule.</p>
              
              <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 24px 0;" />
              
              <p style="font-size: 11px; color: #52525b; line-height: 1.4; margin: 0;">
                <strong>Chronova Tracking Systems</strong><br />
                Your Tasks. Your Time.
              </p>
            </div>
            `
          );

          // DATA UPDATE ENGAGEMENT ENGINE
          // We flag BOTH layout parameters so frontend counters and backend arrays match 100%
          task.isReminderSent = true;
          task.reminderSent = true;
          
          await task.save();
          console.log(`[Chronova Dispatch]: Notification email dispatched successfully to ${task.user.email} for: "${task.title}".`);

        } catch (mailError) {
          // Captures internal node-mailer or SMTP transporter errors inside the loop
          console.error(`[Chronova Loop Error]: Failed sending mail for task ID ${task._id}:`, mailError.message);
        }
      }
    } catch (error) {
      // VISIBILITY FIXED: Exposes complete server fault logs (like MongoDB auth or model crashes)
      console.error("[Chronova Global Cron Exception]: Reminder job channel execution failed.");
      console.error("Diagnostic Stack Trace Error Layout:", error);
    }
  });
};

export default startReminderJob;
