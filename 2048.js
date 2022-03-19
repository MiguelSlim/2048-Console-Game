const readline = require("readline");

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const getFreshGameBoard = (cheat = false) => [
  [cheat ? 128 : "", "", "", ""],
  [cheat ? 256 : "", "", "", ""],
  [cheat ? 512 : "", "", "", ""],
  [cheat ? 1024 : "", "", "", ""],
];

const movementOptions = ["up", "down", "left", "right"];
let continuePlaying = false;
let reached2048 = false;
let gameBoard = null;
let score = 0;
const cheats = process.argv.some((el) => el === "--cheats=on");

process.stdin.on("keypress", (str, key) => {
  if (key.name === "c" && key.ctrl) process.stdin.setRawMode(false);
  if (key.name === "return") {
    if (!reached2048) {
      gameBoard = getFreshGameBoard(cheats);
      score = 0;
    }
    continuePlaying = true;
    printGameBoard(gameBoard);
  }
  if (!continuePlaying) return;
  if (movementOptions.includes(key.name)) handleNextMove(key.name);
});

console.log("Welcome to 2048 console version! Press ENTER to start the game:");

const numToColorMap = {
  2: "\x1b[37m",
  4: "\x1b[37m",
  8: "\x1b[33m",
  16: "\x1b[33m",
  32: "\x1b[32m",
  64: "\x1b[32m",
  128: "\x1b[36m",
  256: "\x1b[36m",
  512: "\x1b[34m",
  1024: "\x1b[34m",
  2048: "\x1b[35m",
  4096: "\x1b[35m",
};

const printGameBoard = (board) => {
  let boardAsStr = "Score: " + score + "\n";
  board.forEach((row) => {
    boardAsStr += "| ";
    row.forEach((el) => {
      const fillerBefore = " ".repeat(
        Math.ceil((4 - el.toString().length) / 2)
      );
      const fillerAfter = " ".repeat(
        Math.floor((4 - el.toString().length) / 2)
      );
      const color = numToColorMap[el] || "";
      boardAsStr += fillerBefore + color + el + "\x1b[0m" + fillerAfter + " | ";
    });
    boardAsStr += "\n";
  });

  console.clear();
  console.log(boardAsStr);
};

const spawnNewNumber = (board) => {
  const newNumber = Math.random() > 0.5 ? 4 : 2;
  const spawnPosition = getSpawnPositionForNumber(board);
  if (!spawnPosition) return board;

  const updatedBoard = [...board];
  score += newNumber;
  updatedBoard[spawnPosition.row][spawnPosition.column] = newNumber;
  return updatedBoard;
};

const getSpawnPositionForNumber = (board) => {
  let spawnPosition = { row: randomInt(4), column: randomInt(4) };
  if (!board.flat().includes("")) return;

  while (board[spawnPosition.row][spawnPosition.column] !== "") {
    spawnPosition.row = randomInt(4);
    spawnPosition.column = randomInt(4);
  }

  return spawnPosition;
};

const randomInt = (max) => Math.floor(Math.random() * max);

const handleNextMove = (input) => {
  let newGameBoard = JSON.parse(JSON.stringify(gameBoard));
  newGameBoard = spawnNewNumber(newGameBoard);
  let wonGame = reached2048;

  if (input === "up") {
    const rotatedBoard = rotateBoard(newGameBoard);
    const processedRotatedBoard = processBoard(rotatedBoard, "forward");
    newGameBoard = rotateBoard(processedRotatedBoard);
  }
  if (input === "down") {
    const rotatedBoard = rotateBoard(newGameBoard);
    const processedRotatedBoard = processBoard(rotatedBoard, "backward");
    newGameBoard = rotateBoard(processedRotatedBoard);
  }
  if (input === "right") newGameBoard = processBoard(newGameBoard, "backward");
  if (input === "left") newGameBoard = processBoard(newGameBoard, "forward");

  if (JSON.stringify(newGameBoard) === JSON.stringify(gameBoard)) {
    handleLoss();
    return;
  }
  gameBoard = newGameBoard;

  printGameBoard(gameBoard);
  if (wonGame !== reached2048) handleWin();
};

const rotateBoard = (board) => {
  const rotatedBoard = [];
  for (let i = 0; i < board.length; i++) {
    rotatedBoard[i] = board.map((el) => el[i]);
  }
  return rotatedBoard;
};

const processBoard = (board, direction) => {
  const processedBoard = board.map((row) => {
    const fieldsWithNums = row.filter((el) => el !== "");
    const processedNums = [];

    for (let i = 0; i < fieldsWithNums.length; i++) {
      if (fieldsWithNums[i] === fieldsWithNums[i + 1]) {
        const newMergedNumber = 2 * fieldsWithNums[i];
        score += newMergedNumber;
        if (newMergedNumber === 2048) reached2048 = true;
        processedNums.push(newMergedNumber);
        i++;
      } else processedNums.push(fieldsWithNums[i]);
    }

    const newRow = Array(4 - processedNums.length).fill("");
    newRow[direction === "forward" ? "unshift" : "push"](...processedNums);

    return newRow;
  });

  return processedBoard;
};

const handleWin = () => {
  console.clear();
  console.log("\x1b[36m%s\x1b[0m", "\nYOU HAVE WON");
  console.log("\x1b[33m%s\x1b[0m", "Your Score is: " + score);
  console.log("Press ENTER to continue \n");
  continuePlaying = false;
};

const handleLoss = () => {
  continuePlaying = false;
  reached2048 = false;
  console.clear();
  console.log("\x1b[31m%s\x1b[0m", "\nYOU HAVE LOST");
  console.log("\x1b[33m%s\x1b[0m", "Your Final Score is: " + score);
  console.log("Press ENTER to restart \n");
};
