const SERVER_URL = "http://127.0.0.1:8080"; // Use the same port as in server.js
let phrases = [];
let currentPhrases = [];
var choices = [];

getPhrases();

// Load phrases from JSON file
function getPhrases() {
    fetch(`${SERVER_URL}/phrases.json`)
        .then(response => response.json())
        .then(data => {
            phrases = data;
            selectRandomPhrases();
        })
        .catch(error => console.error("Error loading phrases:", error));

}

// Select 4 random phrases
function selectRandomPhrases() {
    if (phrases.length < 4) {
        console.error("Not enough phrases to pick from.");
        return;
    }
    currentPhrases = [];
    //let usedIndexes = new Set();

    phrases.sort((a,b)=>a[1] - b[1])
    console.log("Phrases from server:", phrases);
    currentPhrases.push(phrases[0]);
    currentPhrases.push(phrases[1]);
    currentPhrases.push(phrases[2]);
    currentPhrases.push(phrases[3]);
    // while (currentPhrases.length < 4) {
    //     let index = Math.floor(Math.random() * phrases.length);
    //     if (!usedIndexes.has(index)) {
    //         usedIndexes.add(index);
    //         currentPhrases.push(phrases[index]);
    //     }
    // }

    console.log("Current phrases:", currentPhrases);
    updateBoxes();
}

// Update the boxes with new phrases
function updateBoxes() {
    currentPhrases.forEach((phrase, index) => {
        document.getElementById(`box${index + 1}`).querySelector("p").textContent = phrase[0] + String(phrase[1]);
    });
}

// Handle box click
function boxClicked(boxIndex) {
    let selectedPhrase = currentPhrases[boxIndex];
    choices.push({"options":currentPhrases,"choice":boxIndex});
    if (choices.length > 5) {
        sendChoices();
        choices = [];
    }
    // Make only one fetch request - the POST request to record clicks
    //fetch(`${SERVER_URL}/record-clicks`, {
    //    method: "POST",
    //    headers: { "Content-Type": "application/json" },
    //    body: JSON.stringify({ phrases: currentPhrases, clickedPhrase: selectedPhrase })
    //})
    //.then(response => {
    //    if (!response.ok) {
    //        throw new Error(`HTTP error! Status: ${response.status}`);
    //    }
    //    return response.json();
    //})
    //.then(data => {
    //    console.log("Server response:", data);
    //    getPhrases(); // Pick 4 new phrases after sending data
    //})
    //.catch(error => console.error("Error sending click data:", error));
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

