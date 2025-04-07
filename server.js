const express = require("express");
const app = express();
const fs = require("fs");
const port = 8080;

const lastBatchId = 7;

// In server.js
const cors = require("cors");
app.use(cors({
    origin: '*',  // List allowed origins
    crossorigin: "*",
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true  // Allow cookies if needed
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static("."));  // This will serve phrases.json directly

let pendingMessages = [];
let responseBatch = [];
let maxResponseBatchSize = 12;
for (let currentBatchId = 1; currentBatchId <= lastBatchId; currentBatchId ++) {
        require(`./holly-chat/holly-discord-filtered/remaining_${currentBatchId}.json`);

}

function views(msg) {
    return msg['wins'] + msg['losses'];
}

function isPending(message_id) {
    if (pendingMessages.includes(message_id)) {return true;}
    for (let i = 0; i < responseBatch.length; i++) {
        if (responseBatch[i]['messageIds'].includes(message_id)) {return true;}
    }
    return false;
}

function searchManifest(count = 4) {
    let picked_messages = [];
    let data, err;

         try {
             data = fs.readFileSync("holly-chat/holly-discord-filtered/winrates.json", "utf8");
         } catch (err) {
             console.error("Failed to open batch manifest!");
             console.error(err);
             return null;
         }
    data = Object.values(JSON.parse(data));
    //  this might be omega way too lazy but idgaf

        data.sort((a,b)=>views(a)-views(b))
    while (picked_messages.length < count) {
        potential_message = data.shift();
        if (!isPending(potential_message['message_id'])) {
            picked_messages.push(potential_message);
            pendingMessages.push(potential_message['message_id']);
        }

    }
    return picked_messages;
}

 function pickMessages(picks) {
     // Picks come from manifest entries.
     if (picks==null) {
         console.error("Picks is null!");
         return null;
     }
     full_messages = [];// Bad naming. fix
     var currentBatchId = 0;
     while (picks.length > 0) {
        pick = picks.pop()
        if (currentBatchId != pick['batch']) {
            // If we are not looking at the right batch file, we open the right one.
            currentBatchId = pick['batch']
            data = null;
             try {
                 data = fs.readFileSync(`holly-chat/holly-discord-filtered/batch_${currentBatchId}.json`, "utf8");
                 data = JSON.parse(data)
             } catch (err) {
                 console.error(`Error loading batch_${currentBatchId} file.`);
                 console.error(err);
                 return null;
             }
        }
         batchIndex = pick['batch_file_index']
         message = data[batchIndex]
         full_messages.push(message)

     }
     return full_messages;
 }



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


function save_responses() {
    // Update the winrate and pull the batch_id from the file
     let windata, err
    let batchIds = [];
         try {
             windata = fs.readFileSync("holly-chat/holly-discord-filtered/winrates.json", "utf8");
         } catch (err) {
             console.error("Failed to open batch manifest!");
             console.error(err);
             return null;
         }
     windata = JSON.parse(windata);

        while (responseBatch.length > 0) {
            choices = responseBatch.pop();
           for (let i = 0; i < choices['messageIds'].length; i++) {
               var id = choices.messageIds[i];
               if (!pendingMessages.includes(id)) {
                console.error("Received a response for a message that wasnt pending!")
               }
                pendingMessages.splice(pendingMessages.indexOf(id),1);
                batchIds[id] = windata[id].batch;
               if (choices.winner == i) {
                windata[id].wins += 1;
               } else {
                windata[id].losses += 1;
               }
               windata[id].winrate = windata[id].wins / (windata[id].wins + windata[id].losses);
           }
        }
        windata = JSON.stringify(windata);
    //})
    console.log("saving winrate data to file");
    fs.writeFileSync("holly-chat/holly-discord-filtered/winrates.json", windata);
    // FIX THIS LATER
    // we are gonna switch to using a single
    // manifest file instead of multiple
    // remaining files, for now we will just
    // use the winrates file as the manifest

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
    var count = req.body['count'];
    var picks = searchManifest(count)
    var messages = pickMessages(picks);
    res.json(messages);
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
    const choices = req.body;
    console.log("Choices received:", JSON.stringify(choices, null, 3));
    res.json({message: "Choices recorded"});
    // put these into the batch of responses, if there are enough responses batched, then we save them.
    responseBatch.push(...choices);
    if (responseBatch.length > maxResponseBatchSize) {save_responses();}
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


/*  TODO
    (X) send the clients real messages to display
    (X) send the clients a quite a few rounds of messages to display so they dont have to request more for a while
    (X) clients should request more before they need them
    (X) Receive client choices and update the remaining files as well as the winrate files
    (X) udpate the files in batches
    (X) Remove emoji only messages or messages with URLS
    () Get the website to actually run on the internet
    () Neaten everything and fix the naming and get rid of the remaining_x.json files
    () Display the % of messages that are yet to recieve any kind of rating
    () eventually put in a real rating system, remember the service should try converge on a top 50 as fast as is possible given the data scale
    () Add a live leaderboard and maybe a rank reveal after each choice is made

*/
