function Board(board_size, board=null, turn=null) {
  this.possible_move = true;
  this.board_size = board_size;
  if(turn == null)
    this.turn = this.BLACK;
  else
    this.turn = turn;
  if(board == null) {
    this.board = [];
    for(let i = 0; i < board_size * board_size; i++)
      this.board.push(0);
  }
  else {
    this.board = board.slice();
  }
}

Board.prototype.BLACK = 1;
Board.prototype.WHITE = 2;
//#####UTILITY METHODS FOR CONVERTING BETWEEN ROW/COL AND INDEX
// inverse of getIndex: takes an index and returns {row, col}
Board.prototype.getCoord = function(index) {
  return {row: Math.floor(index / this.board_size), col: index % this.board_size};
}

// since the board is represented using one-dimensional array, this helper function will map a row and column to the index of the board_state
Board.prototype.getIndex = function(row, column) {
  return row * this.board_size + column;
}

Board.prototype.equals = function(board) {
  if(this.board == null || board.board ==null){
    return false;
  }
  if(this.board.length != board.board.length) {
    return false;
  }
  for(let i = 0; i < this.board.length; i++) {
    if(this.board[i] != board.board[i]) {
      return false
    }
  }
  return true;
}

Board.prototype.printBoardText = function() {
  str = "";
  for(let i = 0; i < this.board_size; i ++) {
    for(let j = 0; j < this.board_size; j ++) {
      str += this.board[this.getIndex(i, j)];
    }
  str += "\n";
  }
  console.log(str);
}
//#####END UTILITY METHODS

Board.prototype.getScore = function() {
  let p_one = 0;
  let p_two = 0;
  for(let i = 0; i < this.board.length; i++) {
    if(this.board[i] == 0)
      continue;
    else if(this.board[i] ==1)
      p_one++;
    else
      p_two++;
  }
  return {player_one: p_one, player_two: p_two};
}

Board.prototype.switchTurn = function() {
  this.turn == this.BLACK ? this.turn = this.WHITE : this.turn = this.BLACK;
}

Board.prototype.hasPossibleMove = function() {
  this.possible_move = false;
  let choices = [];
  for(let i = 0; i < this.board.length; i++) {
    if(this.isValidMove(i, this.turn)) {
      this.possible_move = true;
      // console.log("POSSIBLE MOVE AT INDEX: " + i);
      // console.log(this.getCoord(i));
      choices.push(i);
    }
  }
  return choices;
}

Board.prototype.godPlaceByRC = function(row, col, player) {
  this.godPlaceByIndex(this.getIndex(row, col), player);
}

Board.prototype.godPlaceByIndex = function(index, player) {
  if(index < this.board.length && index >= 0)
    this.board[index] = player;
}

Board.prototype.placeByRC = function(row, col) {
  this.placeByIndex(this.getIndex(row, col));
}

Board.prototype.placeByIndex = function(index) {
  if(this.isValidMove(index)) {
    this.board[index] = this.turn;
    this.flipPieces(index)
    this.switchTurn();
    this.hasPossibleMove();
  }
}

Board.prototype.placeByRandom = function() {
  let choices = this.hasPossibleMove();
  this.placeByIndex(choices[Math.floor(Math.random() * choices.length)]);
}

Board.prototype.isValidMove = function(index, player) {
  if(this.board[index] != 0)
    return false;
  let new_board = new Board(this.board_size, this.board.slice(), this.turn);
  // new_board.printBoardText();

  new_board.flipPieces(index);
  // new_board.printBoardText();


  if(this.equals(new_board))
    return false;
  return true;
}

Board.prototype.flipPieces = function(index) {
  // this.printBoardText();
  for(let xstep = -1; xstep < 2; xstep++) {
    for(let ystep = -1; ystep < 2; ystep++) {
      this.flipDirection(index, xstep, ystep);
    }
  }
}



Board.prototype.flipDirection = function(index, xstep, ystep) {
  // We don't need to check the piece we just tried to place down
  if(xstep == 0 && ystep == 0)
    return;

  // get the grid coordinate from our index, and step to the next space to check right away
  let grid_pos = this.getCoord(index);
  let row = grid_pos.row + ystep;
  let col = grid_pos.col + xstep;


  let flip = false;

  /*
    Only keep stepping in our direction if there is an opponent's piece in the next space.
    Once we reach a space that is off the board or an empty space, we know we can't flip.
    If we another space with our piece in it, we can start flipping all the pieces in between.
  */
  do {
    // console.log("CHECKING row: " + row + ", col: " + col);
    // this space is off the board, we don't flip anything
    if(0 > row || 0 > col || col >= this.board_size || row >= this.board_size) {
      // console.log("OOB");
      break;
    }
    // this space is empty, we don't flip anything
    else if (this.board[this.getIndex(row, col)] == 0) {
      // console.log("EMPTY");
      break;
    }
    /*
      we own this space, start the flipping process. Note that this spot may be directly adjacent
      to the piece we just attempted to place, in which case no piece will actually be 'flipped',
      but for our purposes, that won't matter.
    */
    else if (this.board[this.getIndex(row, col)] == this.turn) {
      // console.log("ELEMENT AT {row: " + row + ", col: " + col + "} == player: " + this.turn);
      flip = true;
      break;
    }
    /*
      There is an opponent's piece in line with the piece we just place.  Continue advancing in
      the direction we're checkin to see if we own a piece that surrounds and will capture this piece
      and the other pieces in the same line.
    */
    else {
            // console.log("ELEMENT AT {row: " + row + ", col: " + col + "} == opponent");

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
    while(this.getIndex(row, col) != index) {
      this.board[this.getIndex(row, col)] = this.turn;
      row += -1 * ystep;
      col += -1 * xstep;
    }
  }
}

function Game(board_size, board=null) {
  this.state = [];
  if(board == null) {
    let initial_board = new Board(board_size);

    let mid = board_size / 2 - 1;

    initial_board.godPlaceByRC(mid, mid, 1, false);
    initial_board.godPlaceByRC(mid + 1, mid + 1, 1, false);
    initial_board.godPlaceByRC(mid, mid + 1, 2, false);
    initial_board.godPlaceByRC(mid + 1, mid, 2, false);
    // initial_board.printBoardText();
    this.state.push(initial_board);
  }
  else
    this.state.push(board);
}

Game.prototype.getCurrentState = function() {
  return this.state[this.state.length - 1];
}

Game.prototype.try = function(index) {
  let cur = this.getCurrentState();
  if(cur.isValidMove(index, cur.turn)) {
    let next_state = new Board(cur.board_size, cur.board, cur.turn);
    next_state.placeByIndex(index);
    next_state.hasPossibleMove();
    this.state.push(next_state);
    return true;
  }
  return false;
}

Game.prototype.tryRandom = function() {
  let cur = this.getCurrentState();
  if(cur.possible_move) {
    let next_state = new Board(cur.board_size, cur.board, cur.turn);
    next_state.placeByRandom();
    next_state.hasPossibleMove();
    this.state.push(next_state);
    return true;
  }
  return false;
}

Game.prototype.gameOver = function() {
  console.log("GAMEOVER");
  let cur = this.getCurrentState();
  let test_board = new Board(cur.board_size, cur.board, cur.turn);
  test_board.printBoardText();
  if(!test_board.hasPossibleMove() == false) {
    console.log("PLAYER " + test_board.turn + " NOT POSSIBLE");
    test_board.switchTurn();
    if(!test_board.hasPossibleMove() == false) {
      console.log("PLAYER " + test_board.turn + " NOT POSSIBLE");
      return true;
    }
  }
  return false;
}