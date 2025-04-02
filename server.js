const express = require("express");
const app = express();
const fs = require("fs");  // Uncommented this
const port = 8080;

// In server.js
const cors = require("cors");
app.use(cors({
  origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],  // List allowed origins
  methods: ['GET', 'POST'],
  credentials: true  // Allow cookies if needed
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static("."));  // This will serve phrases.json directly

let clickRecords = require('./phrases.json'); //with path


// TODO: Make writes to the file happen periodically, test multiple clients spamming inputs, figure out reading the millions of messages quickly

//function update_elo(phrase1, phrase2) {

//}
function pick_messages() {
    fs.readFile("holly-chat/holly-discord-filtered/batch_1.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "Error loading phrases." });
        } else {
            let raw = JSON.parse(data);
            let index = Math.floor(Math.random() * raw.length);
            console.log("index:", index);
            console.log("author:", raw[index]['author']['name']);
            console.log("message:", raw[index]['content']);
            return raw[index];
        }
    });
    return null;
}
pick_messages();

app.post("/record-clicks", (req, res) => {
    const { phrases, clickedPhrase } = req.body;
    clickRecords.forEach(function(part, index, array) {
        if (part[0] == clickedPhrase[0]) {
            array[index][1] += 1;
        }
    });
    //clickRecords.push({ phrases, clickedPhrase });

    fs.writeFile("phrases.json", JSON.stringify(clickRecords), function(err) {
        if (err) {
            console.log(err);
        }
    });


    console.log("Received Click:", { phrases, clickedPhrase });
    console.log("Click records:", clickRecords);

    res.json({ message: "Click recorded" });
});

// Serve phrases.json for the client
app.get("/phrases.json", (req, res) => {
    //res.json(clickRecords);
    fs.readFile("phrases.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "Error loading phrases." });
        } else {
            //console.log("Sending Data:", data);
            res.json(JSON.parse(clickRecords));
        }
    });
    console.log("Sending click Records:", clickRecords);
});

app.post("/sendChoices", (req, res) => {
    console.log("raw body:", req.body);
    const choices = req.body;
    console.log("Choices received:", JSON.stringify(choices));
    res.json({message: "Choices recorded"});
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

