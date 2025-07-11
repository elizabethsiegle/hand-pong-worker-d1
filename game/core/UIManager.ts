export const UI_MANAGER = `
class UIManager {
    constructor(game) {
        this.game = game;
    }
    
    setupEventListeners() {
        const singlePlayerBtn = document.getElementById('singlePlayerBtn');
        const multiPlayerBtn = document.getElementById('multiPlayerBtn');
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        const usernameInput = document.getElementById('usernameInput');
        const startButton = document.getElementById('startButton');
        const playAgainButton = document.getElementById('playAgainButton');
        const backToMenuButton = document.getElementById('backToMenuButton');
        
        singlePlayerBtn.addEventListener('click', () => this.selectGameMode('single'));
        multiPlayerBtn.addEventListener('click', () => this.selectGameMode('multi'));
        
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDifficulty(e.target.dataset.difficulty, e));
        });
        
        usernameInput.addEventListener('input', (e) => {
            const username = e.target.value.trim();
            startButton.disabled = username.length < 2;
            if (username.length >= 2) {
                this.game.username = username;
            }
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !startButton.disabled) {
                this.startGameSession();
            }
        });
        
        startButton.addEventListener('click', () => this.startGameSession());
        playAgainButton.addEventListener('click', () => this.playAgain());
        backToMenuButton.addEventListener('click', () => this.backToMenu());
    }
    
    selectGameMode(mode) {
        this.game.gameMode = mode;
        
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (mode === 'single') {
            document.getElementById('singlePlayerBtn').classList.add('selected');
        } else {
            document.getElementById('multiPlayerBtn').classList.add('selected');
        }
        
        document.getElementById('difficultyPanel').classList.remove('hidden');
        
        if (mode === 'single') {
            document.getElementById('usernameInput').classList.add('hidden');
            document.getElementById('startButton').classList.add('hidden');
        } else {
            document.getElementById('usernameInput').classList.add('hidden');
            document.getElementById('startButton').classList.add('hidden');
        }
    }
    
    selectDifficulty(difficulty, event) {
        this.game.difficulty = difficulty;
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        if (this.game.gameMode === 'single') {
            document.getElementById('usernameInput').classList.remove('hidden');
            document.getElementById('startButton').classList.remove('hidden');
            document.getElementById('startButton').disabled = !this.game.username || this.game.username.length < 2;
            
            setTimeout(() => {
                document.getElementById('usernameInput').focus();
            }, 100);
        } else {
            document.getElementById('startButton').classList.remove('hidden');
            document.getElementById('startButton').disabled = false;
        }
    }
    
    async startGameSession() {
        // Show loading state
        const startButton = document.getElementById('startButton');
        const originalText = startButton.textContent;
        startButton.textContent = '🎮 Generating opponent...';
        startButton.disabled = true;
        
        try {
            // Generate player names first
            await this.game.generatePlayerNames();
            
            // Now start the game
            this.game.gameActive = true;
            this.game.hands = [];
            this.game.score = { player1: 0, player2: 0 };
            this.game.gameStartTime = Date.now();
            this.game.gameDuration = 0;
            
            document.getElementById('infoPanel').classList.add('hidden');
            document.getElementById('timer').classList.remove('hidden');
            
            this.game.physics.resetBall();
            this.game.physics.resetPaddles();
            
            this.game.timerInterval = setInterval(() => {
                if (this.game.gameActive) {
                    this.game.gameDuration = Date.now() - this.game.gameStartTime;
                    this.updateTimer();
                }
            }, 100);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            startButton.textContent = originalText;
            startButton.disabled = false;
        }
    }
    
    updateTimer() {
        const seconds = Math.floor(this.game.gameDuration / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const timerText = 'Timer: ' + minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
        document.getElementById('timer').textContent = timerText;
    }
    
    stopTimer() {
        if (this.game.timerInterval) {
            clearInterval(this.game.timerInterval);
            this.game.timerInterval = null;
        }
    }
    
    endGame() {
        this.game.gameActive = false;
        this.stopTimer();
        
        // Hide the UI scores when game ends
        const uiDiv = document.getElementById('ui');
        uiDiv.classList.remove('active');
        
        const winner = this.game.score.player1 >= 5 ? 'player1' : 'player2';
        const winnerName = winner === 'player1' ? 
            this.game.getPlayer1DisplayName() : 
            this.game.getPlayer2DisplayName();
        
        this.showCelebration(winnerName + ' Wins!');
        
        if (this.game.gameMode === 'single' && winner === 'player1') {
            this.saveScore().then(() => {
                setTimeout(() => {
                    this.showLeaderboard();
                }, 2500);
            });
        } else {
            setTimeout(() => {
                this.showLeaderboard();
            }, 2500);
        }
    }
    
    showCelebration(text) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.textContent = text;
        celebration.style.cssText = \`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: #FFD700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            z-index: 1000;
            animation: celebrationPulse 2.5s ease-out;
            pointer-events: none;
        \`;
        
        // Add animation keyframes if not already present
        if (!document.getElementById('celebrationStyles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'celebrationStyles';
            styleSheet.textContent = \`
                @keyframes celebrationPulse {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                }
            \`;
            document.head.appendChild(styleSheet);
        }
        
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 2500);
    }
    
    async saveScore() {
        if (this.game.gameMode !== 'single' || !this.game.username) return;
        
        try {
            const response = await fetch('/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.game.username,
                    score: this.game.score.player1,
                    time: Math.floor(this.game.gameDuration / 1000),
                    difficulty: this.game.difficulty
                })
            });
            if (!response.ok) {
                console.error('Failed to save score');
            }
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
    
    async showLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();
            const content = document.getElementById('leaderboardContent');
            content.innerHTML = '';
            
            if (leaderboard.length === 0) {
                content.innerHTML = '<p>No scores yet! Be the first to play!</p>';
            } else {
                leaderboard.forEach((entry, index) => {
                    const isCurrentPlayer = entry.username === this.game.username && 
                                          entry.score === this.game.score.player1;
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'leaderboard-entry' + (isCurrentPlayer ? ' current-player' : '');
                    
                    const rank = index + 1;
                    const rankEmoji = rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : rank === 3 ? 'Bronze' : '#' + rank;
                    const timeMinutes = Math.floor(entry.time / 60);
                    const timeSeconds = entry.time % 60;
                    const timeStr = timeMinutes + ':' + timeSeconds.toString().padStart(2, '0');
                    
                    entryDiv.innerHTML = 
                        '<span class="leaderboard-rank">' + rankEmoji + '</span>' +
                        '<span class="leaderboard-name">' + entry.username + '</span>' +
                        '<span class="leaderboard-stats">Score: ' + entry.score + ' | ' + 
                        'Time: ' + timeStr + ' | ' + entry.difficulty + '</span>';
                    
                    content.appendChild(entryDiv);
                });
            }
            
            document.getElementById('leaderboardPanel').classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            document.getElementById('leaderboardContent').innerHTML = '<p>Error loading leaderboard</p>';
            document.getElementById('leaderboardPanel').classList.remove('hidden');
        }
    }
    
    playAgain() {
        document.getElementById('leaderboardPanel').classList.add('hidden');
        this.startGameSession();
    }
    
    backToMenu() {
        document.getElementById('leaderboardPanel').classList.add('hidden');
        document.getElementById('timer').classList.add('hidden');
        document.getElementById('infoPanel').classList.remove('hidden');
        
        // Hide the UI scores when returning to menu
        const uiDiv = document.getElementById('ui');
        uiDiv.classList.remove('active');
        
        document.getElementById('difficultyPanel').classList.add('hidden');
        document.getElementById('usernameInput').classList.add('hidden');
        document.getElementById('startButton').classList.add('hidden');
        document.getElementById('usernameInput').value = '';
        
        // Reset start button text
        document.getElementById('startButton').textContent = '🎮 Start Game';
        document.getElementById('startButton').disabled = false;
        
        document.querySelectorAll('.mode-btn, .difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.game.gameMode = null;
        this.game.username = '';
        
        // Reset player names
        this.game.playerNames = {
            player1: '',
            player2: '',
            aiOpponent: ''
        };
    }
    
    updateUI() {
        const scoresDiv = document.getElementById('scores');
        const uiDiv = document.getElementById('ui');
        scoresDiv.innerHTML = '';
        
        if (this.game.gameActive) {
            // Show the UI container when game is active
            uiDiv.classList.add('active');
            
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'player-score';
            
            const player1Name = this.game.getPlayer1DisplayName();
            const player2Name = this.game.getPlayer2DisplayName();
            
            scoreDiv.innerHTML = 
                '<strong>' + player1Name + ':</strong> ' + this.game.score.player1 + ' | ' +
                '<strong>' + player2Name + ':</strong> ' + this.game.score.player2 + ' | ' +
                '<strong>First to 5 wins!</strong>';
            scoresDiv.appendChild(scoreDiv);
        } else {
            // Hide the UI container when game is not active
            uiDiv.classList.remove('active');
        }
    }
}
`;