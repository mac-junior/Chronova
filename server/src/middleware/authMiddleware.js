import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ========================
// PROTECT ROUTES
// ========================

export const protect = async (req, res, next) => {
    let token;

    try {
        // Check authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {

            // Extract token
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find user
            req.user = await User.findById(decoded.id).select("-password");

            next();

        } else {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token"
            });
        }

    } catch (error) {
        console.error("Unexpected Error:", error);

        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed"
        });
    }
};