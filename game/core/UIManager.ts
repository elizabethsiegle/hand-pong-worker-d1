export const UI_MANAGER = `
class UIManager {
    constructor(game) {
        this.game = game;
    }
    
    setupEventListeners() {
        const $ = id => document.getElementById(id);
        $('singlePlayerBtn').addEventListener('click', () => this.selectGameMode('single'));
        $('multiPlayerBtn').addEventListener('click', () => this.selectGameMode('multi'));
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDifficulty(e.target.dataset.difficulty, e));
        });
        
        const usernameInput = $('usernameInput'), startButton = $('startButton');
        usernameInput.addEventListener('input', (e) => {
            const username = e.target.value.trim();
            startButton.disabled = username.length < 2;
            if (username.length >= 2) this.game.username = username;
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !startButton.disabled) this.startGameSession();
        });
        
        startButton.addEventListener('click', () => this.startGameSession());
        $('playAgainButton').addEventListener('click', () => this.playAgain());
        $('backToMenuButton').addEventListener('click', () => this.backToMenu());
    }
    
    selectGameMode(mode) {
        this.game.gameMode = mode;
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById(mode === 'single' ? 'singlePlayerBtn' : 'multiPlayerBtn').classList.add('selected');
        document.getElementById('difficultyPanel').classList.remove('hidden');
        ['usernameInput', 'startButton'].forEach(id => document.getElementById(id).classList.add('hidden'));
    }
    
    selectDifficulty(difficulty, event) {
        this.game.difficulty = difficulty;
        document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        
        const usernameInput = document.getElementById('usernameInput');
        const startButton = document.getElementById('startButton');
        
        if (this.game.gameMode === 'single') {
            usernameInput.classList.remove('hidden');
            startButton.classList.remove('hidden');
            startButton.disabled = !this.game.username || this.game.username.length < 2;
            setTimeout(() => usernameInput.focus(), 100);
        } else {
            startButton.classList.remove('hidden');
            startButton.disabled = false;
        }
    }
    
    async startGameSession() {
        const startButton = document.getElementById('startButton');
        const originalText = startButton.textContent;
        startButton.textContent = '🎮 Generating opponent...';
        startButton.disabled = true;
        
        try {
            await this.game.generatePlayerNames();
            Object.assign(this.game, {
                gameActive: true,
                hands: [],
                score: { player1: 0, player2: 0 },
                gameStartTime: Date.now(),
                gameDuration: 0,
                lastHitter: null
            });
            
            ['infoPanel'].forEach(id => document.getElementById(id).classList.add('hidden'));
            ['timer'].forEach(id => document.getElementById(id).classList.remove('hidden'));
            
            this.game.physics.resetBall();
            this.game.physics.resetPaddles();
            
            this.game.timerInterval = setInterval(() => {
                if (this.game.gameActive) {
                    this.game.gameDuration = Date.now() - this.game.gameStartTime;
                    this.updateTimer();
                }
            }, 100);
        } catch (error) {
            startButton.textContent = originalText;
            startButton.disabled = false;
        }
    }
    
    updateTimer() {
        const seconds = Math.floor(this.game.gameDuration / 1000);
        const minutes = Math.floor(seconds / 60);
        document.getElementById('timer').textContent = \`Timer: \${minutes.toString().padStart(2, '0')}:\${(seconds % 60).toString().padStart(2, '0')}\`;
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
        document.getElementById('ui').classList.remove('active');
        
        const winner = this.game.score.player1 >= 5 ? 'player1' : 'player2';
        const winnerName = winner === 'player1' ? this.game.getPlayer1DisplayName() : this.game.getPlayer2DisplayName();
        this.showCelebration(winnerName + ' Wins!');
        
        if (this.game.gameMode === 'single' && winner === 'player1') {
            this.saveScore().then(() => setTimeout(() => this.showLeaderboard(), 2500));
        } else {
            setTimeout(() => this.showLeaderboard(), 2500);
        }
    }
    
    showCelebration(text) {
        const celebration = document.createElement('div');
        celebration.textContent = text;
        celebration.style.cssText = \`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;font-weight:bold;color:#FFD700;text-shadow:2px 2px 4px rgba(0,0,0,0.5);z-index:1000;animation:celebrationPulse 2.5s ease-out;pointer-events:none\`;
        
        if (!document.getElementById('celebrationStyles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'celebrationStyles';
            styleSheet.textContent = \`@keyframes celebrationPulse{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}\`;
            document.head.appendChild(styleSheet);
        }
        
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 2500);
    }
    
    async saveScore() {
        if (this.game.gameMode !== 'single' || !this.game.username) return;
        try {
            await fetch('/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.game.username,
                    score: this.game.score.player1,
                    time: Math.floor(this.game.gameDuration / 1000),
                    difficulty: this.game.difficulty
                })
            });
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
    
    async showLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const leaderboard = await response.json();
            const content = document.getElementById('leaderboardContent');
            content.innerHTML = leaderboard.length === 0 ? '<p>No scores yet! Be the first to play!</p>' : '';
            
            leaderboard.forEach((entry, index) => {
                const isCurrentPlayer = entry.username === this.game.username && entry.score === this.game.score.player1;
                const entryDiv = document.createElement('div');
                entryDiv.className = 'leaderboard-entry' + (isCurrentPlayer ? ' current-player' : '');
                
                const rank = index + 1;
                const rankEmoji = rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : rank === 3 ? 'Bronze' : '#' + rank;
                const timeStr = Math.floor(entry.time / 60) + ':' + (entry.time % 60).toString().padStart(2, '0');
                
                entryDiv.innerHTML = \`<span class="leaderboard-rank">\${rankEmoji}</span><span class="leaderboard-name">\${entry.username}</span><span class="leaderboard-stats">Score: \${entry.score} | Time: \${timeStr} | \${entry.difficulty}</span>\`;
                content.appendChild(entryDiv);
            });
            
            document.getElementById('leaderboardPanel').classList.remove('hidden');
        } catch (error) {
            document.getElementById('leaderboardContent').innerHTML = '<p>Error loading leaderboard</p>';
            document.getElementById('leaderboardPanel').classList.remove('hidden');
        }
    }
    
    playAgain() {
        document.getElementById('leaderboardPanel').classList.add('hidden');
        this.game.lastHitter = null;
        this.startGameSession();
    }
    
    backToMenu() {
        ['leaderboardPanel', 'timer'].forEach(id => document.getElementById(id).classList.add('hidden'));
        ['infoPanel'].forEach(id => document.getElementById(id).classList.remove('hidden'));
        
        document.getElementById('ui').classList.remove('active');
        ['difficultyPanel', 'usernameInput', 'startButton'].forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById('usernameInput').value = '';
        
        const startButton = document.getElementById('startButton');
        startButton.textContent = '🎮 Start Game';
        startButton.disabled = false;
        
        document.querySelectorAll('.mode-btn, .difficulty-btn').forEach(btn => btn.classList.remove('selected'));
        
        Object.assign(this.game, {
            gameMode: null,
            username: '',
            lastHitter: null,
            playerNames: { player1: '', player2: '', aiOpponent: '' }
        });
    }
    
    updateUI() {
        const scoresDiv = document.getElementById('scores');
        const uiDiv = document.getElementById('ui');
        scoresDiv.innerHTML = '';
        
        if (this.game.gameActive) {
            uiDiv.classList.add('active');
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'player-score';
            scoreDiv.innerHTML = \`<strong>\${this.game.getPlayer1DisplayName()}:</strong> \${this.game.score.player1} | <strong>\${this.game.getPlayer2DisplayName()}:</strong> \${this.game.score.player2} | <strong>First to 5 wins!</strong>\`;
            scoresDiv.appendChild(scoreDiv);
        } else {
            uiDiv.classList.remove('active');
        }
    }
}
`;