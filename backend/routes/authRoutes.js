import express from "express";
import { login, logout, checkLogin } from "../controllers/authController.js";

const router = express.Router();

// Route to login
router.post("/login", login);

// Route to logout
router.post("/logout", logout);

// Route to check login status
router.get("/checkLoginStatus", checkLogin);

export default router;
