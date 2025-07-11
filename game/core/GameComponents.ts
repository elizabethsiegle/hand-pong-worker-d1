export const AI_CONTROLLER = `
class AIController {
    constructor(game) {
        this.game = game;
    }
    
    update() {
        const g = this.game, b = g.ball, p = g.paddle2;
        const ballCenterY = b.y, paddleCenterY = p.y + p.height / 2, diff = ballCenterY - paddleCenterY;
        const aiSpeed = g.difficulty === 'easy' ? 400 : g.difficulty === 'hard' ? 800 : 600;
        const reactionDelay = g.difficulty === 'easy' ? 0.4 : g.difficulty === 'hard' ? 0.08 : 0.2;
        
        if (b.vx > 0 && Math.abs(b.x - p.x) < g.gameCanvas.width * reactionDelay) {
            if (Math.abs(diff) > 15) {
                const moveAmount = Math.sign(diff) * aiSpeed / 60;
                p.y = Math.max(0, Math.min(g.gameCanvas.height - p.height, p.y + moveAmount));
                p.vy = Math.sign(diff) * aiSpeed;
            } else {
                p.vy = 0;
            }
        } else {
            const centerY = g.gameCanvas.height / 2 - p.height / 2, centerDiff = centerY - p.y;
            if (Math.abs(centerDiff) > 5) {
                const moveAmount = Math.sign(centerDiff) * aiSpeed * 0.4 / 60;
                p.y += moveAmount;
                p.vy = Math.sign(centerDiff) * aiSpeed * 0.4;
            } else {
                p.vy = 0;
            }
        }
    }
}
`;

export const HAND_PONG_GAME = `
class HandPongGame {
    constructor() {
        this.initializeCanvases();
        this.initializeGameState();
        this.initializeComponents();
        this.startGame();
    }
    
    initializeCanvases() {
        const $ = id => document.getElementById(id);
        this.videoCanvas = $('videoCanvas');
        this.gameCanvas = $('gameCanvas');
        this.handCanvas = $('handCanvas');
        this.videoCtx = this.videoCanvas.getContext('2d');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.handCtx = this.handCanvas.getContext('2d');
    }
    
    initializeGameState() {
        Object.assign(this, {
            gameMode: null,
            difficulty: 'normal',
            gameActive: false,
            score: { player1: 0, player2: 0 },
            gameStartTime: 0,
            gameDuration: 0,
            timerInterval: null,
            username: '',
            lastHitter: null,
            playerNames: { player1: '', player2: '', aiOpponent: '' },
            fixedTimeStep: 1000/60,
            lastFrameTime: 0,
            accumulator: 0,
            maxDeltaTime: 250,
            ball: { x: 0, y: 0, renderX: 0, renderY: 0, prevX: 0, prevY: 0, vx: 1000, vy: 600, radius: 15, history: [] },
            paddle1: { x: 50, y: 0, width: 20, height: 140, vy: 0 },
            paddle2: { x: 0, y: 0, width: 20, height: 140, vy: 0 }
        });
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
        const width = container.offsetWidth, height = container.offsetHeight;
        [this.videoCanvas, this.gameCanvas, this.handCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
        this.physics.resetBall();
        this.physics.resetPaddles();
    }
    
    async generatePlayerNames() {
        try {
            const response = await fetch('/api/generate-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.gameMode === 'single' ? 
                    { type: 'ai_opponent', playerUsername: this.username } : 
                    { type: 'multiplayer' })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (this.gameMode === 'single') {
                    this.playerNames.aiOpponent = data.aiName;
                } else {
                    this.playerNames.player1 = data.player1Name;
                    this.playerNames.player2 = data.player2Name;
                }
            } else {
                if (this.gameMode === 'single') {
                    this.playerNames.aiOpponent = 'CyberServe';
                } else {
                    this.playerNames.player1 = 'EdgeRunner';
                    this.playerNames.player2 = 'WorkerBee';
                }
            }
        } catch (error) {
            if (this.gameMode === 'single') {
                this.playerNames.aiOpponent = 'CyberServe';
            } else {
                this.playerNames.player1 = 'EdgeRunner';
                this.playerNames.player2 = 'WorkerBee';
            }
        }
    }
    
    getPlayer1DisplayName() {
        return this.gameMode === 'single' ? (this.username || 'You') : (this.playerNames.player1 || 'Player 1');
    }
    
    getPlayer2DisplayName() {
        return this.gameMode === 'single' ? (this.playerNames.aiOpponent || 'AI') : (this.playerNames.player2 || 'Player 2');
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.accumulator += deltaTime > this.maxDeltaTime ? this.fixedTimeStep : deltaTime;
        
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