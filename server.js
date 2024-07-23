const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const mongoose = require('mongoose')
const {checkWin} = require("./helpers");

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

mongoose.connect(
    'mongodb://localhost:27017/tictactoe',
    {useNewUrlParser: true, useUnifiedTopology: true}
    ).then(r => {
        console.info('Connected to the DB')
    })

const gameSchema = new mongoose.Schema({
    board: { type: Array, default: () => Array(3).fill(null).map(() => Array(3).fill(null)) },
    currentPlayer: { type: String, default: 'X' },
    rounds: { type: Array, default: [] },
    scores: { type: Object, default: { X: 0, O: 0 } }
})

const Game = mongoose.model('Game', gameSchema)

const createEmptyBoard = () => Array(3).fill(null).map(() => Array(3).fill(null))

const isBoardFull = board => board.every(row => row.every(cell => cell !== null))

const startNewGame = async () => {
    const game = new Game()
    await game.save()
    return game
}

const makeMove = async (gameId, player, x, y) => {
    const game = await Game.findById(gameId)
    if (game.board[x][y] === null) {
        game.board[x][y] = player
        if (checkWin(game.board, player)) {
            game.scores[player]++
            game.rounds.push({ winner: player, moves: countMoves(game.board), emptyCells: countEmptyCells(game.board) })
            game.board = createEmptyBoard()
        } else if (isBoardFull(game.board)) {
            game.rounds.push({ winner: null, moves: countMoves(game.board), emptyCells: countEmptyCells(game.board) })
            game.board = createEmptyBoard()
        } else {
            game.currentPlayer = player === 'X' ? 'O' : 'X'
        }
        await game.save()
    }
    return game
}

const countMoves = board => board.flat().filter(cell => cell !== null).length

const countEmptyCells = board => board.flat().filter(cell => cell === null).length

wss.on('connection', ws => {
    ws.on('message', async message => {
        const { type, gameId, player, x, y } = JSON.parse(message)
        if (type === 'join') {
            const game = await startNewGame()
            ws.send(JSON.stringify({ type: 'gameStarted', gameId: game._id }))
        } else if (type === 'move') {
            const game = await makeMove(gameId, player, x, y)
            if (game.scores[player] >= 2) {
                ws.send(JSON.stringify({ type: 'gameOver', winner: player }))
            } else {
                ws.send(JSON.stringify({ type: 'moveMade', game }))
            }
        }
    })
})

app.get('/allRounds', async (req, res) => {
    const allGames = await Game.find()
    const allRounds = allGames.flatMap(game => game.rounds)
    res.json(allRounds)
})

app.get('/gameResults', async (req, res) => {
    const allGames = await Game.find()
    const gameResults = allGames.map(game => ({
        winner: game.scores.X > game.scores.O ? 'X' : 'O',
        X: game.scores.X,
        O: game.scores.O
    }))
    res.json(gameResults)
})

server.listen(3000, () => {
    console.log('Server started on port 3000')
})
