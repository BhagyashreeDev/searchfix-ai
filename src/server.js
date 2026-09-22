import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import searchFixRoutes from "./routes/searchfix.routes.js";


const app = express();


app.use(cors());

app.use(express.json());


app.get("/", (req, res) => {

    res.json({
        message: "SearchFix AI Server is running."
    });

});


app.get("/health", (req, res) => {

    res.json({
        status: "OK"
    });

});


app.use(
    "/api/searchfix",
    searchFixRoutes
);


const PORT = process.env.PORT || 3000;


app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `SearchFix AI Server running on port ${PORT}`
    );

});