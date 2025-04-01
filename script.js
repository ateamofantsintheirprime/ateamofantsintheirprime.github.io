const SERVER_URL = "http://localhost:3000"; // Change this if hosting online
let phrases = [];
let currentPhrases = [];

// Load phrases from JSON file
fetch("/phrases.json")
    .then(response => response.json())
    .then(data => {
        phrases = data;
        selectRandomPhrases();
    })
    .catch(error => console.error("Error loading phrases:", error));

// Select 4 random phrases
function selectRandomPhrases() {
    if (phrases.length < 4) {
        console.error("Not enough phrases to pick from.");
        return;
    }
    currentPhrases = [];
    let usedIndexes = new Set();

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

    updateBoxes();
}

// Update the boxes with new phrases
function updateBoxes() {
    currentPhrases.forEach((phrase, index) => {
        document.getElementById(`box${index + 1}`).querySelector("p").textContent = phrase[0] + str(phrase[1]);
    });
}

// Handle box click
function boxClicked(boxIndex) {
    let selectedPhrase = currentPhrases[boxIndex];

    fetch(`${SERVER_URL}/record-clicks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrases: currentPhrases, clickedPhrase: selectedPhrase })
    })
    .then(response => response.json())
    .then(() => {
        selectRandomPhrases(); // Pick 4 new phrases after sending data
    })
    .catch(error => console.error("Error sending click data:", error));
}

