document.addEventListener("DOMContentLoaded", () => {
    const leftPan = document.getElementById("left-pan");
    const rightPan = document.getElementById("right-pan");
    const scaleImage = document.getElementById("scaleImage");
    const taskInfo = document.querySelector(".task-info");
    let currentLevel = 1;

    // Function to fetch weights for a level
    function fetchWeightsForLevel(level) {
        fetch(`levels/level${level}.txt`)
            .then(response => response.text())
            .then(data => {
                const weights = data.split("\n").map(line => line.trim()).filter(line => line && !isNaN(line)).map(Number);
                console.log("Loaded weights for level", level, weights); // Debugging line
                placeWeightsOnShelves(weights);
                taskInfo.textContent = `Úloha: Vyrovnajte váhy pre level ${level}.`;
            })
            .catch(err => {
                console.error("Failed to load level weights:", err);
                taskInfo.textContent = `Chyba pri načítaní levelu ${level}.`;
            });
    }



    // Function to dynamically create and place weight images on shelves
    function placeWeightsOnShelves(weights) {
        const shelvesContainer = document.getElementById("shelves");
        shelvesContainer.innerHTML = ""; // Clear existing weights

        // Dynamically distribute weights on shelves
        weights.forEach((weight, index) => {
            const img = document.createElement("img");
            img.src = `zavazia/${weight}-removebg-preview.png`;
            img.alt = `Weight ${weight}`;
            img.classList.add("weight");
            img.dataset.weight = weight;

            // Set dynamic positions for the weights
            img.style.position = "absolute";
            img.style.left = `${(index % 2) * 100 + 20}px`; // Alternating left positions
            img.style.top = `${Math.floor(index / 2) * 160 + 20}px`; // Move down as rows fill

            // Add drag-and-drop functionality to the weights
            img.addEventListener("dragstart", (event) => {
                event.dataTransfer.setData("text", event.target.dataset.weight);
            });

            shelvesContainer.appendChild(img);
        });

        console.log("Weights placed on shelves:", weights); // Debugging line
    }



    // Drag-and-drop handling for pans
    [leftPan, rightPan].forEach((pan) => {
        pan.addEventListener("dragover", (event) => {
            event.preventDefault(); // Allow dropping
        });

        pan.addEventListener("drop", (event) => {
            event.preventDefault();
            const weight = event.dataTransfer.getData("text");
            const weightElement = document.querySelector(`[data-weight='${weight}']`);
            if (weightElement) {
                pan.appendChild(weightElement); // Place the weight on the pan
                calculateBalance(); // Update the balance logic
            }
        });
    });

    // Function to calculate balance and adjust the scale's rotation
    function calculateBalance() {
        const leftWeight = Array.from(leftPan.children)
            .map((item) => parseInt(item.dataset.weight))
            .reduce((sum, val) => sum + val, 0);

        const rightWeight = Array.from(rightPan.children)
            .map((item) => parseInt(item.dataset.weight))
            .reduce((sum, val) => sum + val, 0);

        const rotation = (rightWeight - leftWeight) * 2; // Adjust sensitivity
        const rotatingArm = document.getElementById("rotating-arm");
        rotatingArm.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    }


    // Restart the game to the first level
    document.getElementById("restartGame").addEventListener("click", () => {
        currentLevel = 1;
        fetchWeightsForLevel(currentLevel);
        scaleImage.style.transform = "rotate(0)";
    });

    // Reload the current level
    document.getElementById("loadLevel").addEventListener("click", () => {
        fetchWeightsForLevel(currentLevel);
    });

    // Initialize the first level
    fetchWeightsForLevel(currentLevel);
});
