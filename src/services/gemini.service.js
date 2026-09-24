import { GoogleGenAI } from "@google/genai";
import { validateSearchFixResponse } from "../utils/responseValidator.js";
import { getSystemPrompt, getUserPrompt } from "../prompts/searchfix.prompt.js";

export class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
            console.warn("[SearchFix AI] Warning: GEMINI_API_KEY is not set or using placeholder value.");
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey || "" });
    }

    /**
     * Executes standard generateContent call returning raw text or JSON.
     */
    async generateJSON(systemInstruction, userPrompt) {
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const response = await this.ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });
        return response.text;
    }

    /**
     * Uploads a file via @google/genai Files API.
     */
    async uploadFile(filePath, mimeType = "application/pdf") {
        console.log(`[GeminiService] Uploading file to Gemini Files API: ${filePath}`);
        const uploadResult = await this.ai.files.upload({
            file: filePath,
            config: {
                mimeType
            }
        });
        console.log(`[GeminiService] Upload complete. File URI: ${uploadResult.uri}`);
        return uploadResult;
    }

    /**
     * Deletes a uploaded file from Gemini Files API.
     */
    async deleteFile(fileName) {
        if (!fileName) return;
        try {
            console.log(`[GeminiService] Deleting file from Gemini Files API: ${fileName}`);
            await this.ai.files.delete({ name: fileName });
        } catch (err) {
            console.warn(`[GeminiService] File deletion warning (${fileName}):`, err.message);
        }
    }

    /**
     * Executes generateContent with attached uploaded File objects (PDFs).
     */
    async generateContentWithFiles(systemInstruction, userPrompt, fileObjects = []) {
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        // Combine file handles and text prompt into contents array
        const contents = [...fileObjects, userPrompt];

        const response = await this.ai.models.generateContent({
            model: modelName,
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json"
            }
        });

        return response.text;
    }

    /**
     * Legacy Phase 1 analysis method for backwards compatibility.
     */
    async analyzeComments(orderNumber, comments) {
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        console.log(`[SearchFix AI] Request started for Order: ${orderNumber} (${comments.length} comments) using model ${modelName}`);

        const systemInstruction = getSystemPrompt();
        const userPrompt = getUserPrompt(orderNumber, comments);

        try {
            const responseText = await this.generateJSON(systemInstruction, userPrompt);
            const validatedResult = validateSearchFixResponse(responseText, orderNumber);
            return validatedResult;
        } catch (error) {
            console.error(`[SearchFix AI] Error during Gemini analysis:`, error.message);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
