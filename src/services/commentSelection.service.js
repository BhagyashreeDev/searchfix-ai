import { classifyUserRole } from "../config/users.js";
import { deduplicateComments } from "../utils/duplicateDetector.js";

/**
 * Vague triggers that indicate a comment needs context from a previous comment.
 */
const INSUFFICIENT_PATTERNS = [
    // "please advise",
    "please review",
    "recheck",
    "as mentioned",
    "regarding above",
    "continue",
    "proceed"
];

export class CommentSelectionService {
    /**
     * Sorts comments chronologically, deduplicates entries, classifies author roles,
     * and selects the primary SearchFix comment along with supporting context comments.
     * 
     * @param {Array<object>} rawComments Array of comment objects
     * @returns {object} { selectedComment, contextCommentsUsed, allProcessedComments }
     */
    selectSearchFixComment(rawComments) {
        if (!Array.isArray(rawComments) || rawComments.length === 0) {
            throw new Error("No comments provided for comment selection.");
        }

        // 1. Deduplicate comments
        const deduplicated = deduplicateComments(rawComments);

        // 2. Classify roles and attach metadata
        const enriched = deduplicated.map(c => ({
            date: c.date || "",
            time: c.time || "",
            author: c.author || "Unknown",
            role: classifyUserRole(c.author),
            text: (c.text || "").trim(),
            wfid: c.wfid || (c.wfids ? c.wfids[0] : undefined)
        }));

        // 3. Sort by date + time descending (most recent first)
        const sorted = [...enriched].sort((a, b) => {
            const timeA = `${a.date} ${a.time}`.trim();
            const timeB = `${b.date} ${b.time}`.trim();
            return timeB.localeCompare(timeA);
        });

        let selectedComment = null;
        const contextCommentsUsed = [];

        // 4. Traversal logic: start from most recent comment
        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const textLower = current.text.toLowerCase();

            const isSystem = current.role === "SYSTEM";
            const isSuspend = textLower.includes("suspend:");
            const isVague = INSUFFICIENT_PATTERNS.some(p => textLower.includes(p));

            if (isSystem || isSuspend || isVague) {
                // Store as workflow context
                contextCommentsUsed.push({
                    date: current.date,
                    time: current.time,
                    author: current.author,
                    role: current.role,
                    text: current.text,
                    purpose: isSuspend ? "workflow_suspend_state" : (isSystem ? "system_event" : "vague_request_context")
                });
                // Continue tracing to previous meaningful comment
                continue;
            }

            // Meaningful comment found
            selectedComment = current;
            break;
        }

        // Fallback if all comments were system/suspend: use most recent comment as selected
        if (!selectedComment && sorted.length > 0) {
            selectedComment = sorted[0];
        }

        return {
            selectedComment,
            contextCommentsUsed,
            allProcessedComments: sorted
        };
    }
}

export const commentSelectionService = new CommentSelectionService();
