const Jimp = require("jimp");

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function screenCaptureToFile(robotScreenPic, path) {
  return new Promise((resolve, reject) => {
    try {
      const image = new Jimp(robotScreenPic.width, robotScreenPic.height);
      let pos = 0;
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        image.bitmap.data[idx + 2] = robotScreenPic.image.readUInt8(pos++);
        image.bitmap.data[idx + 1] = robotScreenPic.image.readUInt8(pos++);
        image.bitmap.data[idx + 0] = robotScreenPic.image.readUInt8(pos++);
        image.bitmap.data[idx + 3] = robotScreenPic.image.readUInt8(pos++);
      });
      image.write(path, resolve);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

const debugBoard = (state) => {
  console.log("........................");
  for (let i = 0; i < 20; i++) {
    let res = "..";
    for (let j = 0; j < 10; j++) {
      if (state[i][j]) {
        res += "[]";
      } else {
        res += "  ";
      }
    }
    res += "..\n";
    console.log(res);
  }
  console.log("........................");
};

const getScore = (state) => {
  let score = 0;
  let multiplyers = {
    holes: 2,
    height: 1.5,
    cleared: 1.5,
  };
  // calculate the amount of holes in the board
  score += calculateHoles(state) * multiplyers.holes;
  score += Math.abs(getHighestRow(state) - 19) * multiplyers.height;
  score -= getNumberOfCleared(state) * multiplyers.cleared;

  // returns an integer representing the score the board
  return score;
};

const getHighestRow = (state) => {
  let rows_that_has_blocks = [];
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 10; j++) {
      if (state[i][j]) {
        rows_that_has_blocks.unshift(i);
        break;
      }
    }
  }
  let highest_row = 19;
  for (let i = 0; i < rows_that_has_blocks.length - 1; i++) {
    if (rows_that_has_blocks[i] - rows_that_has_blocks[i + 1] != 1) {
      highest_row = rows_that_has_blocks[i];
    }
  }
  return highest_row;
};

const calculateHoles = (state) => {
  let highest_row = getHighestRow(state);
  let holes = 0;

  for (let i = 0; i < 10; i++) {
    let start_counting_holes = false;
    for (let j = 0; j < 20; j++) {
      if (!start_counting_holes && state[j][i] && j >= highest_row) {
        start_counting_holes = true;
      } else if (start_counting_holes && !state[j][i]) {
        holes++;
      }
    }
  }
  return holes;
};

const getSimulatedBoard = (state, shape) => {
  let results = [];
  // shape is an ENUM of ('s', 'z', 'vert', 'L', 'inverseL', 'square', 't')

  for (let rotation = 0; rotation < 4; rotation++) {
    let { initial_col, max_col } = getPiece(shape, rotation);
    for (let col = initial_col; col <= max_col; col++) {
      let { piece } = getPiece(shape, rotation);
      for (let block of piece) {
        block.x += col;
      }
      for (let row = 19; row >= 0; row--) {
        if (!isValidPosition(piece, state)) {
          for (let block of piece) {
            block.y--;
          }
        } else {
          let new_state = JSON.parse(JSON.stringify(state));
          // update the new state
          for (let block of piece) {
            new_state[block.y][block.x] = true;
          }
          if (
            !results.some(
              (board) =>
                JSON.stringify(board.state) == JSON.stringify(new_state)
            )
          ) {
            results.push({ state: new_state, x: col, rotation });
          }
          break;
        }
      }
    }
  }

  // returns an array of objects that contain the board states and the corresponding moves to get to that state that has the piece simulated at each dropped postion
  // [{state: state1, x: 2, rotation: 2}, {state: state2, x: 3, rotation: 2} ...]
  // rotation is 0-3, representing each rotation,
  return results;
};

const isValidPosition = (piece, state) => {
  let highest_row = getHighestRow(state);
  for (let block of piece) {
    if (state[block.y][block.x]) return false;
  }
  for (let block of piece) {
    for (let row = block.y; row >= 0; row--) {
      if (row < highest_row) break;
      if (state[row][block.x]) return false;
    }
  }
  return true;
};

const getNumberOfCleared = (state) => {
  let completed_rows = 0;
  for (let i = 0; i < 20; i++) {
    let count = 0;
    for (let j = 0; j < 10; j++) {
      if (state[i][j]) count++;
    }
    if (count == 10) {
      completed_rows++;
    }
  }
  return completed_rows;

  // let faux_row = [
  //   false,
  //   false,
  //   false,
  //   false,
  //   false,
  //   false,
  //   false,
  //   false,
  //   false,
  //   false,
  // ];
  // for (let completed_row of completed_rows) {
  //   state.splice(completed_row, 1);
  // }
  // state.splice(highest_row - 1, 0, JSON.parse(JSON.stringify(faux_row)));

  return state;
  // [17,18,19]
};

