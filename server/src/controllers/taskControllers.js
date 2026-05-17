import Task from "../models/Task.js";

// ===========================
// CREATE TASK
// ===========================
export const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority } = req.body;

        // Validation
        if (!title || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Title and Due Date are required"
            });
        }

        // Create task
        const task = await Task.create({
            user: req.user._id,
            title,
            description,
            dueDate,
            priority
        });

        res.status(201).json({
            success: true,
            message: "Task created successfully!",
            task,
        });

    } catch (error) {
        console.error("Unexpected error occurred:", error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

//  ====================================
//  GET USER TASKS
//  =====================================

export const getUserTask = async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.user._id,
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });

    } catch (error) {
        console.error("Unexpected error occured:", error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


// =============================
// UPDATE TASK
// =============================

export const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        //Check Task
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Check ownership
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        // Update Task
        const updatedTask = findByIdAndUp(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            sucess: true,
            message: "Task updated successfully!",
            task: updatedTask,
        });

    } catch (error) {
        console.error(error);

         res.status(500).json({
            success: false,
            message: "Server Error",
         });      
    }
};


// =========================================
// TOGGLE TASK COMPLETION
// =========================================

export const toggleTaskCompletion = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        // Check task
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Check Ownership
        if (task.user.toString() !== re.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }

        // Toggle Completed Status
        task.completed = !task.completed;

        await task.save();

        res.status(200).json({
            success: true,
            message: "Task status updated",
            task,
        });

    } catch (error) {
        console.error("Unexpected Error:", error);
        
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};



// =========================================
// DELETE TASK
// =========================================

export const deleteTask = async (req, res) => {
    try {
        const task =  await Task.findById(req.params.id);

        // Check Task
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }


        // Check Ownership
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        await task.deleteOne();

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });

    } catch (error) {
        console.error("Unexpected errror:", error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
        
    }
}


export const deleteAllTasks = async (req, res) => {
    try {
        // Delete ALL tasks belonging to the logged-in user
        const result = await Task.deleteMany({
            user: req.user._id,
        });

        res.status(200).json({
            success: true,
            message: "All tasks deleted successfully",
            deletedCount: result.deletedCount,
        });

    } catch (error) {
        console.error("Unexpected errror:", error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}