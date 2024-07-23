const WebSocket = require('ws')
const {checkWin} = require("./helpers");

const ws = new WebSocket('ws://localhost:3000')

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'join' }))
})

ws.on('message', message => {
    const { type, gameId, game } = JSON.parse(message)
    if (type === 'gameStarted') {
        ws.gameId = gameId
        ws.send(JSON.stringify({ type: 'move', gameId: ws.gameId, player: 'X', x: 0, y: 0 }))
    } else if (type === 'moveMade') {
        if (game.currentPlayer === 'X') {
            const move = getBestMove(game.board, 'X')
            ws.send(JSON.stringify({ type: 'move', gameId: ws.gameId, player: 'X', x: move.x, y: move.y }))
        }
    }
})

const getBestMove = (board, player) => {
    const opponent = player === 'X' ? 'O' : 'X'
    let bestScore = -Infinity
    let move

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === null) {
                board[i][j] = player
                let score = minimax(board, 0, false, player, opponent)
                board[i][j] = null
                if (score > bestScore) {
                    bestScore = score
                    move = { x: i, y: j }
                }
            }
        }
    }

    return move
}

const minimax = (board, depth, isMaximizing, player, opponent) => {
    if (checkWin(board, player)) return 10 - depth
    if (checkWin(board, opponent)) return depth - 10
    if (isBoardFull(board)) return 0

    if (isMaximizing) {
        let bestScore = -Infinity
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === null) {
                    board[i][j] = player
                    let score = minimax(board, depth + 1, false, player, opponent)
                    board[i][j] = null
                    bestScore = Math.max(score, bestScore)
                }
            }
        }
        return bestScore
    } else {
        let bestScore = Infinity
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === null) {
                    board[i][j] = opponent
                    let score = minimax(board, depth + 1, true, player, opponent)
                    board[i][j] = null
                    bestScore = Math.min(score, bestScore)
                }
            }
        }
        return bestScore
    }
}

const isBoardFull = board => board.every(row => row.every(cell => cell !== null))
