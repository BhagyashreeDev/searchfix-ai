import dotenv from "dotenv";
import { validateSearchFixResponse } from "../src/utils/responseValidator.js";
import { commentSelectionService } from "../src/services/commentSelection.service.js";
import { decisionEngine } from "../src/services/decision.service.js";
import { geminiService } from "../src/services/gemini.service.js";
import fs from "fs";

dotenv.config();

console.log("==========================================");
console.log("SEARCHFIX AI PHASE 2 FULL TEST SUITE");
console.log("==========================================\n");

function runValidatorUnitTests() {
    console.log("--- 1. VALIDATOR UNIT TESTS ---");
    let passed = 0;
    let total = 0;

    total++;
    try {
        const validMock = {
            orderNumber: "ORD-123",
            issues: [
                {
                    issueType: "MISSING_DEED",
                    claim: "Missing deed reported.",
                    requiredFiles: [{ fileType: "DEED", reason: "Need deed." }]
                }
            ]
        };
        const res = validateSearchFixResponse(validMock, "ORD-123");
        if (res.issues[0].issueType === "MISSING_DEED") {
            console.log("✓ Valid response parsing test passed.");
            passed++;
        }
    } catch (e) {
        console.error("✗ Valid response parsing test failed:", e.message);
    }

    total++;
    try {
        const invalidMock = {
            orderNumber: "ORD-123",
            issues: [
                {
                    issueType: "INVALID_UNKNOWN_ISSUE",
                    claim: "Bad issue type.",
                    requiredFiles: []
                }
            ]
        };
        validateSearchFixResponse(invalidMock, "ORD-123");
        console.error("✗ Reject invalid issue type test failed.");
    } catch (e) {
        if (e.message.includes("Invalid issue type")) {
            console.log("✓ Reject invalid issue type test passed.");
            passed++;
        }
    }

    total++;
    try {
        const invalidFileMock = {
            orderNumber: "ORD-123",
            issues: [
                {
                    issueType: "MISSING_DEED",
                    claim: "Missing deed.",
                    requiredFiles: [{ fileType: "HALLUCINATED_MORTGAGE_FILE", reason: "Bad file type." }]
                }
            ]
        };
        validateSearchFixResponse(invalidFileMock, "ORD-123");
        console.error("✗ Reject invalid file type test failed.");
    } catch (e) {
        if (e.message.includes("Invalid file type")) {
            console.log("✓ Reject invalid file type test passed.");
            passed++;
        }
    }

    console.log(`Validator Unit Tests: ${passed}/${total} passed.\n`);
}

function runCommentSelectionUnitTests() {
    console.log("--- 2. COMMENT SELECTION & TIMELINE TESTS ---");
    let passed = 0;
    let total = 0;

    total++;
    try {
        const comments = [
            { date: "2026-09-21", time: "05:20", author: "OWLServiceUser", text: "SUSPEND: Product [Full Title]" },
            { date: "2026-09-21", time: "05:15", author: "RVSI-Outsource: Pjayaram_FAI", text: "In mtg borrower showing as John Mccutcheon missed to run name search." }
        ];

        const { selectedComment } = commentSelectionService.selectSearchFixComment(comments);

        if (selectedComment.author === "RVSI-Outsource: Pjayaram_FAI") {
            console.log("✓ Timeline sorting & SUSPEND traversal test passed.");
            passed++;
        }
    } catch (e) {
        console.error("✗ Timeline sorting test failed:", e.message);
    }

    console.log(`Comment Selection Unit Tests: ${passed}/${total} passed.\n`);
}

function runDecisionEngineUnitTests() {
    console.log("--- 3. DECISION ENGINE UNIT TESTS ---");
    let passed = 0;
    let total = 0;

    total++;
    try {
        const overall = decisionEngine.calculateOverallDecision([{ decision: "ACCEPTED" }, { decision: "REVIEW_REQUIRED" }]);
        if (overall === "ACCEPTED") {
            console.log("✓ Overall decision aggregation test passed.");
            passed++;
        }
    } catch (e) {
        console.error("✗ Decision aggregation test failed:", e.message);
    }

    console.log(`Decision Engine Unit Tests: ${passed}/${total} passed.\n`);
}

async function runRegressionDataTests() {
    console.log("--- 4. REGRESSION DATASET TESTS (Orders 1-8) ---");
    if (!fs.existsSync("./sample-data/orders.json")) {
        console.log("No sample-data/orders.json found.");
        return;
    }

    const sampleOrders = JSON.parse(fs.readFileSync("./sample-data/orders.json", "utf-8"));
    console.log(`Loaded ${sampleOrders.length} sample regression orders.`);

    let passed = 0;

    for (const order of sampleOrders) {
        const { selectedComment } = commentSelectionService.selectSearchFixComment(order.comments);
        if (selectedComment && selectedComment.author === order.expectedSelectedAuthor) {
            console.log(`✓ ${order.id}: Selected author matches '${order.expectedSelectedAuthor}'`);
            passed++;
        } else {
            console.warn(`! ${order.id}: Expected author '${order.expectedSelectedAuthor}', got '${selectedComment?.author}'`);
        }
    }

    console.log(`Regression Dataset Tests: ${passed}/${sampleOrders.length} passed.\n`);
}

async function main() {
    runValidatorUnitTests();
    runCommentSelectionUnitTests();
    runDecisionEngineUnitTests();
    await runRegressionDataTests();
}

main();
