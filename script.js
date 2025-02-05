document.addEventListener("DOMContentLoaded", () => {
    const leftPan = document.getElementById("left-pan");
    const rightPan = document.getElementById("right-pan");
    const shelvesContainer = document.getElementById("shelves");
    const rotatingArm = document.getElementById("rotating-arm");
    const taskInfo = document.querySelector(".task-info");
    const jar = document.getElementById("bylinky");
    const currentLevelDisplay = document.getElementById("currentLevel");

    let currentLevel = 1;
    let maxLevels = 10; // Adjust based on the number of available levels
    let correctWeight = 0;
    let jarWeight = 0;
// When "Načítaj level" is clicked, open the file picker
    document.getElementById("loadLevel").addEventListener("click", () => {
        document.getElementById("uploadLevelInput").click();
    });
    const switchModeButton = document.getElementById("switchModeButton");

    if (switchModeButton) {
        switchModeButton.addEventListener("click", () => {
            // Redirect to creating mode
            window.location.href = "creatingmode.html";
        });
    }
// Handle file selection
    document.getElementById("uploadLevelInput").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            processUploadedLevel(content);
        };
        reader.readAsText(file);
    });



// Process and load the uploaded level
    function processUploadedLevel(content) {
        const lines = content.split("\n").map(line => line.trim());

        if (lines.length < 2) {
            alert("Chyba: Nahraný súbor neobsahuje správny formát levelu.");
            return;
        }

        const lastLine = lines[lines.length - 1];

        if (lastLine === "resume") {
            // ✅ HANDLE RESUME LEVEL (Saved Game State)
            console.log("Loading a resume level...");

            const task = lines[0]; // First line is the task description
            taskInfo.textContent = task;
            currentLevelDisplay.textContent = `Obnovený level`; // Indicate it's a resumed level

            const weightLines = lines.slice(1, -3); // Extract weights (skip task & last 2 rows)
            const placementLines = lines.slice(-3, -1); // The row before "resume" is the placement row
            const jarPosition = lines[lines.length - 2]; // The last character before resume is jar placement

            const weights = weightLines
                .map(line => parseInt(line, 10)) // Convert to integer
                .filter(num => !isNaN(num)); // Remove NaN values


            // Reset the game state
            resetScale();

            // Prepare separate lists for organizing weights
            let shelfWeights = [];
            weights.forEach((weight, index) => {
                const placement = placementLines[index];

                if (placement === "L") {
                    placeWeightOnPan(weight, leftPan);
                } else if (placement === "P") {
                    placeWeightOnPan(weight, rightPan);
                } else {
                    shelfWeights.push(weight);
                }
            });

            // Place remaining weights on shelves as in the original level
            placeWeightsOnShelves(shelfWeights);

            // Place jar correctly
            if (jarPosition === "L") {
                leftPan.appendChild(jar);
            } else if (jarPosition === "P") {
                rightPan.appendChild(jar);
            } else {
                const tableArea = document.querySelector(".table-area");
                tableArea.appendChild(jar);
                jar.style.position = "static"; // Reset jar to its default position
            }

            // Ensure balance is recalculated
            calculateBalance();
        } else {
            // ✅ HANDLE STANDARD LEVEL
            console.log("Loading a standard level...");

            const task = lines[0]; // First line should contain the task
            const weightLines = lines.slice(1).filter(line => !isNaN(line) && line !== ""); // Extract numeric weights

            const weights = weightLines.map(line => {
                const num = parseInt(line, 10);
                return isNaN(num) ? null : num; // Filter out NaN values
            }).filter(num => num !== null); // Remove null values

            // Extract correct jar weight from task
            const match = task.match(/\d+/);
            if (!match) {
                alert("Chyba: Nemôžem určiť správnu hmotnosť zo zadania.");
                return;
            }

            jarWeight = parseInt(match[0]);
            correctWeight = jarWeight;

            taskInfo.textContent = task;
            currentLevelDisplay.textContent = `Vlastný level`; // Indicate custom upload

            // Reset and prepare
            placeWeightsOnShelves(weights);
            makeJarDraggable();
            resetScale();
            calculateBalance();
        }
    }

