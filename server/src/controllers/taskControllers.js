import Task from "../models/Task.js";

// =========================================================================
// CREATE TASK
// =========================================================================
export const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority } = req.body;

        // Validate required fields
        if (!title || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Title and due date are required.",
            });
        }

        // Validate date
        if (isNaN(Date.parse(dueDate))) {
            return res.status(400).json({
                success: false,
                message: "Invalid due date format.",
            });
        }

        // Validate priority
        const allowedPriorities = ["Low", "Medium", "High"];

        if (priority && !allowedPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid priority value.",
            });
        }

        // Create task
        const task = await Task.create({
            user: req.user._id,
            title,
            description: description || "",
            dueDate,
            priority: priority || "Medium",
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully.",
            task,
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};

// =========================================================================
// GET USER TASKS
// =========================================================================
export const getUserTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });

    } catch (error) {
        console.error("Get Tasks Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};

// =========================================================================
// UPDATE TASK
// =========================================================================
export const updateTask = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        const { title, description, dueDate, priority, completed } = req.body;

        // Update fields
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (priority !== undefined) task.priority = priority;
        if (completed !== undefined) task.completed = completed;

        const updatedTask = await task.save();

        return res.status(200).json({
            success: true,
            message: "Task updated successfully.",
            task: updatedTask,
        });

    } catch (error) {
        console.error("Update Task Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};

// =========================================================================
// TOGGLE TASK COMPLETION
// =========================================================================
export const toggleTaskCompletion = async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        task.completed = !task.completed;

        await task.save();

        return res.status(200).json({
            success: true,
            message: task.completed ? "Task marked as completed." : "Task restored to active.",
            task,
        });

    } catch (error) {
        console.error("Toggle Task Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};

// =========================================================================
// DELETE SINGLE TASK
// =========================================================================
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully.",
        });

    } catch (error) {
        console.error("Delete Task Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};

// =========================================================================
// DELETE ALL TASKS
// =========================================================================
export const deleteAllTasks = async (req, res) => {
    try {
        await Task.deleteMany({
            user: req.user._id,
        });

        return res.status(200).json({
            success: true,
            message: "All tasks deleted successfully.",
        });

    } catch (error) {
        console.error("Delete All Tasks Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};