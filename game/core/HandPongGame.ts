export const HAND_PONG_GAME = `
class HandPongGame {
    constructor() {
        this.initializeCanvases();
        this.initializeGameState();
        this.initializeComponents();
        this.startGame();
    }
    
    initializeCanvases() {
        this.videoCanvas = document.getElementById('videoCanvas');
        this.gameCanvas = document.getElementById('gameCanvas');
        this.handCanvas = document.getElementById('handCanvas');
        this.videoCtx = this.videoCanvas.getContext('2d');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.handCtx = this.handCanvas.getContext('2d');
    }
    
    initializeGameState() {
        this.gameMode = null;
        this.difficulty = 'normal';
        this.gameActive = false;
        this.score = { player1: 0, player2: 0 };
        this.gameStartTime = 0;
        this.gameDuration = 0;
        this.timerInterval = null;
        this.username = '';
        
        // Generated names for display
        this.playerNames = {
            player1: '',
            player2: '', // AI opponent or second player
            aiOpponent: '' // Specifically for single player mode
        };
        
        this.fixedTimeStep = 1000/60;
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.maxDeltaTime = 250;
        
        this.ball = { 
            x: 0, y: 0, 
            renderX: 0, renderY: 0,
            prevX: 0, prevY: 0,
            vx: 1000, vy: 600,
            radius: 15,
            history: []
        };
        
        this.paddle1 = { x: 50, y: 0, width: 20, height: 140, vy: 0 };
        this.paddle2 = { x: 0, y: 0, width: 20, height: 140, vy: 0 };
    }
    
    async initializeComponents() {
        this.handDetection = new HandDetection(this);
        this.physics = new PhysicsEngine(this);
        this.ai = new AIController(this);
        this.ui = new UIManager(this);
        this.renderer = new RenderEngine(this);
        
        await this.handDetection.initialize();
        this.resizeCanvases();
        this.ui.setupEventListeners();
        
        window.addEventListener('resize', () => this.resizeCanvases());
    }
    
    resizeCanvases() {
        const container = document.getElementById('gameContainer');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        
        [this.videoCanvas, this.gameCanvas, this.handCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
        
        this.physics.resetBall();
        this.physics.resetPaddles();
    }
    
    // Generate names for players based on game mode
    async generatePlayerNames() {
        try {
            if (this.gameMode === 'single') {
                // Generate AI opponent name
                const response = await fetch('/api/generate-names', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        type: 'ai_opponent', 
                        playerUsername: this.username 
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.playerNames.aiOpponent = data.aiName;
                    console.log('Generated AI opponent name:', data.aiName);
                } else {
                    this.playerNames.aiOpponent = 'CyberServe';
                }
            } else if (this.gameMode === 'multi') {
                // Generate names for both players
                const response = await fetch('/api/generate-names', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'multiplayer' })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.playerNames.player1 = data.player1Name;
                    this.playerNames.player2 = data.player2Name;
                    console.log('Generated multiplayer names:', data.player1Name, 'vs', data.player2Name);
                } else {
                    this.playerNames.player1 = 'EdgeRunner';
                    this.playerNames.player2 = 'WorkerBee';
                }
            }
        } catch (error) {
            console.error('Failed to generate names:', error);
            // Set fallback names
            if (this.gameMode === 'single') {
                this.playerNames.aiOpponent = 'CyberServe';
            } else {
                this.playerNames.player1 = 'EdgeRunner';
                this.playerNames.player2 = 'WorkerBee';
            }
        }
    }
    
    // Get display name for player 1
    getPlayer1DisplayName() {
        if (this.gameMode === 'single') {
            return this.username || 'You';
        } else {
            return this.playerNames.player1 || 'Player 1';
        }
    }
    
    // Get display name for player 2
    getPlayer2DisplayName() {
        if (this.gameMode === 'single') {
            return this.playerNames.aiOpponent || 'AI';
        } else {
            return this.playerNames.player2 || 'Player 2';
        }
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (deltaTime > this.maxDeltaTime) {
            this.accumulator = this.fixedTimeStep;
        } else {
            this.accumulator += deltaTime;
        }
        
        while (this.accumulator >= this.fixedTimeStep) {
            this.ball.prevX = this.ball.x;
            this.ball.prevY = this.ball.y;
            
            this.handDetection.detectHands();
            if (this.gameActive) {
                this.physics.updateBallPhysics(this.fixedTimeStep / 1000);
                this.physics.checkScore();
            }
            
            this.accumulator -= this.fixedTimeStep;
        }
        
        if (this.gameActive) {
            const interpolation = this.accumulator / this.fixedTimeStep;
            this.ball.renderX = this.ball.prevX + (this.ball.x - this.ball.prevX) * interpolation;
            this.ball.renderY = this.ball.prevY + (this.ball.y - this.ball.prevY) * interpolation;
        }
        
        this.renderer.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    startGame() {
        this.gameLoop();
    }
}
`;