function checkWin  (board, player)  {
    for (let i = 0; i < 3; i++) {
        if (board[i].every(cell => cell === player) || board.every(row => row[i] === player)) return true
    }
    if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true
    return board[0][2] === player && board[1][1] === player && board[2][0] === player;

}
