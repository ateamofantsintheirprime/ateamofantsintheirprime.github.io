const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");  // Uncommented this
const port = 8080;

// In server.js
const cors = require("cors");
app.use(cors({
  origin: '*',  // Allow requests from any origin during development
  methods: ['GET', 'POST']  // Explicitly allow these methods
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static("."));  // This will serve phrases.json directly

let clickRecords = [];

// Endpoint to receive click data

//app.get("/record-clicks", (req, res) => {
//    // Handle GET requests
//    res.json({ message: "GET request received" });
//});
app.post("/record-clicks", (req, res) => {
    const { phrases, clickedPhrase } = req.body;
    clickRecords.push({ phrases, clickedPhrase });
    console.log("Received Click:", { phrases, clickedPhrase });
    res.json({ message: "Click recorded" });
});
//app.post("/record-clicks", (req, res) => {
//    const { phrases, clickedPhrase } = req.body;
//    clickRecords.push({ phrases, clickedPhrase });
//
//    console.log("Received Click:", { phrases, clickedPhrase });
//    console.log("Click records:", clickRecords);
//
//    res.json({ message: "Click recorded" });
//});
//
// Serve phrases.json for the client
app.get("/phrases.json", (req, res) => {
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

