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

        reminderSent: {
            type: Boolean,
            default: false,
        },
    },

    {
        timestamps: true
    }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;