// Helper function to place a weight directly on a pan
    function placeWeightOnPan(weight, pan) {
        const weightElement = createWeightElement(weight);
        pan.appendChild(weightElement);
    }


    function placeWeightAccordingToPlacement(weight, placement) {
        // Ensure weight is not duplicated
        let existingWeight = document.querySelector(`[data-weight='${weight}']`);
        if (existingWeight) {
            existingWeight.remove(); // Remove any existing instance of the weight
        }

        const weightElement = createWeightElement(weight);

        if (placement === "L") {
            leftPan.appendChild(weightElement);
        } else if (placement === "P") {
            rightPan.appendChild(weightElement);
        } else {
            organizeWeightOnShelf(weightElement);
        }
    }


    function organizeWeightOnShelf(weightElement) {
        const maxPerRow = 4; // Max 4 weights per row
        let rows = shelvesContainer.querySelectorAll(".shelf-row");

        let row;
        if (rows.length === 0 || rows[rows.length - 1].children.length >= maxPerRow) {
            // Create a new row if the last one is full or doesn't exist
            row = document.createElement("div");
            row.classList.add("shelf-row");
            shelvesContainer.appendChild(row);
        } else {
            row = rows[rows.length - 1]; // Use last row if not full
        }

        row.appendChild(weightElement);
    }


