import { commentSelectionService } from "../src/services/commentSelection.service.js";
import { classifyUserRole } from "../src/config/users.js";

function runCommentSelectionTests() {
    console.log("==========================================");
    console.log("RUNNING COMMENT SELECTION SERVICE TESTS");
    console.log("==========================================");

    let passed = 0;
    let total = 0;

    // Test 1: User Role Classification
    total++;
    try {
        const r1 = classifyUserRole("SandhyaS_ADSSearchType");
        const r2 = classifyUserRole("RVSI-Outsource: Pjayaram_FAI");
        const r3 = classifyUserRole("OWLServiceUser");

        if (r1 === "INTERNAL" && r2 === "CLIENT" && r3 === "SYSTEM") {
            console.log("✓ User role classification test passed.");
            passed++;
        } else {
            console.error(`✗ User role classification failed: r1=${r1}, r2=${r2}, r3=${r3}`);
        }
    } catch (e) {
        console.error("✗ User role classification test threw error:", e.message);
    }

    // Test 2: Chronological Sort & SUSPEND Traversal (Order 1 scenario)
    total++;
    try {
        const comments = [
            { date: "2026-09-21", time: "05:20", author: "OWLServiceUser", text: "SUSPEND: Product [Full Title]" },
            { date: "2026-09-21", time: "05:15", author: "RVSI-Outsource: Pjayaram_FAI", text: "In mtg borrower showing as John Mccutcheon missed to run name search." }
        ];

        const { selectedComment, contextCommentsUsed } = commentSelectionService.selectSearchFixComment(comments);

        if (selectedComment.author === "RVSI-Outsource: Pjayaram_FAI" && contextCommentsUsed.length === 1) {
            console.log("✓ Timeline sorting & SUSPEND traversal test passed.");
            passed++;
        } else {
            console.error("✗ Timeline sorting test failed:", selectedComment);
        }
    } catch (e) {
        console.error("✗ Timeline sorting test threw error:", e.message);
    }

    // Test 3: Duplicate Comment Filtering
    total++;
    try {
        const comments = [
            { date: "2026-09-20", time: "10:00", author: "Searcher", text: "Missing deed 1979.", wfid: "WF101" },
            { date: "2026-09-20", time: "10:00", author: "Searcher", text: "Missing deed 1979.", wfid: "WF102" }
        ];

        const { allProcessedComments } = commentSelectionService.selectSearchFixComment(comments);

        if (allProcessedComments.length === 1 && allProcessedComments[0].wfids.length === 2) {
            console.log("✓ Duplicate comment filtering & WFID merging test passed.");
            passed++;
        } else {
            console.error("✗ Duplicate comment filtering failed:", allProcessedComments);
        }
    } catch (e) {
        console.error("✗ Duplicate comment test threw error:", e.message);
    }

    console.log(`Comment Selection Tests Complete: ${passed}/${total} passed.\n`);
}

runCommentSelectionTests();
