import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";

// Routes Imports
import authRoutes from "./src/routes/authRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";

//Config
dotenv.config();

// Database Connection
connectDB();

// Initialize Express
const app = express();

//Middleware

//parse JSON Requests
app.use(express.json());

//Parse URL Encoded Data
app.use(express.urlencoded({ extended: true}));

// Cookie Parser
app.use(cookieParser());

// Enable CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Routes

//Base Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Chronova API is running...",
    });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// Task Routes
app.use("/api/tasks", taskRoutes);

//Global  Error Handler
app.use((err, req, res, next) => {
    console.log(err.stack);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});


// Server Listener

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running in ${
            process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
    );
});