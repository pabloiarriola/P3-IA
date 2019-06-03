import io from 'socket.io-client'
import { randomValidMove, simpleMinimax } from './minimax.js'


//const socket = io('http://localhost:4000')
const socket = io('http://192.168.1.148:4000')

socket.on('connect', function(){
  console.log('On connect')
  socket.emit('signin', {
    user_name: "PabloArriola",
    tournament_id: 142857,
    user_role: 'player'
  });
});

socket.on('ok_signin', function(){
  console.log("Successfully signed in!");
});

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

const humanBoard = (board) => {
  var outputBoard = '\nA B C D E F G H'

  for(var i=0; i<board.length; i++){
    if(i%8 === 0){
      outputBoard += '\n'
    }

    outputBoard += board[i] + ' '
  }

  return outputBoard
}

socket.on('ready', function(data){
  // console.log('On ready data', data)
  const playerID = data.player_turn_id
  // Client is about to move
  console.log("About to move. Board:", humanBoard(data.board), 'I AM', data.player_turn_id)
  // const move = randomValidMove(data.board, data.player_turn_id)
  const move = simpleMinimax(data.board, data.player_turn_id)

  socket.emit('play', {
    player_turn_id: playerID,
    tournament_id: 142857,
    game_id: data.game_id,
    movement: move
  });

  console.log('Move sent', move)
});

socket.on('finish', function(data) {
  // The game has finished
  console.log("Game " + data.game_id + " has finished");

  // Inform my students that there is no rematch attribute
  console.log("Ready to play again!");

  // Start again!

  socket.emit('player_ready', {
    tournament_id: 142857,
    game_id: data.game_id,
    player_turn_id: data.player_turn_id
  });
  console.log('Successfully sent player_ready')
});

console.log('Client running')
