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

// This heuristic takes a flat board
const coinParityHeuristic = (board, maxPlayer, minPlayer) => {
  const flatBoard = _.flatten(board)
  const count = _.countBy(flatBoard, (position) => {
    if(position === 1){
      return 1
    } else {
      if(position === 2){
        return 2
      } else {
        return 0
      }
    }
  })
  if(count[maxPlayer] + count[minPlayer] != 0){
    return 100 * (count[maxPlayer] - count[minPlayer]) / (count[maxPlayer] + count[minPlayer])
  } else {
    return 0
  }
}

// console.log('coinParityHeuristic 1', coinParityHeuristic(exampleBoard, 1, 2))
// console.log('coinParityHeuristic', coinParityHeuristic(exampleBoard, 2, 1))


const mobilityHeuristic = (board, maxPlayer, minPlayer) => {
  const maxPlayerPotentialMoves = validMoves(board, maxPlayer).length
  const minPlayerPotentialMoves = validMoves(board, minPlayer).length
  // console.log('maxPlayerPotentialMoves', maxPlayerPotentialMoves)
  // console.log('minPlayerPotentialMoves', minPlayerPotentialMoves)
  if(maxPlayerPotentialMoves + minPlayerPotentialMoves != 0){
    return 100 * (maxPlayerPotentialMoves - minPlayerPotentialMoves) / (maxPlayerPotentialMoves + minPlayerPotentialMoves)
  } else {
    return 0
  }
}

// console.log('mobilityHeuristic 1', mobilityHeuristic(parseBoard(exampleBoard), 1, 2))

const cornersHeuristic = (board, maxPlayer, minPlayer) => {
  const corners = [[0,0], [0,7], [7,7], [7,0]]
  let maxPlayerPotentialCorners = 0
  let minPlayerPotentialCorners = 0
  corners.map((corner) => {
    if(board[corner[0]][corner[1]] == maxPlayer){
      maxPlayerPotentialCorners = maxPlayerPotentialCorners + 1
    } else {
      if(board[corner[0]][corner[1]] == minPlayer){
        minPlayerPotentialCorners = minPlayerPotentialCorners + 1
      }
    }
  })

  if(maxPlayerPotentialCorners + minPlayerPotentialCorners != 0){
    return 100 * (maxPlayerPotentialCorners - minPlayerPotentialCorners) / (maxPlayerPotentialCorners + minPlayerPotentialCorners)
  } else {
    return 0
  }
}
// console.log('cornersHeuristic 1', cornersHeuristic(parseBoard(exampleBoard), 1, 2))

