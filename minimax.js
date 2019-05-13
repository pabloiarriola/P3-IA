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