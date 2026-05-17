import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve project root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Imports
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import startReminderJob from "./src/jobs/reminderJob.js";

import authRoutes from "./src/routes/authRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";

// Database connection
connectDB();

// Start reminder schedu ler
startReminderJob();

// Express app initialization
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
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

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});