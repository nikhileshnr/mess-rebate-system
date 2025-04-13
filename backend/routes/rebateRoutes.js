import express from "express";
import { createRebateEntry, getAllRebates, getStudentRebates, checkRebateOverlap } from "../controllers/rebateController.js";

const router = express.Router();

// Route to create rebate entry
router.post("/create", createRebateEntry);

// ✅ Route to fetch all rebate entries
router.get("/rebates", getAllRebates);

// Route to fetch rebates for a specific student
router.get("/rebates/:roll_no", getStudentRebates);

// Route to check for overlapping rebates
router.get("/check-overlap", checkRebateOverlap);

export default router;
