import express from "express";

import { loginUser, registerUser } from "../controllers/authControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===================================
//  AUTH ROUTES
// ===================================

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Protected Profile Route
router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});


export default router;