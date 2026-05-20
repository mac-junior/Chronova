import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
        },

        description: {
            type: String,
            default: " ",
        },

        dueDate: {
            type: Date,
            required: [true, "Due date is required"],
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },

        completed: {
            type: Boolean,
            default: false,
        },

        // Legacy background indicator support tracking field
        reminderSent: {
            type: Boolean,
            default: false,
        },

        // FRONTEND SYNCHRONIZATION FIXED: Explicit mapping for live UI trackers
        isReminderSent: {
            type: Boolean,
            default: false,
        },

        // ALARM SYSTEM GUARD FIX: Tracks if browser ring signals were acknowledged
        isAlarmDismissed: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true
    }
);

// =========================================================================
// PRODUCTION PERFORMANCE INDEXES
// =========================================================================
// This compound index optimizes cron engine execution. It instructs MongoDB 
// to instantly target active, un-reminded tasks by their deadline matrix.
taskSchema.index({ completed: 1, isReminderSent: 1, reminderSent: 1, dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
