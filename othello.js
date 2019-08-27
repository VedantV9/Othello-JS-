let canvas = document.getElementById('board');
let ctx = canvas.getContext('2d');
let box_size = 40; // pixel width / height per box
let board_size = 8; // number of boxes on board.  Standard board size 8 x 8
canvas.width = canvas.height = box_size * board_size;
let turn = 1; // keep track of player turn
let hover_coord = null; // keep track of mouse hover position

// colors of board(EMPTY), player one, and player two
const EMPTY = 'green';
const ONE = 'white';
const TWO = 'black';

function drawEmptyBoard() {
  // draw blank board rectangle
  ctx.fillStyle = EMPTY;
  ctx.fillRect(0, 0, box_size * board_size, box_size * board_size);
  ctx.strokeStyle = 'black';

  // draw horizontal / vertical lines to dilineate individual spaces
  for(let i = box_size; i < box_size * board_size; i += box_size) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, board_size * box_size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(board_size * box_size, i);
    ctx.stroke();
  }

  // draw helping markers for standard size boards
  if(board_size == 8) {
    dotAtIntersection(2, 2);
    dotAtIntersection(2, 6);
    dotAtIntersection(6, 2);
    dotAtIntersection(6, 6);
  }
}


// returns {x, y} pixel coordinates of upper left hand corner of corresponding row/column space
function getPosition(row, column) {
  return {y: row * box_size, x: column * box_size};
}

// draws helper markers at a row/column line intersection
function dotAtIntersection(row, column) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 10;

  ctx.beginPath();
  c = getPosition(row, column);
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x, c.y);
  ctx.stroke();
}


// sets up initial state
function initializeBoard() {
  board_state = [];
  board_state.length = board_size * board_size;
  //each spot on the board is empty
  for(i = 0; i < board_state.length; i ++) {
    board_state[i] = 0;
  }

  // middle four initial pieces placed
  mid = board_size / 2 - 1;
  board_state[getIndex(mid, mid)] = board_state[getIndex(mid + 1, mid + 1)] = 1;
  board_state[getIndex(mid, mid + 1)] = board_state[getIndex(mid + 1, mid)] = 2;
}

// helper function to print out board state to console for debugging
function printBoardText(board) {
  str = "";
  for(let i = 0; i < board_size; i ++) {
    for(let j = 0; j < board_size; j ++) {
      str += board[getIndex(i, j)];
    }
  str += "\n";
  }
  console.log(str);
}


// since the board is represented using one-dimensional array, this helper function will map a row and column to the index of the board_state
function getIndex(row, column) {
  return row * board_size + column;
}

// inverse of get index: takes an index and returns {row, col}
function getCoord(index) {
  return {row: Math.floor(index / board_size), col: index % board_size};
}

// loop through and draw the pieces
function drawPieces() {
  // printBoardText(board_state);
  for(let col = 0; col < board_size; col++) {
    for(let row = 0; row < board_size; row++) {
      let player = board_state[getIndex(row, col)];
      if(player != 0) {
        drawCircle(row, col, player);
      }
    }
  }
  updateScores();
}

// draws a player piece on the board.  Alpha is set by default to 1, the hover() method manually sets it to draw its 'ghostly' hover pieces
function drawCircle(row, col, player, alpha = 1) {
  // choose a fill color
  switch(player) {
    case 0:
      ctx.fillStyle = EMPTY;
      break;
    case 1:
      ctx.fillStyle = ONE;
      break;
    case 2:
      ctx.fillStyle = TWO;
      break;
  }

  // find the center
  let pos = getPosition(row, col);
  pos.x += box_size / 2;
  pos.y += box_size / 2;

  // set the alpha
  ctx.globalAlpha = alpha;

  // draw the circle
  ctx.beginPath();
  // the + (player == 0) is to make the circles used to cover over the ghost pieces
  // one pixel bigger, as without it, a 1 pixel circle is left on the board
  ctx.arc(pos.x, pos.y, box_size / 2 - 4 + (player == 0), 0, 2 * Math.PI);
  ctx.fill();

  // reset alpha to 1
  ctx.globalAlpha = 1;

}

function isValidMove(board, index) {
  // create a temporary new board to compare to our original board after we've tried to flip pieces
  let new_board = board.slice()

  // need to check eight ways
  for(let xstep = -1; xstep < 2; xstep++) {
    for(let ystep = -1; ystep < 2; ystep++) {
      new_board = flipPieces(new_board, index, xstep, ystep);
    }
  }

  // if the old board and new board are the same, we haven't flipped any pieces!  Return null
  if(sameContents(board, new_board)) {
    return null;
  }
  // otherwise, we have successfully flipped at least 1 piece.  Return our new board.
  return new_board;
}

// helper function to see if two boards are the same
function sameContents(a, b) {
  // if either board is null or of different lengths, return false
  if(!a || !b)
    return false;
  if(a.length != b.length)
    return false;

  // make sure each element is the same
  for(let i = 0; i < a.length; i++)
    if(a[i] != b[i])
      return false;
  return true;
}

