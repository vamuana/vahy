document.addEventListener("DOMContentLoaded", () => {
    const leftPan = document.getElementById("left-pan");
    const rightPan = document.getElementById("right-pan");
    const shelvesContainer = document.getElementById("shelves");
    const rotatingArm = document.getElementById("rotating-arm");
    const taskInfo = document.querySelector(".task-info");
    const jar = document.getElementById("bylinky");
    let currentLevel = 1;
    let correctWeight = 0;
    let jarWeight = 0;

    // Fetch level data
    function fetchLevelData(level) {
        fetch(`levels/level${level}.txt`)
            .then((response) => response.text())
            .then((data) => {
                const lines = data.split("\n").map((line) => line.trim());
                const task = lines[0];
                const weights = lines.slice(1, lines.indexOf("P") || lines.indexOf("L") || lines.indexOf("M")).map(Number);
                jarWeight = parseInt(task.match(/\d+/)[0]);
                correctWeight = jarWeight;
                taskInfo.textContent = task;
                placeWeightsOnShelves(weights);
                makeJarDraggable();
                resetScale();
            })
            .catch((err) => {
                console.error("Failed to load level data:", err);
                taskInfo.textContent = `Chyba pri načítaní levelu ${level}.`;
            });
    }

    function placeWeightsOnShelves(weights) {
        shelvesContainer.innerHTML = "";
        weights.forEach((weight, index) => {
            const img = document.createElement("img");
            img.src = `zavazia/${weight}-removebg-preview.png`;
            img.alt = `Weight ${weight}`;
            img.classList.add("weight");
            img.dataset.weight = weight;

            img.addEventListener("dragstart", (event) => {
                event.dataTransfer.setData("weight", JSON.stringify({ type: "weight", value: weight }));
            });

            img.style.position = "absolute";
            img.style.left = `${(index % 2) * 150}px`;
            img.style.top = `${Math.floor(index / 2) * 100}px`;

            shelvesContainer.appendChild(img);
        });
    }

    function makeJarDraggable() {
        jar.dataset.weight = jarWeight;
        jar.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("weight", JSON.stringify({ type: "jar", value: jarWeight }));
        });
    }

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
                adjustScalePosition();
                calculateBalance();
            }
        });
    });

    function adjustScalePosition() {
        const leftWeight = Array.from(leftPan.querySelectorAll("[data-weight]"))
            .map((item) => parseInt(item.dataset.weight))
            .reduce((sum, val) => sum + val, 0);

        const rightWeight = Array.from(rightPan.querySelectorAll("[data-weight]"))
            .map((item) => parseInt(item.dataset.weight))
            .reduce((sum, val) => sum + val, 0);

        const scaleOffset = (rightWeight - leftWeight) * 5; // Adjust sensitivity
        leftPan.style.transform = `translateY(${Math.max(-scaleOffset, 0)}px)`;
        rightPan.style.transform = `translateY(${Math.max(scaleOffset, 0)}px)`;

        leftPan.style.marginTop = "-50px"; // Ensures both start aligned at the same level
        rightPan.style.marginTop = "-50px";
    }

    [leftPan, rightPan].forEach((pan) => {
        pan.addEventListener("click", (event) => {
            const weightElement = event.target.closest("[data-weight]");
            if (weightElement) {
                shelvesContainer.appendChild(weightElement);
                adjustScalePosition();
                calculateBalance();
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

        const rotation = (rightWeight - leftWeight) * 3;
        rotatingArm.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        checkSolution(leftWeight, rightWeight);
    }

    function checkSolution(leftWeight, rightWeight) {
        const totalWeight = leftWeight + rightWeight;
        if (totalWeight === correctWeight) {
            taskInfo.textContent = "Správne! Úloha splnená.";
        } else {
            taskInfo.textContent = `Úloha: Vyrovnajte váhy pre ${correctWeight} gramov.`;
        }
    }

    function resetScale() {
        rotatingArm.style.transform = `translateX(-50%) rotate(0deg)`;
        leftPan.style.transform = "translateY(0px)";
        rightPan.style.transform = "translateY(0px)";
        leftPan.innerHTML = "";
        rightPan.innerHTML = "";
    }

    document.getElementById("restartGame").addEventListener("click", () => {
        currentLevel = 1;
        fetchLevelData(currentLevel);
        resetScale();
    });

    document.getElementById("loadLevel").addEventListener("click", () => {
        fetchLevelData(currentLevel);
        resetScale();
    });

    fetchLevelData(currentLevel);
});