const stabilityHeuristic = (board, maxPlayer, minPlayer) => {
  // For every coin
    // Check if stable
      // stabilities = []
      // For half directions
        // firstBound = Go in direction until encounter a minPlayer coin or empty space or end-of-board
        // secondBound = Go in opposite direction until encounter a minPlayer coin or empty space or end-of-board
        // if((firstBound == minPlayer && secondBound == emptySpace) || (firstBound == empty && secondBound == minPlayer)){stabilities.push(UNSTABLE)}
        // else if((firstBound === end-of-board) && (secondBound === end-of-board)){stabilities.push(STABLE)}
        // else if((firstBound == minPlayer && secondBound == end-of-board) || (firstBound == end-of-board && secondBound == minPlayer)){stabilities.push(STABLE)}
        // else if((firstBound == minPlayer && secondBound == minPlayer)){stabilities.push(STABLE)}
        // else stabilities.push(SEMISTABLE)
      // coinStability = min(stabilities)

  let maxPlayerStability = 0
  let minPlayerStability = 0
  for(let y=0; y<board.length; y++){
    for(let x=0; x<board[0].length; x++){
      if(board[y][x] === maxPlayer){
        let stabilities = []
        HALFDIRECTIONS.map((direction) => {
          let firstBound
          let secondBound
          let firstBoundPosition = move([y, x], direction)
          while(firstBoundPosition !== null && board[firstBoundPosition[0]][firstBoundPosition[1]] !== 0 && board[firstBoundPosition[0]][firstBoundPosition[1]] !== minPlayer){
            firstBoundPosition = move(firstBoundPosition, direction)
          }
          let secondBoundPosition = move([y, x], oppositeDirection(direction))
          while(secondBoundPosition !== null && board[secondBoundPosition[0]][secondBoundPosition[1]] !== 0 && board[secondBoundPosition[0]][secondBoundPosition[1]] !== minPlayer){
            secondBoundPosition = move(secondBoundPosition, oppositeDirection(direction))
          }

          if(firstBoundPosition !== null && secondBoundPosition !== null){
            if((board[firstBoundPosition[0]][firstBoundPosition[1]] == minPlayer && board[secondBoundPosition[0]][secondBoundPosition[1]] == 0) || (board[firstBoundPosition[0]][firstBoundPosition[1]] == 0 && board[secondBoundPosition[0]][secondBoundPosition[1]] == minPlayer)){
              stabilities.push(UNSTABLE)
            } else {
              if(board[firstBoundPosition[0]][firstBoundPosition[1]] == minPlayer && board[secondBoundPosition[0]][secondBoundPosition[1]] == minPlayer){
                stabilities.push(STABLE)
              } else {
                stabilities.push(SEMISTABLE)
              }
            }
          } else {
            stabilities.push(STABLE)
          }
        })
        // console.log('maxPlayerStabilities', stabilities)
        maxPlayerStability += _.min(stabilities)
      } else {
        if(board[y][x] === minPlayer){
          let stabilities = []
          HALFDIRECTIONS.map((direction) => {
            let firstBound
            let secondBound
            let firstBoundPosition = move([y, x], direction)
            while(firstBoundPosition !== null && board[firstBoundPosition[0]][firstBoundPosition[1]] !== 0 && board[firstBoundPosition[0]][firstBoundPosition[1]] !== maxPlayer){
              firstBoundPosition = move(firstBoundPosition, direction)
            }
            let secondBoundPosition = move([y, x], oppositeDirection(direction))
            while(secondBoundPosition !== null && board[secondBoundPosition[0]][secondBoundPosition[1]] !== 0 && board[secondBoundPosition[0]][secondBoundPosition[1]] !== maxPlayer){
              secondBoundPosition = move(secondBoundPosition, oppositeDirection(direction))
            }

            if(firstBoundPosition !== null && secondBoundPosition !== null){
              if((board[firstBoundPosition[0]][firstBoundPosition[1]] == maxPlayer && board[secondBoundPosition[0]][secondBoundPosition[1]] == 0) || (board[firstBoundPosition[0]][firstBoundPosition[1]] == 0 && board[secondBoundPosition[0]][secondBoundPosition[1]] == maxPlayer)){
                stabilities.push(UNSTABLE)
              } else {
                if(board[firstBoundPosition[0]][firstBoundPosition[1]] == maxPlayer && board[secondBoundPosition[0]][secondBoundPosition[1]] == maxPlayer){
                  stabilities.push(STABLE)
                } else {
                  stabilities.push(SEMISTABLE)
                }
              }
            } else {
              stabilities.push(STABLE)
            }
          })
          // console.log('minPlayerStabilities', stabilities)
          minPlayerStability += _.min(stabilities)
        }
      }
    }
  }
  // console.log('maxPlayerStability', maxPlayerStability)
  // console.log('minPlayerStability', minPlayerStability)

  if(maxPlayerStability + minPlayerStability != 0){
    return 100 * (maxPlayerStability - minPlayerStability) / (maxPlayerStability + minPlayerStability)
  } else {
    return 0
  }
}
// console.log('stabilityHeuristic 1', stabilityHeuristic(parseBoard(exampleBoard), 1, 2))

const heuristic = (board, maxPlayer, minPlayer) => {
  // console.log('coinParityHeuristic', coinParityHeuristic(board, maxPlayer, minPlayer))
  // console.log('mobilityHeuristic', mobilityHeuristic(board, maxPlayer, minPlayer))
  // console.log('cornersHeuristic', cornersHeuristic(board, maxPlayer, minPlayer))
  // console.log('stabilityHeuristic', stabilityHeuristic(board, maxPlayer, minPlayer))
  return (25*coinParityHeuristic(board, maxPlayer, minPlayer) + 5*mobilityHeuristic(board, maxPlayer, minPlayer) + 30*cornersHeuristic(board, maxPlayer, minPlayer) + 25*stabilityHeuristic(board, maxPlayer, minPlayer))/85
}