// Helper function to create weight elements
    function createWeightElement(weight) {
        const img = document.createElement("img");
        img.src = `zavazia/${weight}-removebg-preview.png`;
        img.alt = `Weight ${weight}`;
        img.classList.add("weight");
        img.dataset.weight = weight;
        img.draggable = true;

        img.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("weight", JSON.stringify({ type: "weight", value: weight }));
        });

        return img;
    }
    function createWeightElement1(weight) {
        const weightElement = document.createElement("div");
        weightElement.classList.add("weight-container");
        weightElement.dataset.weight = weight;
        weightElement.draggable = true;

        // Image for the weight
        const img = document.createElement("img");
        img.src = `zavazia/${weight}-removebg-preview.png`;  // Ensure this path is correct
        img.alt = `Weight ${weight}`;
        img.classList.add("weight");

        // Append image to container
        weightElement.appendChild(img);

        // Make weight draggable
        weightElement.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("weight", JSON.stringify({ type: "weight", value: weight }));
        });

        return weightElement;
    }



    function fetchLevelData(level) {
        fetch(`levels/level${level}.txt`)
            .then((response) => response.text())
            .then((data) => {
                const lines = data.split("\n").map((line) => line.trim());

                if (lines.length < 2) {
                    alert(`Chyba: Level ${level} nemá správny formát.`);
                    return;
                }

                const task = lines[0];

                // Extract numeric weights
                const weightLines = lines.slice(1).filter(line => !isNaN(line) && line !== "");
                const weights = weightLines.map(Number);

                // Extract correct jar weight
                const match = task.match(/\d+/);
                if (!match) {
                    alert(`Chyba: Nemôžem určiť správnu hmotnosť pre level ${level}.`);
                    return;
                }

                jarWeight = parseInt(match[0]);
                correctWeight = jarWeight;

                taskInfo.textContent = task;
                currentLevelDisplay.textContent = `${level}.`;

                // Ignore placement rules (L, P, M) for now
                placeWeightsOnShelves(weights);
                makeJarDraggable();
                resetScale();
                calculateBalance();
            })
            .catch((err) => {
                console.error("Failed to load level data:", err);
                taskInfo.textContent = `Chyba pri načítaní levelu ${level}.`;
            });
    }



    function placeWeightsOnShelves(weights) {
        shelvesContainer.innerHTML = ""; // Clear shelves

        weights.forEach((weight, index) => {
            const img = createWeightElement(weight);

            img.style.position = "absolute";
            img.style.left = `${(index % 2) * 150}px`;
            img.style.top = `${Math.floor(index / 2) * 150}px`;

            shelvesContainer.appendChild(img);
        });
    }

    function makeJarDraggable() {
        jar.dataset.weight = jarWeight;
        jar.draggable = true;

        jar.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("weight", JSON.stringify({ type: "jar", value: jarWeight }));
        });

        // Ensure clicking on the jar returns it to the original position
        jar.addEventListener("click", () => {
            const tableArea = document.querySelector(".table-area");
            if (!tableArea.contains(jar)) {
                tableArea.appendChild(jar);
                jar.style.position = "static"; // Reset to default positioning in .table-area
                calculateBalance(); // Recalculate balance after moving the jar
            }
        });
    }

    // Handling Drag & Drop Functionality
    [leftPan, rightPan, shelvesContainer].forEach((target) => {
        target.addEventListener("dragover", (event) => event.preventDefault());
        target.addEventListener("drop", (event) => {
            event.preventDefault();
            const data = JSON.parse(event.dataTransfer.getData("weight"));
            const isJar = data.type === "jar";
            const weight = data.value;

            let weightElement = isJar ? jar : document.querySelector(`[data-weight='${weight}']`);

            if (weightElement) {
                weightElement.style.position = "relative";
                weightElement.style.left = "0";
                weightElement.style.top = "0";

                const container = document.createElement("div");
                container.classList.add("weight-container");
                container.appendChild(weightElement);
                target.appendChild(container);
                calculateBalance(); // Recalculate balance after dropping an item
            }
        });
    });

    // Allow Clicking on Weights to Return to Shelf
    [leftPan, rightPan].forEach((pan) => {
        pan.addEventListener("click", (event) => {
            const weightElement = event.target.closest("[data-weight]");
            if (weightElement) {
                shelvesContainer.appendChild(weightElement);
                calculateBalance(); // Recalculate balance after removing an item
            }
        });
    });

    function calculateBalance() {
        const leftWeight = Array.from(leftPan.querySelectorAll("[data-weight]"))
            .map((item) => parseInt(item.dataset.weight))
            .reduce((sum, val) => sum + val, 0);

        const rightWeight = Array.from(rightPan.querySelectorAll("[data-weight]"))
            .map((item) => parseInt(item.dataset.weight))
            .reduce((sum, val) => sum + val, 0);

        let weightDifference = rightWeight - leftWeight;

        // Apply a more natural scaling factor
        let rotation = Math.sign(weightDifference) * Math.min(60, Math.abs(weightDifference) * 3);

        // Ensure rotation stays within -60 to 60 degrees
        rotation = Math.max(-60, Math.min(60, rotation));

        // Apply rotation to the arm
        rotatingArm.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        // Move pans accordingly
        let panOffset = (rotation / 60) * 180; // Scale movement range

        leftPan.style.transform = `translateY(${Math.max(-180, Math.min(180, -panOffset))}px)`;
        rightPan.style.transform = `translateY(${Math.max(-180, Math.min(180, panOffset))}px)`;

        checkSolution(leftWeight, rightWeight);
    }

    document.getElementById("saveLevel").addEventListener("click", saveCurrentLevel);

    document.getElementById("saveLevel").addEventListener("click", saveCurrentLevel);

    function saveCurrentLevel() {
        let levelData = [];

        // Retrieve the task description
        const taskText = taskInfo.textContent;
        levelData.push(taskText);

        // Retrieve all weights and their positions
        const leftWeights = Array.from(leftPan.querySelectorAll("[data-weight]")).map(item => parseInt(item.dataset.weight));
        const rightWeights = Array.from(rightPan.querySelectorAll("[data-weight]")).map(item => parseInt(item.dataset.weight));
        const shelfWeights = Array.from(shelvesContainer.querySelectorAll("[data-weight]")).map(item => parseInt(item.dataset.weight));

        // Combine all weights and remove duplicates
        let allWeights = [...new Set([...leftWeights, ...rightWeights, ...shelfWeights])];

        let placements = [];

        allWeights.forEach(weight => {
            if (leftWeights.includes(weight)) {
                placements.push("L"); // Left Pan
            } else if (rightWeights.includes(weight)) {
                placements.push("P"); // Right Pan
            } else {
                placements.push("M"); // Shelf
            }
        });

        // Append unique weights
        allWeights.forEach(weight => levelData.push(weight.toString()));

        // Append placements
        placements.forEach(placement => levelData.push(placement));

        // Determine Jar Position: L (left), P (right), T (table)
        let jarPosition = "T"; // Default is on the table
        if (leftPan.contains(jar)) {
            jarPosition = "L";
        } else if (rightPan.contains(jar)) {
            jarPosition = "P";
        }

        // Append Jar Position
        levelData.push(jarPosition);

        // Append the "resume" flag at the end
        levelData.push("resume");

        // Convert data to a string format
        const levelText = levelData.join("\n");

        // Create a Blob (file content)
        const blob = new Blob([levelText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger the download
        const a = document.createElement("a");
        a.href = url;
        a.download = `saved_level_${new Date().getTime()}.txt`; // Unique file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Revoke the Blob URL to free up memory
        URL.revokeObjectURL(url);
    }




    function checkSolution(leftWeight, rightWeight) {
        const jarPlacedCorrectly = rightPan.querySelector("#bylinky") !== null || leftPan.querySelector("#bylinky") !== null; // Ensure jar is on right pan

        if (jarPlacedCorrectly && leftWeight === rightWeight) {
            taskInfo.textContent = "Správne! Úloha splnená.";
        }
    }


    function resetScale() {
        rotatingArm.style.transform = `translateX(-50%) rotate(0deg)`;
        leftPan.style.transform = "translateY(0px)";
        rightPan.style.transform = "translateY(0px)";
        leftPan.innerHTML = "";
        rightPan.innerHTML = "";

        // Ensure the jar goes back to .table-area exactly as in the HTML
        const tableArea = document.querySelector(".table-area");
        if (!tableArea.contains(jar)) {
            tableArea.appendChild(jar);
        }

        // Reset jar's styles to match its original HTML position
        jar.style.position = "static";
    }

    // Add Level Navigation Buttons Dynamically
    const leftPanel = document.querySelector(".left-panel");
    let customWeights = []; //
    const prevLevelButton = document.createElement("button");
    prevLevelButton.textContent = "Predošlý level";
    prevLevelButton.style.marginTop = "15px";
    prevLevelButton.style.color = "#654321";
    prevLevelButton.style.backgroundColor = "transparent";
    prevLevelButton.style.fontSize = "20px";
    prevLevelButton.id = "prevLevel";
    leftPanel.appendChild(prevLevelButton);

    const nextLevelButton = document.createElement("button");
    nextLevelButton.textContent = "Ďalší level";
    nextLevelButton.style.marginTop = "5px";
    nextLevelButton.style.color = "#654321";
    nextLevelButton.style.backgroundColor = "transparent";
    nextLevelButton.style.fontSize = "20px";
    nextLevelButton.id = "nextLevel";
    leftPanel.appendChild(nextLevelButton);
    function addCustomWeight() {
        const weightInput = document.getElementById("weightInput");
        const weightValue = parseInt(weightInput.value);

        if (isNaN(weightValue) || weightValue <= 0) {
            alert("Zadajte platnú hmotnosť!");
            return;
        }

        if (customWeights.includes(weightValue)) {
            alert("Táto hmotnosť už existuje!");
            return;
        }

        // Store new weight
        customWeights.push(weightValue);

        // Create a weight element
        const weightElement = createWeightElement1(weightValue);

        // Append weight to the shelf
        placeWeightOnShelf(weightElement);

        // Clear the input field
        weightInput.value = "";
    }

    function placeWeightOnShelf(weightElement) {
        let shelfRows = shelvesContainer.querySelectorAll(".shelf-row");

        if (shelfRows.length === 0) {
            // Create first row if none exist
            let newRow = document.createElement("div");
            newRow.classList.add("shelf-row");
            shelvesContainer.appendChild(newRow);
            newRow.appendChild(weightElement);
        } else {
            let lastRow = shelfRows[shelfRows.length - 1];

            if (lastRow.children.length < 4) {
                // Add weight to existing row if not full
                lastRow.appendChild(weightElement);
            } else {
                // Create a new row if last row is full
                let newRow = document.createElement("div");
                newRow.classList.add("shelf-row");
                shelvesContainer.appendChild(newRow);
                newRow.appendChild(weightElement);
            }
        }
    }


// Function to save the custom level to a .txt file
    function saveCustomLevel() {
        let levelData = [];

        // Get user-defined task description
        const taskText = taskInfo.textContent.trim();
        if (!taskText || taskText === "Zadanie úlohy...") {
            alert("Zadajte popis úlohy!");
            return;
        }

        levelData.push(taskText);

        // Store weights added by user
        customWeights.forEach(weight => levelData.push(weight.toString()));

        // Append "M" placements (all weights start on shelves)
        customWeights.forEach(() => levelData.push("M"));

        // Default jar placement (table)
        levelData.push("T");

        // Append "resume" flag for compatibility with playing mode
        levelData.push("resume");

        // Convert data to a string format
        const levelText = levelData.join("\n");

        // Create a Blob (file content)
        const blob = new Blob([levelText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger the download
        const a = document.createElement("a");
        a.href = url;
        a.download = `custom_level_${new Date().getTime()}.txt`; // Unique file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Revoke the Blob URL to free up memory
        URL.revokeObjectURL(url);
    }

// Event Listeners (Only for Creating Mode)
    if (document.getElementById("addWeightButton")) {
        document.getElementById("addWeightButton").addEventListener("click", addCustomWeight);
    }

    if (document.getElementById("saveLevel")) {
        document.getElementById("saveLevel").addEventListener("click", saveCustomLevel);
    }

    document.getElementById("nextLevel").addEventListener("click", () => {
        if (currentLevel < maxLevels) {
            currentLevel++;
            fetchLevelData(currentLevel);
            resetScale();
            calculateBalance(); // Ensure balance is recalculated
        } else {
            alert("Dosiahli ste posledný level!");
        }
    });

    document.getElementById("prevLevel").addEventListener("click", () => {
        if (currentLevel > 1) {
            currentLevel--;
            fetchLevelData(currentLevel);
            resetScale();
            calculateBalance(); // Ensure balance is recalculated
        } else {
            alert("Toto je prvý level.");
        }
    });


    document.getElementById("restartGame").addEventListener("click", () => {
        currentLevel = 1;
        fetchLevelData(currentLevel);
        resetScale();
    });

    document.getElementById("loadLevel").addEventListener("click", () => {
        fetchLevelData(currentLevel);
        resetScale();
    });

    // Initialize Game
    fetchLevelData(currentLevel);
});
