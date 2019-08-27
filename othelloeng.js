let engine = function(global)
{
  let canvas = global.document.getElementById('board');
  let ctx = canvas.getContext('2d');

  let box_size = 80; // pixel width / height per box
  let board_size = 8; // number of boxes on board.  Standard board size 8 x 8
  canvas.width = canvas.height = box_size * board_size;
  // let turn = 1; // keep track of player turn
  let hover_coord = null; // keep track of mouse hover position
  canvas.addEventListener('mousemove', hover);
  canvas.addEventListener('click', place);
  global.document.getElementById('random').addEventListener('click', rand);

  // colors of board(EMPTY), player one, and player two
  const EMPTY = 'green';
  const ONE = 'black';
  const TWO = 'white';

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

  // loop through and draw the pieces
  function drawPieces(state) {
    // state.printBoardText();
    for(let col = 0; col < state.board_size; col++) {
      for(let row = 0; row < state.board_size; row++) {
        let player = state.board[state.getIndex(row, col)];
        if(player != 0) {
          drawCircle(row, col, player);
        }
      }
    }
    hover_coord = null;
    //updateScores();
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

  function hover(event) {
    /*
      Convert the mouse position to the row / col coordinates, and finally the
      index in our board array.
    */
    let pos = {x: event.clientX, y: event.clientY};
    let board_coord = getBoardCoordinates(pos);
    let row = board_coord.row;
    let col = board_coord.col;
    let index = state.getIndex(row, col);

    // If the space is empty, and we weren't previously hovering there
    if (state.board[index] === 0) {
      if(hover_coord != board_coord) {
        // cover up our previous space we were hovering on
        if(hover_coord) {
          drawCircle(hover_coord.row, hover_coord.col, 0);
        }

        // keep track of this space so we know whether or not to redraw our ghost circle
        hover_coord = board_coord;
        drawCircle(row, col, state.turn, alpha = 0.5);
      }
    }

    // if we mouse out of the playing area, erase our previous ghost circle
    if(pos.x > board_size * box_size || pos.y > board_size * box_size) {
      drawCircle(hover_coord.row, hover_coord.col, 0);
      hover_coord = null;
    }
  }

  // on click event, try to place a piece
  function place(event) {
    // get mouse click coordinates
    let pos = {x: event.clientX, y: event.clientY};

    // convert mouse click coordinates to row/col position, then the index
    let board_coord = getBoardCoordinates(pos);
    let row = board_coord.row;
    let col = board_coord.col;

    let index = state.getIndex(row, col);

    // make sure the space that was clicked is empty
    if(state.board[index] == 0) {

      /*
        isValidMove() will return null if no pieces were flipped. As long
        as it's not null, we can actually place and flip our pieces.
      */
      if(game.try(index)) {
        state = game.getCurrentState();
        updateScores(state);
        drawPieces(state);
      }
      if (state.possible_move == false) {
        if(game.gameOver()) {
          canvas.removeEventListener('mousemove', hover);
          canvas.removeEventListener('click', place);
          let go = document.createElement("h3");
          go.innerHTML = 'Game Over.';
          document.getElementById('player-one').prepend(go);
        }
        else {
          alert("Player " + state.turn + " has no possible moves.")
          state.switchTurn();
        }
      }
    }
  }

  /*
    Helper function to convert {x, y} pixel coordinates to the {row, col}
    space it occupies.  It makes sure that it stays in the bounds of the
    row / col restrictions as well.
  */
  function getBoardCoordinates(pos) {
    board_element = global.document.getElementById('board');
    pos.x -= board_element.offsetLeft;
    pos.y -= board_element.offsetTop;
    let row = Math.min(Math.floor(pos.y / box_size), board_size - 1);
    let col = Math.min(Math.floor(pos.x / box_size), board_size - 1);
    return {row: row, col: col};
  }

  function updateScores(state) {
    let player_one = 0;
    let player_two = 0;
    score = state.getScore();
    player_one = score.player_one;
    player_two = score.player_two;
    document.getElementById('player-one').innerHTML = "Player 1 score: " + player_one;
    document.getElementById('player-two').innerHTML = "Player 2 score: " + player_two;
  }

  function rand() {
    if(game.tryRandom()) {
      state = game.getCurrentState();
      updateScores(state);
      drawPieces(state);
      if (state.possible_move == false) {
        if(game.gameOver()) {
          canvas.removeEventListener('mousemove', hover);
          canvas.removeEventListener('click', place);
          let go = document.createElement("h3");
          go.innerHTML = 'Game Over.';
          document.getElementById('player-one').prepend(go);
        }
        else {
          alert("Player " + state.turn + " has no possible moves.")
          state.switchTurn();
        }
      }
    }
  }

  function newGame() {
    game = new Game(board_size);
    state = game.getCurrentState();
    drawEmptyBoard();
    drawPieces(state);

  }
  newGame();

}(this);