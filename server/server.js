import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve .env path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Imports
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import startReminderJob from "./src/jobs/reminderJob.js";

import authRoutes from "./src/routes/authRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";

// Create app FIRST (clean separation)
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Base route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chronova API is running...",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// PORT
const PORT = process.env.PORT || 5000;

//  START SERVER ONLY AFTER DB CONNECTS
const startServer = async () => {
  try {
    await connectDB(); // MUST wait for MongoDB

    console.log("MongoDB connected successfully");

    // Start reminder job ONLY after DB is ready
    startReminderJob();

    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
      );
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();