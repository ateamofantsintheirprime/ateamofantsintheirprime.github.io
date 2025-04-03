const SERVER_URL = "http://127.0.0.1:8080"; // Use the same port as in server.js
//let phrases = [];
//let currentPhrases = [];
//var choices = [];
let displayedMessages = [];
let remainingMessages = [];
let choices = [];

//getPhrases();

// Load phrases from JSON file
//function getPhrases() {
//    fetch(`${SERVER_URL}/phrases.json`)
//        .then(response => response.json())
//        .then(data => {
//            phrases = data;
//            selectRandomPhrases();
//        })
//        .catch(error => console.error("Error loading phrases:", error));
//
//}

// Select 4 random phrases
// function selectRandomPhrases() {
//     if (phrases.length < 4) {
//         console.error("Not enough phrases to pick from.");
//         return;
//     }
//     currentPhrases = [];
//     //let usedIndexes = new Set();
//
//     phrases.sort((a,b)=>a[1] - b[1])
//     console.log("Phrases from server:", phrases);
//     currentPhrases.push(phrases[0]);
//     currentPhrases.push(phrases[1]);
//     currentPhrases.push(phrases[2]);
//     currentPhrases.push(phrases[3]);
//     // while (currentPhrases.length < 4) {
//     //     let index = Math.floor(Math.random() * phrases.length);
//     //     if (!usedIndexes.has(index)) {
//     //         usedIndexes.add(index);
//     //         currentPhrases.push(phrases[index]);
//     //     }
//     // }
//
//     console.log("Current phrases:", currentPhrases);
//     updateBoxes();
// }

function displayMessages() {
    if (remainingMessages.length < 4) {
        // In future put a fallback to request more messages maybe?
        console.error("Not enough messages");
        return;
    }
    displayedMessages = [];
    for (let i = 0; i < 4; i ++){
        displayedMessages.push(remainingMessages.pop(0));
    }
    console.log("Displayed messages:", displayedMessages);
    updateBoxes();
    if (remainingMessages.length < 12) {
        requestMessages(32);
    }
}

// Update the boxes with new phrases
function updateBoxes() {
    displayedMessages.forEach((message, index) => {
        document.getElementById(`box${index + 1}`).querySelector("p").textContent = message['content'];
    });
}

// Handle box click
function boxClicked(boxIndex) {
    choices.push({"options":displayedMessages,"choice":boxIndex});
    if (choices.length > 1) {
        sendChoices();
        choices = [];
    }
    displayMessages();
}

function sendChoices() {
     console.log("Sending choices:",choices);
     fetch(`${SERVER_URL}/sendChoices`, {
         method: "POST",
         headers: { "Content-Type": "application/json"},
         body: JSON.stringify(choices)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error(`Error sending choices! Status: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         console.log("Server response:", data);
     })
     .catch(error => console.error("Error sending choices:", error));
}

async function requestMessages(count=8) {
    try {
        let response = await fetch(`${SERVER_URL}/messageRequest`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({"count":count})
        });

        if (!response.ok) {
            throw new Error(`Error sending message request! Status: ${response.status}`);
        }

        let data = await response.json();
        remainingMessages.push(...data);
        console.log("Server response:", data);
        console.log("Remaining messages:", remainingMessages);
    } catch (error) {
        console.error("Error sending message request:", error);
    }
    //fetch(`${SERVER_URL}/messageRequest`, {
    //    method: "POST",
    //    headers: { "Content-Type": "application/json"},
    //    body: JSON.stringify({"count":4})
    //})
    // .then(response => {
    //     if (!response.ok) {
    //         throw new Error(`Error sending message request! Status: ${response.status}`);
    //     }
    //     return response.json();
    // })
    // .then(data => {
    //     remainingMessages.push(...data);
    //     console.log("Server response:", data);
    //     console.log("Remaining messages:", remainingMessages);
    // })
    // .catch(error => console.error("Error sending message request:", error));
}

(async () => {
    await requestMessages();
    displayMessages();
})();
