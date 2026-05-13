import express from "express";

import { loginUser, registerUser } from "../controllers/authControllers.js";

const router = express.Router();

// ===================================
//  AUTH ROUTES
// ===================================

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);


export default router;