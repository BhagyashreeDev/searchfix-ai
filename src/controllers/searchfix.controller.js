import fs from "fs";
import { commentSelectionService } from "../services/commentSelection.service.js";
import { issueClassificationService } from "../services/issueClassification.service.js";
import { documentSelectionService } from "../services/documentSelection.service.js";
import { documentAnalysisService } from "../services/documentAnalysis.service.js";
import { evidenceService } from "../services/evidence.service.js";
import { decisionEngine } from "../services/decision.service.js";
import { geminiService } from "../services/gemini.service.js";
import { SearchFixPhase2ResultSchema } from "../schemas/result.schema.js";

/**
 * Legacy / Phase 1 Endpoint: Analyze comments only.
 */
export async function analyzeSearchFix(req, res) {
    try {
        const { orderNumber, comments } = req.body || {};

        if (!orderNumber || typeof orderNumber !== "string" || orderNumber.trim() === "") {
            return res.status(400).json({ error: "orderNumber is required and must be a non-empty string." });
        }

        if (!comments || !Array.isArray(comments) || comments.length === 0) {
            return res.status(400).json({ error: "comments must be a non-empty array." });
        }

        const result = await geminiService.analyzeComments(orderNumber.trim(), comments);
        return res.status(200).json(result);

    } catch (error) {
        console.error("[SearchFix Controller] Phase 1 Analysis failed:", error);
        return res.status(500).json({ error: "SearchFix analysis failed." });
    }
}

/**
 * Full Phase 2 Endpoint: Analyze comments + uploaded PDF documents -> evidence & decision.
 */
export async function analyzeFullOrder(req, res) {
    const uploadedLocalPaths = [];

    try {
        // Parse orderData if passed as JSON string in multipart/form-data
        let bodyData = req.body;
        if (typeof req.body.orderData === "string") {
            try {
                bodyData = JSON.parse(req.body.orderData);
            } catch (e) {
                return res.status(400).json({ error: "Invalid JSON in 'orderData' field." });
            }
        }

        const orderNumber = bodyData.orderNumber || req.body.orderNumber;
        const comments = bodyData.comments || req.body.comments;

        if (!orderNumber || typeof orderNumber !== "string" || orderNumber.trim() === "") {
            return res.status(400).json({ error: "orderNumber is required." });
        }

        if (!comments || !Array.isArray(comments) || comments.length === 0) {
            return res.status(400).json({ error: "comments array must contain at least one comment." });
        }

        // Process uploaded PDF files from multer
        const uploadedFiles = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                uploadedLocalPaths.push(file.path);

                // Determine fileType from req.body mapping or metadata header
                let fileType = "SEARCH_PACKAGE";
                if (req.body[`fileType_${file.fieldname}`]) {
                    fileType = req.body[`fileType_${file.fieldname}`];
                } else if (file.originalname.toUpperCase().includes("DEED")) {
                    fileType = "DEED";
                } else if (file.originalname.toUpperCase().includes("TAX")) {
                    fileType = "TAX";
                } else if (file.originalname.toUpperCase().includes("PACER")) {
                    fileType = "PACER";
                } else if (file.originalname.toUpperCase().includes("PATRIOT")) {
                    fileType = "PATRIOT";
                } else if (file.originalname.toUpperCase().includes("REPORT") || file.originalname.toUpperCase().includes("TYPED")) {
                    fileType = "TYPED_REPORT";
                } else if (file.originalname.toUpperCase().includes("THR")) {
                    fileType = "THR";
                }

                uploadedFiles.push({
                    fileName: file.originalname,
                    fileType: fileType,
                    path: file.path
                });
            }
        }

        console.log(`[SearchFix Controller] Starting Phase 2 analysis for Order ${orderNumber} (${uploadedFiles.length} uploaded files attached)`);

        // Stage 1: Comment Selection & Timeline Traversal
        const { selectedComment, contextCommentsUsed } = commentSelectionService.selectSearchFixComment(comments);

        // Stage 2: Issue Classification
        const rawIssues = await issueClassificationService.classifyIssues(selectedComment, contextCommentsUsed);

        // Stage 3: Document Selection Mapping
        const issuesWithDocs = documentSelectionService.selectRequiredDocuments(rawIssues);

        // Stage 4, 5, 6: Document Analysis, Evidence Extraction & Issue Decision Evaluation
        const processedIssues = [];

        for (const issue of issuesWithDocs) {
            // Stage 4: Analyze target PDF documents
            const rawEvidence = await documentAnalysisService.analyzeDocumentsForIssue(issue, uploadedFiles);

            // Stage 5: Format evidence
            const formattedEvidence = evidenceService.formatEvidence(rawEvidence);

            // Stage 6: Evaluate claim vs evidence decision
            const { decision, reason } = await decisionEngine.evaluateIssueDecision(issue, formattedEvidence);

            processedIssues.push({
                issueType: issue.issueType,
                clientClaim: issue.claim,
                requiredDocuments: issue.requiredDocuments,
                evidence: formattedEvidence,
                decision,
                reason
            });
        }

        // Stage 7: Calculate overall decision
        const overallDecision = decisionEngine.calculateOverallDecision(processedIssues);

        const responsePayload = {
            orderNumber: orderNumber.trim(),
            commentAnalysis: {
                selectedComment: {
                    date: selectedComment.date,
                    time: selectedComment.time,
                    author: selectedComment.author,
                    role: selectedComment.role,
                    text: selectedComment.text
                },
                contextCommentsUsed: contextCommentsUsed.map(c => ({
                    date: c.date,
                    time: c.time,
                    author: c.author,
                    role: c.role,
                    text: c.text,
                    purpose: c.purpose
                }))
            },
            issues: processedIssues,
            overallDecision
        };

        console.log("Uploaded file:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
            path: file.path
        });

        // Validate output payload structure
        const validatedPayload = SearchFixPhase2ResultSchema.parse(responsePayload);

        return res.status(200).json(validatedPayload);

    } catch (error) {
        console.error("[SearchFix Controller] Phase 2 Analysis failed:", error);
        return res.status(500).json({ error: "SearchFix Phase 2 analysis failed." });
    } finally {
        // Clean up temporary local files saved by multer
        for (const localPath of uploadedLocalPaths) {
            try {
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            } catch (err) {
                console.warn(`[SearchFix Controller] Temp file cleanup warning (${localPath}):`, err.message);
            }
        }
    }
}
