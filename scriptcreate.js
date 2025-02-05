document.addEventListener("DOMContentLoaded", () => {
    const shelvesContainerCreateMode = document.getElementById("shelves");
    const leftPan = document.getElementById("left-pan");
    const rightPan = document.getElementById("right-pan");
    const rotatingArm = document.getElementById("rotating-arm");
    const weightInput = document.getElementById("weightInput");
    const addCustomWeightButton = document.getElementById("addCustomWeight");
    const taskInfo = document.querySelector(".task-info");
    let customWeightsList = [];
    let jarWeight = 0;
    let jar = document.getElementById("bylinky");
    jar.draggable = true;
    const saveCustomLevelButton = document.getElementById("saveCustomLevel");
    const switchToPlayingMode = document.getElementById("switchToPlayingMode");

    if (switchToPlayingMode) {
        switchToPlayingMode.addEventListener("click", () => {
            // Redirect to creating mode
            window.location.href = "playingmode.html";
        });
    }
    const clearWeightsButton = document.getElementById("clearWeights");

    function clearAllWeights() {
        // Remove all weight elements from shelf, left pan, and right pan
        shelvesContainerCreateMode.innerHTML = "";
        leftPan.innerHTML = "";
        rightPan.innerHTML = "";

        // Reset the custom weights list
        customWeightsList = [];

        // Ensure the jar is still draggable and remains in place
        if (!document.querySelector("#bylinky")) {
            const jar = document.createElement("img");
            jar.src = "bylinky.png";
            jar.style.width = "100px";
            jar.alt = "Bylinky";
            jar.classList.add("draggable-item");
            jar.id = "bylinky";
            jar.draggable = true;
            shelvesContainerCreateMode.appendChild(jar);
        }

        // Recalculate balance after clearing
        calculateBalance();
    }

    if (clearWeightsButton) {
        clearWeightsButton.addEventListener("click", clearAllWeights);
    }
    function saveCustomLevel() {
        if (!jarWeightInput.value.trim()) {
            alert("Zadajte hmotnosť byliniek!");
            return;
        }

        let jarWeight = parseInt(jarWeightInput.value) || 0;

        // Start with the first line of the formatted output
        let levelData = [`Ako umiestniť závažia tak, aby sme vedeli odvážiť presne ${jarWeight} gram byliniek?`];

        // Get the custom weights
        levelData.push(...customWeightsList.map(weight => weight.toString()));

        // Determine placements
        let placements = customWeightsList.map(weight => {
            let weightElement = document.querySelector(`.weight[data-weight='${weight}']`);
            if (!weightElement) return "M"; // Default to shelf if not found

            if (leftPan.contains(weightElement)) return "L"; // Left pan
            if (rightPan.contains(weightElement)) return "P"; // Right pan
            return "M"; // Shelf
        });

        levelData.push(...placements);

        // Format the level data into a structured string
        let formattedLevel = levelData.join("\n");

        // Create a Blob and initiate download
        let blob = new Blob([formattedLevel], { type: "text/plain" });
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "custom_level.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    saveCustomLevelButton.addEventListener("click", saveCustomLevel);
    function getGramText(weight) {
        if (weight === 1) return "gram";
        if ([2, 3, 4].includes(weight)) return "gramy";
        return "gramov";
    }

    function updateTaskInfo() {
        taskInfo.innerHTML = `Ako umiestniť závažia tak, aby sme vedeli odvážiť presne <input type='text' id='jarWeightInput' placeholder='___'> <span id='gramText'>gramov</span> byliniek?`;
        const jarWeightInput = document.getElementById("jarWeightInput");
        const gramText = document.getElementById("gramText");

        jarWeightInput.addEventListener("input", (event) => {
            jarWeight = parseInt(event.target.value) || 0;
            jar.dataset.weight = jarWeight;
            gramText.textContent = getGramText(jarWeight);
            calculateBalance();
        });
    }

    function addCustomWeightToShelf(weight) {
        if (customWeightsList.includes(weight)) {
            alert("Táto hmotnosť už existuje!");
            return;
        }
        customWeightsList.push(weight);
        updateShelfDisplay();
    }

    function updateShelfDisplay() {
        shelvesContainerCreateMode.innerHTML = "";
        customWeightsList.forEach((weight, index) => {
            if (!document.querySelector(`.weight[data-weight='${weight}']`)) {
                const img = document.createElement("img");
                img.src = `zavazia/${weight}-removebg-preview.png`;
                img.alt = `Weight ${weight}`;
                img.classList.add("weight");
                img.dataset.weight = weight;
                img.draggable = true;
                img.style.position = "absolute";
                img.style.left = `${(index % 2) * 150}px`;
                img.style.top = `${Math.floor(index / 2) * 150}px`;
                img.addEventListener("dragstart", handleCustomWeightDrag);
                shelvesContainerCreateMode.appendChild(img);
            }
        });
    }

    function handleCustomWeightDrag(event) {
        const weightValue = event.target.dataset.weight;
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: "custom-weight", value: weightValue }));
    }

    jar.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: "jar", value: jarWeight }));
    });

    [leftPan, rightPan].forEach((pan) => {
        pan.addEventListener("dragover", (event) => event.preventDefault());
        pan.addEventListener("drop", (event) => {
            event.preventDefault();
            const data = JSON.parse(event.dataTransfer.getData("text/plain"));

            if (data.type === "jar") {
                if (jar.parentElement !== pan) {
                    pan.appendChild(jar);
                    jar.dataset.weight = jarWeight;
                }
            } else {
                const weight = data.value;
                let weightElement = document.querySelector(`.weight[data-weight='${weight}']`);
                if (weightElement) {
                    weightElement.style.position = "relative";
                    weightElement.style.left = "0";
                    weightElement.style.top = "0";
                    pan.appendChild(weightElement);
                }
            }
            setTimeout(calculateBalance, 100);
        });
    });

    function calculateBalance() {
        let leftWeight = Array.from(leftPan.querySelectorAll(".weight"))
            .reduce((sum, item) => sum + (parseInt(item.dataset.weight) || 0), 0);

        let rightWeight = Array.from(rightPan.querySelectorAll(".weight"))
            .reduce((sum, item) => sum + (parseInt(item.dataset.weight) || 0), 0);

        if (leftPan.contains(jar)) leftWeight += jarWeight;
        if (rightPan.contains(jar)) rightWeight += jarWeight;

        let weightDifference = rightWeight - leftWeight;
        let rotation = Math.sign(weightDifference) * Math.min(60, Math.abs(weightDifference) * 3);

        rotatingArm.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        let panOffset = (rotation / 60) * 180;
        leftPan.style.transform = `translateY(${Math.max(-180, Math.min(180, -panOffset))}px)`;
        rightPan.style.transform = `translateY(${Math.max(-180, Math.min(180, panOffset))}px)`;
    }

    addCustomWeightButton.addEventListener("click", () => {
        const weightValue = parseInt(weightInput.value);
        if (isNaN(weightValue) || weightValue <= 0) {
            alert("Zadajte platnú hmotnosť!");
            return;
        }
        addCustomWeightToShelf(weightValue);
        weightInput.value = "";
    });

    updateTaskInfo();
    calculateBalance();
});