// 50000 boards in 5.41s ~ Approx 4 levels down considering branching factor of 10 (Regularly the max for Reversi)
// for(let i=0; i<50000; i++){
//   heuristic(exampleBoard, 1, 2) 
// }

// const minimax()

const playMove = (board, movePosition, player) => {
  // console.log('Player playing', player)
  // console.log('player', player, 'move', movePosition)
  // console.log('Input board', board)
  // Calculate opponent
  let copiedBoard = []
  for(let yi=0; yi<board.length; yi++){
    copiedBoard.push([])
    for(let xi=0; xi<board[0].length; xi++){
      copiedBoard[yi].push(board[yi][xi])
    }
  }

  const opponent = player === 1 ? 2 : 1

  // Place coin
  copiedBoard[movePosition[0]][movePosition[1]] = player

  // Flip coins
  ALLDIRECTIONS.map((direction) => {
    let coinsToBeFlipped = []
    let tempPosition = move(movePosition, direction)
    while(tempPosition !== null && copiedBoard[tempPosition[0]][tempPosition[1]] !== 0){
      if(copiedBoard[tempPosition[0]][tempPosition[1]] === opponent){
        coinsToBeFlipped.push(tempPosition)
      } else {
        if(copiedBoard[tempPosition[0]][tempPosition[1]] === player){
          if(coinsToBeFlipped.length !== 0){
            coinsToBeFlipped.map((position) => {
              copiedBoard[position[0]][position[1]] = player
            })
            break
          }
        }
      }
      tempPosition = move(tempPosition, direction)
    }
  })

  // console.log('Output copiedBoard', copiedBoard)
  return copiedBoard
}

const oppositeMinimaxMode = (mode) => {
  if(mode === MAXIMIZER){
    return MINIMIZER
  } else {
    return MAXIMIZER
  }
}

export const randomValidMove = (board, player) => {
  // console.log('Calling randomValidMove with board', board, 'player', player)
  const possibleMoves = validMoves(parseBoard(board), player)
  // console.log('possibleMoves', possibleMoves)
  return positionToServerInt(possibleMoves[_.random(possibleMoves.length - 1)])
}


/*

minimax = (board, maxPlayer, minPlayer, alpha, beta, mode, depth) => (value, maybe move)

minimax(board, maxPlayer, minPlayer, alpha, beta, mode, depth):
  Obtener movimientos validos para el maxPlayer
  Si no hay movimientos validos
    Si el oponente tiene movimientos validos, llamar a minimax con el mismo depth pero cambiando el modo
    Si el oponente no tiene movimientos validos, calcular heuristica dependiendo del modo del tablero actual y retornar valor con movimiento null
  Si hay movimientos validos
    Inicializar valor de nodo como el peor, dependiendo del modo
    Para cada movimiento valido
      Comparar el valor del nodo con alpha o beta, dependiendo del modo, para ver si se puede saltar ésta iteración
      Obtener el tablero luego de poner la pieza
      Si depth no es 0
        Llamar a minimax con el nuevo tablero y nuevos alpha y beta, volteando el modo y restando 1 de depth
      Si depth es 0
        Calcular la heuristica del tablero, dependiendo del modo
      Actualizar alpha o beta y el valor del nodo con el movimiento correspondiente, dependiendo si corresponde dependiendo del modo
    Return valor de nodo con el movimiento correspondiente

minimax(board, maxPlayer, minPlayer, -Infinity, Infinity, MAXIMIZER, 5)

*/

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

const opponent = (id) => {
  if(id === 1){
    return 2
  } else {
    return 1
  }
}

export const simpleMinimax = (board, maxPlayer) => positionToServerInt(minimax(parseBoard(board), maxPlayer, opponent(maxPlayer), -Infinity, Infinity, MAXIMIZER, MAXIMIZER, 5)[1])


// const minimaxResponse = minimax(parseBoard(exampleBoard), 1, 2, -Infinity, Infinity, MAXIMIZER, MAXIMIZER, 1)
// console.log('minimax', minimaxResponse[0], minimaxResponse[1], positionToServerInt(minimaxResponse[1]))
