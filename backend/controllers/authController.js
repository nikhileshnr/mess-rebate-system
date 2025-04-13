import bcrypt from "bcryptjs";
import { getManagerByUsername } from "../models/managerModel.js";
import { createAuthError } from "../utils/errorHandler.js";

// Controller for login
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const manager = await getManagerByUsername(username);
    if (!manager) {
      return next(createAuthError("User not found"));
    }

    // Compare passwords
    const isMatch = bcrypt.compareSync(password, manager.password);
    if (!isMatch) {
      return next(createAuthError("Invalid credentials"));
    }

    // Store manager details in session
    req.session.manager = { id: manager.id, username: manager.username };

    // Respond with a success message
    res.json({ message: `Login successful for ${manager.username}` });
  } catch (error) {
    next(createAuthError("An error occurred during login"));
  }
};

// Controller for logout
export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(createAuthError("Failed to log out"));
    res.json({ message: "Logged out successfully" });
  });
};

// Controller for checking if user is logged in
export const checkLogin = (req, res) => {
  if (req.session.manager) {
    return res.json({ loggedIn: true, manager: req.session.manager });
  }
  return res.json({ loggedIn: false });
};
