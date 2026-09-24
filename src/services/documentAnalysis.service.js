import { geminiService } from "./gemini.service.js";
import { getDocumentAnalysisSystemPrompt, getDocumentAnalysisUserPrompt } from "../prompts/documentAnalysis.prompt.js";

export class DocumentAnalysisService {
    /**
     * Analyzes uploaded PDF documents relevant to an issue using Gemini Files API.
     * 
     * @param {object} issue { issueType, claim, requiredDocuments }
     * @param {Array<{fileName: string, fileType: string, path: string}>} uploadedFiles Uploaded files list
     * @returns {Promise<Array<object>>} List of extracted evidence objects
     */
    async analyzeDocumentsForIssue(issue, uploadedFiles = []) {
        if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
            console.log(`[DocumentAnalysisService] No uploaded files provided for issue '${issue.issueType}'.`);
            return [];
        }

        // Filter uploaded files to ONLY include relevant required document types
        const relevantFiles = uploadedFiles.filter(file => {
            if (!file || !file.fileType) return false;
            return issue.requiredDocuments.includes(file.fileType);
        });

        if (relevantFiles.length === 0) {
            console.log(`[DocumentAnalysisService] None of the uploaded files match required types [${issue.requiredDocuments.join(", ")}] for issue '${issue.issueType}'.`);
            return [];
        }

        console.log(`[DocumentAnalysisService] Analyzing ${relevantFiles.length} relevant document(s) for issue '${issue.issueType}'`);

        const systemPrompt = getDocumentAnalysisSystemPrompt();

        const uploadedHandles = [];
        const evidenceList = [];

        try {
            // 1. Upload relevant files to Gemini Files API
            for (const file of relevantFiles) {
                if (file.path) {
                    const handle = await geminiService.uploadFile(file.path, "application/pdf");
                    uploadedHandles.push({ handle, file });
                }
            }

            if (uploadedHandles.length === 0) {
                return [];
            }

            // 2. Perform document analysis with Gemini
            const userPrompt = getDocumentAnalysisUserPrompt(issue.issueType, issue.claim, relevantFiles.map(f => f.fileType).join(", "));
            const fileHandles = uploadedHandles.map(item => item.handle);

            const rawText = await geminiService.generateContentWithFiles(systemPrompt, userPrompt, fileHandles);
            const parsed = typeof rawText === "string" ? JSON.parse(rawText) : rawText;

            if (parsed && Array.isArray(parsed.evidence)) {
                parsed.evidence.forEach(item => {
                    evidenceList.push({
                        document: item.document || relevantFiles[0].fileName,
                        page: item.page ?? null,
                        field: item.field || "",
                        value: item.value || "",
                        finding: item.finding || "Extracted document finding.",
                        quotedText: item.quotedText || "",
                        confidence: item.confidence ?? 0.9
                    });
                });
            }

            return evidenceList;

        } catch (error) {
            console.error(`[DocumentAnalysisService] Error analyzing documents for issue '${issue.issueType}':`, error);
            return [];
        } finally {
            // 3. Clean up uploaded Files API handles
            for (const item of uploadedHandles) {
                if (item.handle && item.handle.name) {
                    await geminiService.deleteFile(item.handle.name);
                }
            }
        }
    }
}

export const documentAnalysisService = new DocumentAnalysisService();
