const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
    next();
});
let clickRecords = [];

// Endpoint to receive click data
app.post("/record-clicks", (req, res) => {
    const { phrases, clickedPhrase } = req.body;
    clickRecords.push({ phrases, clickedPhrase });

    console.log("Received Click:", { phrases, clickedPhrase });

    res.json({ message: "Click recorded" });
});

// Serve phrases.json for the client
app.get("phrases.json", (req, res) => {
    fs.readFile("phrases.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "Error loading phrases." });
        } else {
            console.log("Sending Data:", data);
            res.json(JSON.parse(data));
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

