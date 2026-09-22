import express from "express";
import { analyzeSearchFix } from "../services/gemini.service.js";

const router = express.Router();


router.post("/analyze", async (req, res) => {

    try {

        const order = req.body;


        if (!order) {
            return res.status(400).json({
                error: "Request body is required."
            });
        }


        if (!order.orderNumber) {
            return res.status(400).json({
                error: "orderNumber is required."
            });
        }


        if (!Array.isArray(order.comments)) {
            return res.status(400).json({
                error: "comments must be an array."
            });
        }


        const result = await analyzeSearchFix(order);


        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "SearchFix analysis failed.",
            message: error.message
        });
    }
});


export default router;