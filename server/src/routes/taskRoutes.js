import express from "express";
import {
    createTask,
    deleteTask,
    getUserTask,
    toggleTaskCompletion,
    updateTask,
    deleteAllTasks
} from "../controllers/taskControllers.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create task
router.post("/", protect, createTask);

// Get User Tasks
router.get("/", protect, getUserTask);

// Update Task
router.put("/:id", protect, updateTask);

// Toggle Completion
router.patch("/:id/toggle", protect, toggleTaskCompletion);

// Delete single task
router.delete("/:id", protect, deleteTask);

// Delete ALL tasks
router.delete("/", protect, deleteAllTasks);

export default router;