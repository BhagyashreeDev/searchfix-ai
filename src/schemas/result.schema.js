import { z } from "zod";
import { ISSUE_TYPES } from "../config/issueTypes.js";
import { DOCUMENT_TYPES } from "../config/documentMappings.js";

export const EvidenceItemSchema = z.object({
    document: z.string(),
    page: z.number().nullable().optional(),
    field: z.string().optional(),
    value: z.string().optional(),
    finding: z.string(),
    quotedText: z.string().optional(),
    confidence: z.number().optional()
});

export const IssueDecisionSchema = z.object({
    issueType: z.enum(ISSUE_TYPES),
    clientClaim: z.string(),
    requiredDocuments: z.array(z.enum(DOCUMENT_TYPES)),
    evidence: z.array(EvidenceItemSchema),
    decision: z.enum(["ACCEPTED", "DISPUTED", "REVIEW_REQUIRED"]),
    reason: z.string()
});

export const SearchFixPhase2ResultSchema = z.object({
    orderNumber: z.string(),
    commentAnalysis: z.object({
        selectedComment: z.object({
            date: z.string().optional(),
            time: z.string().optional(),
            author: z.string().optional(),
            role: z.enum(["INTERNAL", "CLIENT", "SYSTEM"]),
            text: z.string()
        }),
        contextCommentsUsed: z.array(z.object({
            date: z.string().optional(),
            time: z.string().optional(),
            author: z.string().optional(),
            role: z.enum(["INTERNAL", "CLIENT", "SYSTEM"]).optional(),
            text: z.string().optional(),
            purpose: z.string().optional()
        }))
    }),
    issues: z.array(IssueDecisionSchema),
    overallDecision: z.enum(["ACCEPTED", "DISPUTED", "REVIEW_REQUIRED"])
});
