//const SERVER_URL = "http://127.0.0.1:8080"; // Use the same port as in server.js
//const SERVER_URL = "https://polite-coats-create.loca.lt"
//const SERVER_URL = "https://8168-110-175-176-199.ngrok-free.app"
const SERVER_URL = "https://illegally-peaceful-sailfish.ngrok-free.app" // This one should be the free static url

const message_option_num = 4;
const min_message_buffer = 12;
const request_batch_size = 12;
const choice_batch_size = 4;
let displayedMessages = [];
let remainingMessages = [];
let choices = [];

function displayMessages() {
    if (remainingMessages.length < message_option_num) {
        // In future put a fallback to request more messages maybe?
        console.error("Not enough messages");
        return;
    }
    displayedMessages = [];
    displayedMessages = remainingMessages.slice(0,4);
    remainingMessages = remainingMessages.slice(4);
    updateBoxes();
    if (remainingMessages.length < min_message_buffer) {
        requestMessages(request_batch_size);
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
    choices.push({
        "messageIds" : displayedMessages.map(msg => msg.id),
        "winner": boxIndex
    })
    if (choices.length > choice_batch_size) {
        sendChoices();
        choices = [];
    }
    displayMessages();
}

function sendChoices() {
     console.log("Sending choices:",choices);
     fetch(`${SERVER_URL}/sendChoices`, {
         method: "POST",
          headers: {
             "Content-Type": "application/json",
             "ngrok-skip-browser-warning": "true"  // Add this header
         },

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

async function requestMessages(count=request_batch_size) {
    console.log(`Requesting ${count} messages`);
    try {
        let response = await fetch(`${SERVER_URL}/messageRequest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"  // Add this header
            },
            body: JSON.stringify({"count":count})
        });

        if (!response.ok) {
            throw new Error(`Error sending message request! Status: ${response.status}`);
        }

        let data = await response.json();
        remainingMessages.push(...data);
        console.log("Server response:", data);
        //console.log("Remaining messages:", remainingMessages);
    } catch (error) {
        console.error("Error sending message request:", error);
    }
}

(async () => {
    await requestMessages();
    displayMessages();
})();
