const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'join' }));
});

ws.on('message', message => {
    const { type, gameId, game } = JSON.parse(message);
    if (type === 'gameStarted') {
        ws.gameId = gameId;
    } else if (type === 'moveMade') {
        if (game.currentPlayer === 'O') {
            const move = getRandomMove(game.board);
            ws.send(JSON.stringify({ type: 'move', gameId: ws.gameId, player: 'O', x: move.x, y: move.y }));
        }
    }
});

function getRandomMove(board) {
    const emptyCells = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i][j] === null) emptyCells.push({ x: i, y: j });
        }
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
