import express from "express";
import { createRebateEntry, getAllRebates, getStudentRebates, checkRebateOverlap } from "../controllers/rebateController.js";
import { validateRequest, validateQuery, validateParams } from "../validators/requestValidator.js";
import { rebateSchemas } from "../validators/schemas.js";

const router = express.Router();

// Route to create rebate entry
router.post(
  "/create", 
  validateRequest(rebateSchemas.create), 
  createRebateEntry
);

// ✅ Route to fetch all rebate entries
router.get("/rebates", getAllRebates);

// Route to fetch rebates for a specific student
router.get(
  "/rebates/:roll_no", 
  validateParams({ 
    roll_no: { required: true, type: 'string' } 
  }), 
  getStudentRebates
);

// Route to check for overlapping rebates
router.get(
  "/check-overlap", 
  validateQuery(rebateSchemas.checkOverlap), 
  checkRebateOverlap
);

export default router;
