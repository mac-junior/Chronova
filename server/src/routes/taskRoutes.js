import express from "express";
import { createTask, deleteTask, getUserTask, toggleTaskCompletion, updateTask } from "../controllers/taskControllers.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// TASK ROUTES
// ==============================

// Create task
router.post("/", protect, createTask);

//Get User Tasks
router.get("/", protect, getUserTask);

// Update Task
router.put("/:id", protect, updateTask);

// Toggle Completion
router.patch("/:id/toggle", protect, toggleTaskCompletion);

// Delete Task
router.delete("/:id", protect, deleteTask)


export default router;