import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import { SEARCHFIX_PROMPT } from "../prompts/searchfix.prompt.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


export async function analyzeSearchFix(order) {

    const commentsText = order.comments
        .map((comment, index) => {
            return `
COMMENT ${index + 1}

Date: ${comment.date ?? "Unknown"}
Author: ${comment.author ?? "Unknown"}

Text:
${comment.text}
`;
        })
        .join("\n");


    const input = `
${SEARCHFIX_PROMPT}

ORDER NUMBER:
${order.orderNumber}

SEARCHFIX COMMENTS:
${commentsText}
`;


    const response = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: input
    });


    const output = response.output_text;

    console.log("Gemini response received.");

    try {
        const cleanedOutput = output
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        return JSON.parse(cleanedOutput);

    } catch (error) {
        console.error("Gemini returned invalid JSON:");
        console.error(output);

        throw new Error("Gemini did not return valid JSON.");
    }
}