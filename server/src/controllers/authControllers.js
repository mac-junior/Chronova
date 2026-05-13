import bcrypt from "bcryptjs";

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// ===================================
//  REGISTER USER
// ===================================
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        //validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        //check Existing User
        const userExists = await User.findOne({email });

        if(userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        //Hash Password
        const salt = await bcrypt.genSalt(10);

        const hashPassword = await bcrypt.hash(
            password,
            salt
        );

        //Create User
        const user = await User.create({
            username,
            email,
            password: hashPassword,
        });

        // Response
        res.status(201).json({
            success: true,
            message: " User Created Successfully",

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },

            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}


// ===================================
//  LOGIN USER
// ===================================

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        //validation
        if (!email || !password) {
            return res.status(401).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Compare Password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: ""
            });
        }

        // Response
        res.status(200).json({
            success: true,
            message: "Login successful",

           user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },

            token: generateToken(user._id)
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};