function flipPieces(board, index, xstep, ystep) {
  // We don't need to check the piece we just tried to place down
  if(xstep == 0 && ystep == 0)
    return board;

  // get the grid coordinate from our index, and step to the next space to check right away
  let grid_pos = getCoord(index);
  let row = grid_pos.row + ystep;
  let col = grid_pos.col + xstep;


  let flip = false;

  /*
    Only keep stepping in our direction if there is an opponent's piece in the next space.
    Once we reach a space that is off the board or an empty space, we know we can't flip.
    If we another space with our piece in it, we can start flipping all the pieces in between.
  */
  do {
    // this space is off the board, we don't flip anything
    if(0 > row || 0 > col || col >= board_size || row >= board_size) {
      break;
    }
    // this space is empty, we don't flip anything
    else if (board[getIndex(row, col)] == 0) {
      break;
    }
    /*
      we own this space, start the flipping process. Note that this spot may be directly adjacent
      to the piece we just attempted to place, in which case no piece will actually be 'flipped',
      but for our purposes, that won't matter.
    */
    else if (board[getIndex(row, col)] == turn) {
      flip = true;
      break;
    }
    /*
      There is an opponent's piece in line with the piece we just place.  Continue advancing in
      the direction we're checkin to see if we own a piece that surrounds and will capture this piece
      and the other pieces in the same line.
    */
    else {
      row += ystep;
      col += xstep;
    }
  } while(true);

  /*
    If we ran into on of our pieces, start at the piece we ran into and 'flip' it over (the first piece
    doesn't really get 'flipped').  Work our way backwards until we reached our piece we just played.
    It may not actually result in any pieces being flipped, but it is convenient to lump both cases in
    together.
  */
  if(flip) {
    while(getIndex(row, col) != index) {
      board[getIndex(row, col)] = turn;
      row += -1 * ystep;
      col += -1 * xstep;
    }
  }

  return board;
}

// on click event, try to place a piece
function place(event) {
  // get mouse click coordinates
  let pos = {x: event.clientX, y: event.clientY};

  // convert mouse click coordinates to row/col position, then the index
  let board_coord = getBoardCoordinates(pos);
  let row = board_coord.row;
  let col = board_coord.col;

  let index = getIndex(row, col);

  // make sure the space that was clicked is empty
  if(board_state[index] == 0) {

    /*
      isValidMove() will return null if no pieces were flipped. As long
      as it's not null, we can actually place and flip our pieces.
    */
    if(isValidMove(board_state, index)) {
      // place and flip
      board_state[index] = turn;
      board_state = isValidMove(board_state, index);

      // it's the next player's turn
      turn == 1 ? turn = 2 : turn = 1;

      // update the screen and reset the hover animation tracker
      drawPieces();
      if(gameOver()) {
        canvas.removeEventListener('mousemove', hover);
        canvas.removeEventListener('click', place);
        console.log("GAMEOVER");
      }
      hover_coord = null;
    }
  }
}

function possibleMove() {
  let possible = false;
  for(let i = 0; i < board_state.length; i++) {
    if(isValidMove(board_state, i)) {
      possible = true;
      printBoardText(isValidMove(board_state, i));
      break;
    }
  }
  console.log("POSSIBLEMOVE: " + possible);

  return possible;
}

function gameOver() {
  if(!possibleMove()) {
    turn == 1 ? turn = 2 : turn = 1;
    if(!possibleMove()) {
      return true;
    }
  }
}

function hover(event) {
  /*
    Convert the mouse position to the row / col coordinates, and finally the
    index in our board array.
  */
  let pos = {x: event.clientX, y: event.clientY};
  let board_coord = getBoardCoordinates(pos);
  let row = board_coord.row;
  let col = board_coord.col;
  let index = getIndex(row, col);

  // If the space is empty, and we weren't previously hovering there
  if (board_state[index] === 0) {
    if(hover_coord != board_coord) {
      // cover up our previous space we were hovering on
      if(hover_coord) {
        drawCircle(hover_coord.row, hover_coord.col, 0);
      }

      // keep track of this space so we know whether or not to redraw our ghost circle
      hover_coord = board_coord;
      drawCircle(row, col, turn, alpha = 0.5);
    }
  }

  // if we mouse out of the playing area, erase our previous ghost circle
  if(pos.x > board_size * box_size || pos.y > board_size * box_size) {
    drawCircle(hover_coord.row, hover_coord.col, 0);
    hover_coord = null;
  }
}

/*
  Helper function to convert {x, y} pixel coordinates to the {row, col}
  space it occupies.  It makes sure that it stays in the bounds of the
  row / col restrictions as well.
*/
function getBoardCoordinates(pos) {
  let row = Math.min(Math.floor(pos.y / box_size), board_size - 1);
  let col = Math.min(Math.floor(pos.x / box_size), board_size - 1);
  return {row: row, col: col};
}

function updateScores() {
  let player_one_score = 0;
  let player_two_score = 0;
  for(let i = 0; i < board_state.length; i++) {
    player_one_score += board_state[i] == 1;
    player_two_score += board_state[i] == 2;
  }
  document.getElementById('player-one').innerHTML = "Player 1 score: " + player_one_score;
  document.getElementById('player-two').innerHTML = "Player 2 score: " + player_two_score;
}

initializeBoard();
drawEmptyBoard();
drawPieces();
canvas.addEventListener('mousemove', hover);
canvas.addEventListener('click', place);