const getPiece = (shape, rotation) => {
  // shape is an ENUM of ('s', 'z', 'vert', 'L', 'inverseL', 'square', 't')
  // rotation is anti-clockwise
  let result = { piece: null, initial_col: null, max_col: null };
  if (shape == "vert") {
    if (rotation == 0 || rotation == 2) {
      result.piece = [
        { x: 0, y: 19 },
        { x: -1, y: 19 },
        { x: 1, y: 19 },
        { x: 2, y: 19 },
      ];
      result.initial_col = 1;
      result.max_col = 7;
    } else if (rotation == 1 || rotation == 3) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: 0, y: 17 },
        { x: 0, y: 16 },
      ];
      result.initial_col = 0;
      result.max_col = 9;
    }
  } else if (shape == "square") {
    result.piece = [
      { x: 0, y: 19 },
      { x: 1, y: 19 },
      { x: 0, y: 18 },
      { x: 1, y: 18 },
    ];
    result.initial_col = 0;
    result.max_col = 8;
  } else if (shape == "t") {
    if (rotation == 0) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: -1, y: 19 },
        { x: 1, y: 19 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 1) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: 0, y: 17 },
        { x: -1, y: 18 },
      ];
      result.initial_col = 1;
      result.max_col = 9;
    } else if (rotation == 2) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: -1, y: 18 },
        { x: 1, y: 18 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 3) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: 0, y: 17 },
        { x: 1, y: 18 },
      ];
      result.initial_col = 0;
      result.max_col = 8;
    }
  } else if (shape == "s") {
    if (rotation == 0 || rotation == 2) {
      result.piece = [
        { x: 0, y: 18 },
        { x: 0, y: 19 },
        { x: -1, y: 19 },
        { x: 1, y: 18 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 1 || rotation == 3) {
      result.piece = [
        { x: -1, y: 17 },
        { x: -1, y: 18 },
        { x: 0, y: 18 },
        { x: 0, y: 19 },
      ];
      result.initial_col = 1;
      result.max_col = 9;
    }
  } else if (shape == "z") {
    if (rotation == 0 || rotation == 2) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: -1, y: 18 },
        { x: 1, y: 19 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 1 || rotation == 3) {
      result.piece = [
        { x: 0, y: 17 },
        { x: 0, y: 18 },
        { x: -1, y: 18 },
        { x: -1, y: 19 },
      ];
      result.initial_col = 1;
      result.max_col = 9;
    }
  } else if (shape == "L") {
    if (rotation == 0) {
      result.piece = [
        { x: 0, y: 19 },
        { x: -1, y: 19 },
        { x: 1, y: 19 },
        { x: 1, y: 18 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 1) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: 0, y: 17 },
        { x: -1, y: 17 },
      ];
      result.initial_col = 1;
      result.max_col = 9;
    } else if (rotation == 2) {
      result.piece = [
        { x: -1, y: 19 },
        { x: -1, y: 18 },
        { x: 0, y: 18 },
        { x: 1, y: 18 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 3) {
      result.piece = [
        { x: 0, y: 17 },
        { x: 0, y: 18 },
        { x: 0, y: 19 },
        { x: 1, y: 19 },
      ];
      result.initial_col = 0;
      result.max_col = 8;
    }
  } else if (shape == "inverseL") {
    if (rotation == 0) {
      result.piece = [
        { x: 0, y: 19 },
        { x: -1, y: 19 },
        { x: 1, y: 19 },
        { x: -1, y: 18 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 1) {
      result.piece = [
        { x: -1, y: 19 },
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: 0, y: 17 },
      ];
      result.initial_col = 1;
      result.max_col = 9;
    } else if (rotation == 2) {
      result.piece = [
        { x: 0, y: 18 },
        { x: -1, y: 18 },
        { x: 1, y: 18 },
        { x: 1, y: 19 },
      ];
      result.initial_col = 1;
      result.max_col = 8;
    } else if (rotation == 3) {
      result.piece = [
        { x: 0, y: 19 },
        { x: 0, y: 18 },
        { x: 0, y: 17 },
        { x: 1, y: 17 },
      ];
      result.initial_col = 0;
      result.max_col = 8;
    }
  }
  return result;
};

module.exports = {
  sleep,
  screenCaptureToFile,
  debugBoard,
  getScore,
  getSimulatedBoard,
};
