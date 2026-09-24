import { Router } from "express";
import multer from "multer";
import os from "os";
import { analyzeSearchFix, analyzeFullOrder } from "../controllers/searchfix.controller.js";

const router = Router();

// Configure temporary disk storage for incoming PDF uploads
const upload = multer({
    dest: os.tmpdir(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB max file size
    }
});

/**
 * POST /api/searchfix/analyze
 * Full Phase 2 API: Accepts Order JSON + Uploaded PDF files -> Returns Issue Classification, Evidence, and Decision.
 */
router.post("/analyze", upload.any(), analyzeFullOrder);

/**
 * POST /api/searchfix/analyze-comments
 * Backwards-Compatible Phase 1 API: Accepts Order JSON + Comments -> Returns Issue Classification & Required Document List.
 */
router.post("/analyze-comments", analyzeSearchFix);

export default router;
