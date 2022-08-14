const robot = require("robotjs");
const {
  sleep,
  screenCaptureToFile,
  debugBoard,
  getScore,
  getSimulatedBoard,
} = require("./utils.js");

const blocks = {
  "6faf34": "s",
  d9a237: "square",
  "4799d2": "vert",
  "2940bf": "inverseL",
  c52e3d: "z",
  a13586: "t",
  d36428: "L",
};
const faux_blocks = {
  501943: "t", //
  385815: "s", //
  "6c5118": "square", //
  "63151e": "z", //
  693210: "L", //
  "14205f": "inverseL", //
  "214d69": "vert", //
};

const SCALE = 2;
const starting_coords = { x: 0, y: 160 };
//517 557
const game_size = { width: 517, height: 557 };
const next_block_coords = [
  { x: 420, y: 240 },
  { x: 420, y: 265 },
];
const block_size = 24;

const main = async () => {
  let current_block;
  let next_block;
  let held_block;
  let state = new Array(20);
  for (let i = 0; i < state.length; i++) {
    state[i] = new Array(10);
  }

  await sleep(2000);
  // init hold
  robot.keyTap("c");

  // begin loop
  let interval = setInterval(async () => {
    var img = robot.screen.capture(
      starting_coords.x,
      starting_coords.y,
      game_size.width,
      game_size.height
    );
    // screenCaptureToFile(img, "./screen.png");

    // check current block
    let starting_pos = { x: 130, y: 190 };
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 10; j++) {
        let coords = {
          x: j * block_size + (starting_pos.x - starting_coords.x),
          y: i * block_size + (starting_pos.y - starting_coords.y),
        };
        let current_hex = img.colorAt(coords.x * SCALE, coords.y * SCALE);
        if (faux_blocks.hasOwnProperty(current_hex)) {
          if (current_block != faux_blocks[current_hex]) {
            current_block = faux_blocks[current_hex];
          }
          break;
        }
      }
    }

    // check next block
    var next_hex = [];
    for (let i = 0; i < 2; i++) {
      next_hex[i] = img.colorAt(
        (next_block_coords[i].x - starting_coords.x) * SCALE,
        (next_block_coords[i].y - starting_coords.y) * SCALE
      );
    }
    let temp = next_hex.map((hex) => blocks[hex]);
    if (temp[0]) {
      if (next_block != temp[0]) {
        next_block = temp[0];
      }
    } else {
      if (next_block != temp[1]) {
        next_block = temp[1];
      }
    }

    // check held block
    let held_block_coords = [
      { x: 50, y: 215 },
      { x: 50, y: 240 },
    ];
    var held_hex = [];
    for (let i = 0; i < 2; i++) {
      held_hex[i] = img.colorAt(
        (held_block_coords[i].x - starting_coords.x) * SCALE,
        (held_block_coords[i].y - starting_coords.y) * SCALE
      );
    }
    let temp_held = held_hex.map((hex) => blocks[hex]);
    if (temp_held[0]) {
      if (held_block != temp_held[0]) {
        held_block = temp_held[0];
      }
    } else {
      if (held_block != temp_held[1]) {
        held_block = temp_held[1];
      }
    }

    // console.log("current_block:", current_block);
    // console.log("next_block:", next_block);
    // console.log("held_block", held_block);
    // console.log();

    // get game state
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 10; j++) {
        let coords = {
          x: j * block_size + (starting_pos.x - starting_coords.x),
          y: i * block_size + (starting_pos.y - starting_coords.y),
        };
        if (
          blocks.hasOwnProperty(img.colorAt(coords.x * SCALE, coords.y * SCALE))
        ) {
          state[i][j] = true;
        } else {
          state[i][j] = false;
        }
      }
    }
    // start AI shist
    let best_score = Infinity;
    let best_move = null;

    for (let board of getSimulatedBoard(state, current_block)) {
      let score = getScore(board.state);
      // debugBoard(board.state);
      // console.log("score", score);
      if (score < best_score) {
        best_score = score;
        best_move = board;
      }
    }

    let should_switch = false;
    for (let board of getSimulatedBoard(state, held_block)) {
      let score = getScore(board.state);
      if (score < best_score) {
        should_switch = true;
        best_score = score;
        best_move = board;
      }
    }
    if (should_switch) {
      robot.keyTap("c");
      await sleep(10);
    }

    // actual keytap logic
    let ready = true;

    if (!ready) return;
    for (let i = 0; i < best_move.rotation; i++) {
      robot.keyTap("w");
      await sleep(15);
    }
    let delta_x = 4 - best_move.x;
    if (delta_x > 0) {
      for (let i = 0; i < delta_x; i++) {
        robot.keyTap("a");
        await sleep(15);
      }
    } else {
      for (let i = 0; i < Math.abs(delta_x); i++) {
        robot.keyTap("d");
        await sleep(15);
      }
    }
    await sleep(10);
    robot.keyTap("space");
  }, 400);
};

main();
