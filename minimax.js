export const randomValidMove = (board, player) => {
  // console.log('Calling randomValidMove with board', board, 'player', player)
  const possibleMoves = validMoves(parseBoard(board), player)
  // console.log('possibleMoves', possibleMoves)
  return positionToServerInt(possibleMoves[_.random(possibleMoves.length - 1)])
}