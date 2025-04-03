const express = require("express");
const app = express();
const fs = require("fs");
const port = 8080;

const lastBatchId = 7;

// In server.js
const cors = require("cors");
app.use(cors({
    origin: ['*','http://127.0.0.1:8080', 'http://localhost:8080'],  // List allowed origins
    crossorigin: "*",
    methods: ['GET', 'POST'],
    credentials: true  // Allow cookies if needed
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static("."));  // This will serve phrases.json directly

let clickRecords = require('./phrases.json'); //with path
let pendingMessages = [];
let responseBatch = [];

for (let currentBatchId = 1; currentBatchId <= lastBatchId; currentBatchId ++) {
        require(`./holly-chat/holly-discord-filtered/remaining_${currentBatchId}.json`);

}

// TODO: Make writes to the file happen periodically, test multiple clients spamming inputs, figure out reading the millions of messages quickly

// Open the remaining manifest for each batch. pick some low view messages. send them off to client for review.
//
// Client sends back reviews. we pick more messages, ones that have not been sent off since the last sort
//
// Periodically we go and update the viewcounts and tell python to sort the views

function searchRemainingManifest(count = 4, minViews = 1) {
    console.log("searching manifest...");
    // Find a batch with remaining messages.
    let picked_messages = [];
    let message = "";
    let raw = "";
    for (let currentBatchId = 1; currentBatchId <= lastBatchId; currentBatchId ++) {
        // Open the manifest and see if there are any remaining candidatese
        let err, data;
        try {
            data = fs.readFileSync(`holly-chat/holly-discord-filtered/remaining_${currentBatchId}.json`, "utf8");
        } catch (err) {
            console.error("Failed to open batch manifest!");
            console.error(err);
            return null;
        }

        raw = JSON.parse(data);
        for (let i=0; i<raw.length; i++){
            message = raw[i];
            if (picked_messages.length >= count) {
                console.log("returning from search", picked_messages);
                return picked_messages;
            }
            if (message['eval_count'] >= minViews) {
                console.log("eval count higher than minViews", message['eval_count']);
                break; // Move on to the next file, all the of these messages are viewed enough
            }
            if (message['id'] in pendingMessages) {
                console.log("Message already pending");
                console.log(pendingMessages);
            } else {
                message['batch_id'] = currentBatchId;
                picked_messages.push(message);
            }
        }
    }
    console.log("All messages have been viewed the minimum number of times!");
    return null;
}

function pickMessages(picks) {
    // Picks come from manifest entries.
    if (picks==null) {
        console.error("Picks is null!");
        return null;
    }
    full_messages = [];// Bad naming. fix
    var currentBatchId = picks[full_messages.length]['batch_id'];
    while (full_messages.length < picks.length) {
        let err, data;
        try {
            data = fs.readFileSync(`holly-chat/holly-discord-filtered/batch_${currentBatchId}.json`, "utf8");
        } catch (err) {
            console.error(`Error loading batch_${currentBatchId} file.`);
            console.error(err);
            return null;
        }

        raw = JSON.parse(data);
        while (full_messages.length < picks.length && picks[full_messages.length]['batch_id'] == currentBatchId) {
            var batchIndex = picks[full_messages.length]['batch_index'];
            full_messages.push(raw[batchIndex])
        }
    }
    if (full_messages.length < picks.length) {
        console.error("You should never see this!!! Bad!!");
        return null;
    }
    return full_messages;
}


//function process_client_choice(data) {

//}


function print_message(message, index=-1) {
    if (index>-1) {
        console.log("Index: ", index);
    }
    console.log("Author: ", message['author']['name']);
    console.log("Content: \"", message['content'],"\"");
    console.log("Length: ", String(message['content']).length);
    console.log("==================\n");
}

function getMessageFromBatchFile(batchFileData, index = -1) {

    let raw = JSON.parse(batchFileData);
    if (index == -1) {
        index = Math.floor(Math.random() * raw.length);
    }
    print_message(raw[index], index);
    return raw[index];
}

function pick_messages(count = 1, index = -1) {
    fs.readFile("holly-chat/holly-discord-filtered/batch_1.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "Error loading phrases." });
        } else {
            let result = [];
            let i = 0;
            if (index > -1) {return getMessageFromBatchFile(data, index);}
            for (let i = 0; i < count; i++) {
                result.push(getMessageFromBatchFile(data));
            }
            return result;
        }
    });
    return null;
}


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

app.post("/messageRequest", (req, res) => {
    console.log(`Received request for ${req.body['count']} messages`);
    res.json(pickMessages(searchRemainingManifest(req.body['count'])));
});

// Serve phrases.json for the client
app.get("/phrases.json", (req, res) => {
    //res.json(clickRecords);
    fs.readFile("phrases.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "Error loading phrases." });
        } else {
            console.log("Sending Data:", data);
            res.json(JSON.parse(clickRecords));
        }
    });
    console.log("Sending click Records:", clickRecords);
});

app.post("/sendChoices", (req, res) => {
    console.log("raw body:", req.body);
    const choices = req.body;
    //console.log("Choices received:", JSON.stringify(choices));
    res.json({message: "Choices recorded"});
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

//var manifest_picks =  searchRemainingManifest(count=4);
//var msgs = pickMessages(manifest_picks);
//msgs.forEach((message) => print_message(message))


/*  TODO
    () get the python program to periodically sort the files. make sure to not clash over trying to open the files! on either end
    (X) send the clients real messages to display
    (X) send the clients a quite a few rounds of messages to display so they dont have to request more for a while
    (X) clients should request more before they need them
    () Receive client choices and update the remaining files as well as the winrate files
    () udpate the files in batches
    () Remove emoji only messages or messages with URLS

*/
