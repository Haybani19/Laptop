const board = document.getElementById("board");
const targetsDiv = document.getElementById("targets");
const message = document.getElementById("message");
const timerElement = document.getElementById("timer");
const newGameBtn = document.getElementById("newGame");

let targetPositions = [];
let targetCodes = [];
let currentTarget = 0;
let timerValue = 20;
let timerInterval = null;

function clearTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    clearTimer();
    timerValue = 20;
    timerElement.textContent = `Time: ${timerValue}s`;
    timerInterval = setInterval(() => {
        timerValue -= 1;
        if (timerValue <= 0) {
            clearTimer();
            message.textContent = "ACCESS DENIED";
            setTimeout(generatePuzzle, 1500);
        } else {
            timerElement.textContent = `Time: ${timerValue}s`;
        }
    }, 1000);
}

function randomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return (
        chars[Math.floor(Math.random() * chars.length)] +
        chars[Math.floor(Math.random() * chars.length)]
    );
}

function buildValidPaths() {
    const paths = [];

    for (let first = 0; first < 16; first++) {
        const firstRow = Math.floor(first / 4);
        const firstCol = first % 4;

        for (let second = 0; second < 16; second++) {
            const secondRow = Math.floor(second / 4);
            const secondCol = second % 4;
            if (second === first) continue;
            if (secondCol !== firstCol) continue;

            for (let third = 0; third < 16; third++) {
                const thirdRow = Math.floor(third / 4);
                const thirdCol = third % 4;
                if (third === first || third === second) continue;
                if (thirdRow !== secondRow) continue;
                if (thirdCol === secondCol) continue;

                for (let fourth = 0; fourth < 16; fourth++) {
                    if (fourth === first || fourth === second || fourth === third) continue;
                    const fourthRow = Math.floor(fourth / 4);
                    const fourthCol = fourth % 4;
                    if (fourthCol !== thirdCol) continue;
                    if (fourthRow === thirdRow) continue;

                    paths.push([first, second, third, fourth]);
                }
            }
        }
    }

    return paths;
}

const validPaths = buildValidPaths();

function countMatchingPaths(boardValues) {
    let matches = 0;
    let matchingPath = null;

    validPaths.forEach((path) => {
        const values = path.map((pos) => boardValues[pos]);
        if (values.join(",") === targetCodes.join(",")) {
            matches += 1;
            matchingPath = path;
        }
    });

    return { matches, matchingPath };
}

function isValidFillerPlacement(boardValues, index, fillerCode) {
    const originalValue = boardValues[index];
    boardValues[index] = fillerCode;
    const result = countMatchingPaths(boardValues);
    boardValues[index] = originalValue;

    return result.matches === 1 && result.matchingPath.join(",") === targetPositions.join(",");
}

function generateBoardValues() {
    const boardValues = Array(16).fill("");

    targetPositions.forEach((position, index) => {
        boardValues[position] = targetCodes[index];
    });

    for (let i = 0; i < 16; i++) {
        if (boardValues[i] !== "") continue;

        let fillerCode;
        let attempt = 0;
        do {
            if (Math.random() < 0.5) {
                fillerCode = targetCodes[Math.floor(Math.random() * targetCodes.length)];
            } else {
                fillerCode = randomCode();
            }
            attempt += 1;
        } while (!isValidFillerPlacement(boardValues, i, fillerCode) && attempt < 500);

        if (attempt >= 500) {
            do {
                fillerCode = randomCode();
            } while (!isValidFillerPlacement(boardValues, i, fillerCode));
        }

        boardValues[i] = fillerCode;
    }

    return boardValues;
}

function chooseRandomPath() {
    return validPaths[Math.floor(Math.random() * validPaths.length)];
}

function generatePuzzle() {
    board.innerHTML = "";
    targetsDiv.innerHTML = "";
    message.textContent = "";

    currentTarget = 0;
    targetCodes = [];
    const usedTargetCodes = new Set();

    while (targetCodes.length < 4) {
        const code = randomCode();
        if (!usedTargetCodes.has(code)) {
            targetCodes.push(code);
            usedTargetCodes.add(code);
        }
    }

    targetPositions = chooseRandomPath();

    let boardValues;
    let result;

    do {
        boardValues = generateBoardValues();
        result = countMatchingPaths(boardValues);
    } while (result.matches !== 1 || result.matchingPath.join(",") !== targetPositions.join(","));

    targetCodes.forEach((code) => {
        const div = document.createElement("div");
        div.className = "target";
        div.textContent = code;
        targetsDiv.appendChild(div);
    });

    for (let i = 0; i < 16; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = boardValues[i];

        const stepIndex = targetPositions.indexOf(i);
        cell.dataset.sequenceStep = stepIndex >= 0 ? stepIndex : -1;
        cell.dataset.expectedValue = stepIndex >= 0 ? targetCodes[stepIndex] : "";

        cell.onclick = () => clickCell(cell);
        board.appendChild(cell);
    }

    resetTimer();
}

function clickCell(cell) {
    const targetStep = Number(cell.dataset.sequenceStep);
    const expectedValue = cell.dataset.expectedValue;

    if (targetStep === currentTarget && cell.textContent === expectedValue) {
        cell.classList.add("correct");
        currentTarget += 1;

        if (currentTarget === targetPositions.length) {
            message.textContent = "ACCESS GRANTED";
            setTimeout(generatePuzzle, 1500);
        }
    } else {
        message.textContent = "ACCESS DENIED";
        setTimeout(generatePuzzle, 1500);
    }
}

newGameBtn.onclick = generatePuzzle;

generatePuzzle();
