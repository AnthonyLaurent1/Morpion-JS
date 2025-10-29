class TicTacToe {
    constructor() {
        this.currentPlayer = 'X';
        this.board = Array(9).fill('');
        this.gameActive = false;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.playerTurn = document.getElementById('player-turn');
        this.cells = document.querySelectorAll('.cell');
        this.startButton = document.getElementById('start-button');
        this.rageQuitButton = document.getElementById('rage-quit');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.rageQuitButton.addEventListener('click', () => this.endGame());
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
    }

    startGame() {
        this.gameActive = true;
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.updatePlayerTurn();
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
    }

    handleCellClick(cell) {
        const index = cell.dataset.index;
        if (this.gameActive && this.board[index] === '') {
            this.board[index] = this.currentPlayer;
            cell.textContent = this.currentPlayer;
            cell.classList.add(this.currentPlayer.toLowerCase());
            
            if (this.checkWinner()) {
                this.endGame(this.currentPlayer);
                return;
            }
            
            if (this.checkDraw()) {
                this.endGame('draw');
                return;
            }
            
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updatePlayerTurn();
        }
    }
}

// Initialiser le jeu
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});