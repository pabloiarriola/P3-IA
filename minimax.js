const _ = require('underscore')

const UP = 0
const DOWN = 1
const LEFT = 2
const RIGHT = 3
const UPRIGHT = 4
const UPLEFT = 5
const DOWNRIGHT = 6
const DOWNLEFT = 7
const ALLDIRECTIONS = [UP, DOWN, LEFT, RIGHT, UPRIGHT, UPLEFT, DOWNRIGHT, DOWNLEFT]
const HALFDIRECTIONS = [UP, RIGHT, UPRIGHT, UPLEFT]

const STABLE = 1
const SEMISTABLE = 0
const UNSTABLE = -1

const MAXIMIZER = 1
const MINIMIZER = 2

// const exampleBoard = [
//   2,2,2,2,2,2,2,2,
//   1,2,1,1,1,1,1,1,
//   0,1,2,1,1,2,1,1,
//   1,1,1,2,2,2,1,1,
//   1,2,1,2,1,2,1,1,
//   1,1,2,2,2,1,2,2,
//   1,2,1,1,1,1,0,2,
//   1,2,1,1,1,2,2,2
// ]

const exampleBoard = [
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,2,1,0,0,0,
  0,0,0,1,2,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0
]

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

export const randomValidMove = (board, player) => {
  // console.log('Calling randomValidMove with board', board, 'player', player)
  const possibleMoves = validMoves(parseBoard(board), player)
  // console.log('possibleMoves', possibleMoves)
  return positionToServerInt(possibleMoves[_.random(possibleMoves.length - 1)])
}


const validPosition = (position, validMoves) => {
  // console.log('Running')
  for(let i=0; i<validMoves.length; i++){
    if(position[0] === validMoves[i][0] && position[1] === validMoves[i][1]){
      return true
    }
  }
  return false
}


const validMoves = (board, player) => {
  const opponent = player === 1 ? 2 : 1
  let validMoves = []
  // Filter opponents coins with empty spaces next to it
  for(let y=0; y<board.length; y++){
    for(let x=0; x<board[0].length; x++){
      // For filtered coins
      if(board[y][x] === opponent){
        ALLDIRECTIONS.map(direction => {
          // For empty space
          if(checkNeighbor(board, [y,x], direction) == '0'){
            // Check opposite end, if theres a player coin then add empty space to validMoves, else pass
            let tempPosition = move([y, x], oppositeDirection(direction))
            while(tempPosition !== null && board[tempPosition[0]][tempPosition[1]] !== 0){
              if(validPosition(move([y, x], direction), validMoves)){
                break
              }
              if(board[tempPosition[0]][tempPosition[1]] === player){
                validMoves.push(move([y, x], direction))
                break
              }
              tempPosition = move(tempPosition, oppositeDirection(direction))
            }
          }
        })
      }
    } 
  }
  // console.log('board', board)
  // console.log('player', player)
  // console.log('validMoves', validMoves)
  return validMoves
}



export const minimax = (board, maxPlayer, minPlayer, alpha, beta, mode, parentMode, depth) => {
  // console.log('#####################################################################', mode)
  // console.log('depth', depth, 'mode', mode, 'parentMode', parentMode)
  // console.log('board\n', board)
  // Get valid moves for current player
  let nodeMoves
  if(mode === MAXIMIZER){
    nodeMoves = validMoves(board, maxPlayer)
  } else {
    nodeMoves = validMoves(board, minPlayer)
  }

  // console.log('nodeMoves', nodeMoves)

  if(nodeMoves.length === 0){
    // If there isnt validMoves for current player
    // Check if opponent has validMoves
    let opponentMoves
    if(mode === MAXIMIZER){
      opponentMoves = validMoves(board, minPlayer)
    } else {
      opponentMoves = validMoves(board, maxPlayer)
    }
    if(opponentMoves.length === 0){
      // If opponent doesnt have validMoves, then we have reached a leaf in the tree, calculate heuristic and return with null move
      return [heuristic(board, maxPlayer, minPlayer), -1]
    } else {
      // If opponent have validMoves, then call minimax changing the mode and keeping the depth
      return minimax(board, maxPlayer, minPlayer, alpha, beta, oppositeMinimaxMode(mode), mode, depth)
    }
  } else {
    // If current player have validMoves
    // Initialize node value as the worst, depending on the mode
    let nodeValue
    let nodeMove
    let nodeAlpha = alpha
    let nodeBeta = beta
    if(mode === MAXIMIZER){
      nodeValue = -Infinity
      nodeMove = -1
    } else {
      nodeValue = Infinity
      nodeMove = -1
    }

    for(let i=0; i<nodeMoves.length; i++){
      // For every valid move
      // Compare nodeValue with nodeAlpha or nodeBeta (depending on the mode and parentMode) to see if we can skip this iteration
      if(parentMode === MINIMIZER && mode === MAXIMIZER){
        // If mode is a maximizer and parentMode is a minimizer, if parentNode can already can achieve a lower value in another move, then skip this exploration
        // Because the maximizer will always take the higher value
        if(nodeValue > nodeBeta){
          // console.log('PRUNING')
          continue
        }
      }

      if(parentMode === MAXIMIZER && mode === MINIMIZER){
        // If mode is a minimizer and parentMode is a maximizer, if parentNode can already can achieve a higher value in another move, then skip this exploration
        // Because the minimizer will always take the lower value
        if(nodeValue < nodeAlpha){
          // console.log('PRUNING')
          continue
        }
      }

      // Get board after playing the move
      let newBoard
      if(mode === MAXIMIZER){
        newBoard = playMove(board, nodeMoves[i], maxPlayer)
      } else {
        newBoard = playMove(board, nodeMoves[i], minPlayer)
      }
      // console.log('newBoard', newBoard)

      let moveValue
      if(depth !== 0){
        // If depth isnt 0
        // Call minimax with the newBoard, updated nodeAlpha and nodeBeta, switching modes and decreasing 1 to the depth
        moveValue = minimax(newBoard, maxPlayer, minPlayer, nodeAlpha, nodeBeta, oppositeMinimaxMode(mode), mode, depth - 1)
      } else {
        // If depth is 0
        // Calculate heuristic of the newBoard
        // console.log('heuristic value', heuristic(newBoard, maxPlayer, minPlayer))
        moveValue = [heuristic(newBoard, maxPlayer, minPlayer), nodeMoves[i]]
      }

      // Update nodeValue, nodeMode, nodeAlpha and nodeBeta, depending on the mode
      if(mode === MAXIMIZER){
        if(moveValue[0] > nodeValue){
          // console.log('UPDATING MAXIMIZER')
          // console.log('previous value', nodeValue, 'new value', moveValue[0])
          nodeValue = moveValue[0]
          nodeMove = nodeMoves[i]
          if(moveValue[0] > nodeAlpha){
            nodeAlpha = moveValue[0]
          }
        }
      } else {
        if(moveValue[0] < nodeValue){
          // console.log('UPDATING MINIMIZER')
          // console.log('previous value', nodeValue, 'new value', moveValue[0])
          nodeValue = moveValue[0]
          nodeMove = nodeMoves[i]
          if(moveValue[0] < nodeBeta){
            nodeBeta = moveValue[0]
          }
        }
      }
    }

    return [nodeValue, nodeMove]
  }
}