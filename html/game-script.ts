export const GAME_SCRIPT = `
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

/**
 * Hand-controlled Pong Game with Smooth Physics
 * Uses MediaPipe for hand detection and advanced algorithms for smooth ball movement
 */
class HandPongGame {
    constructor() {
        // Canvas and context initialization
        this.videoCanvas = document.getElementById('videoCanvas');
        this.gameCanvas = document.getElementById('gameCanvas');
        this.handCanvas = document.getElementById('handCanvas');
        this.videoCtx = this.videoCanvas.getContext('2d');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.handCtx = this.handCanvas.getContext('2d');
        
        // MediaPipe hand detection setup
        this.video = null;
        this.handLandmarker = null;
        this.hands = [];
        this.runningMode = "VIDEO";
        this.lastVideoTime = -1;
        
        // Game state management
        this.gameMode = null; // 'single' or 'multi'
        this.difficulty = 'normal';
        this.gameActive = false;
        this.score = { player1: 0, player2: 0 };
        this.gameStartTime = 0;
        this.gameDuration = 0;
        this.timerInterval = null;
        this.username = '';
        
        // Smooth physics system - Fixed timestep with interpolation
        this.fixedTimeStep = 1000/60; // 60 FPS physics updates
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.maxDeltaTime = 250; // Cap large frame gaps to prevent spiral of death
        
        // Pong game objects with physics properties
        this.ball = { 
            // Position and rendering
            x: 0, y: 0, 
            renderX: 0, renderY: 0, // Interpolated positions for smooth rendering
            prevX: 0, prevY: 0, // Previous positions for interpolation
            
            // Physics (FAST: ~1000 pixels/second ≈ 16-17 pixels/frame at 60fps)
            vx: 1000, vy: 600, // Velocity in pixels per second
            radius: 15,
            
            // Movement history for advanced smoothing
            history: []
        };
        
        // Player paddles (made longer for better gameplay)
        this.paddle1 = { x: 50, y: 0, width: 20, height: 140, vy: 0 }; // Left paddle (Player 1) - increased from 120 to 140
        this.paddle2 = { x: 0, y: 0, width: 20, height: 140, vy: 0 };   // Right paddle (Player 2/AI) - increased from 120 to 140
        
        this.initializeGame();
    }
    
    /**
     * Initialize the complete game system
     */
    async initializeGame() {
        await this.setupCamera();
        await this.initializeHandDetection();
        this.resizeCanvases();
        this.setupEventListeners();
        this.gameLoop(); // Start the main game loop
    }
    
    /**
     * Initialize MediaPipe hand detection with error handling
     */
    async initializeHandDetection() {
        const statusEl = document.getElementById('handStatus');
        const loadingEl = document.getElementById('loadingStatus');
        try {
            statusEl.textContent = 'Hands: Loading MediaPipe...';
            loadingEl.textContent = 'Loading Hand Landmarker...';
            
            // Load MediaPipe vision tasks
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            
            // Create hand landmarker with optimized settings
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU" // Use GPU acceleration for better performance
                },
                runningMode: this.runningMode,
                numHands: 2 // Detect up to 2 hands for multiplayer support
            });
            
            statusEl.textContent = 'Hands: AI Ready!';
            loadingEl.textContent = 'MediaPipe Loaded!';
            setTimeout(() => loadingEl.style.display = 'none', 2000);
            console.log('Hand detection initialized successfully');
        } catch (error) {
            console.error('Hand detection initialization failed:', error);
            statusEl.textContent = 'Hands: Failed to load';
            loadingEl.textContent = 'MediaPipe Failed';
        }
    }
    
    /**
     * Setup camera with optimal settings for hand detection
     */
    async setupCamera() {
        const statusEl = document.getElementById('cameraStatus');
        try {
            statusEl.textContent = '📷 Camera: Requesting access...';
            
            // Request camera with ideal settings for hand detection
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Front-facing camera
                }
            });
            
            // Setup video element
            this.video = document.createElement('video');
            this.video.srcObject = stream;
            this.video.autoplay = true;
            this.video.muted = true;
            this.video.playsInline = true;
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    statusEl.textContent = 'Camera: Ready (' + this.video.videoWidth + 'x' + this.video.videoHeight + ')';
                    this.video.play().then(() => {
                        console.log('Video playing successfully');
                        resolve();
                    }).catch(err => {
                        console.error('Video play failed:', err);
                        statusEl.textContent = 'Camera: Play failed';
                    });
                };
            });
        } catch (error) {
            console.error('Camera access failed:', error);
            statusEl.textContent = '📷 Camera: Access denied';
        }
    }
    
    /**
     * Resize all canvases to fit the container and update game object positions
     */
    resizeCanvases() {
        const container = document.getElementById('gameContainer');
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        
        // Set canvas dimensions
        [this.videoCanvas, this.gameCanvas, this.handCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
        
        // Update game object positions for new canvas size
        this.resetBall();
        this.resetPaddles();
    }
    
    /**
     * Setup all UI event listeners for game controls
     */
    setupEventListeners() {
        // Game mode selection
        const singlePlayerBtn = document.getElementById('singlePlayerBtn');
        const multiPlayerBtn = document.getElementById('multiPlayerBtn');
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        const usernameInput = document.getElementById('usernameInput');
        const startButton = document.getElementById('startButton');
        const playAgainButton = document.getElementById('playAgainButton');
        const backToMenuButton = document.getElementById('backToMenuButton');
        
        // Mode selection handlers
        singlePlayerBtn.addEventListener('click', () => this.selectGameMode('single'));
        multiPlayerBtn.addEventListener('click', () => this.selectGameMode('multi'));
        
        // Difficulty selection handlers
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDifficulty(e.target.dataset.difficulty, e));
        });
        
        // Username input handlers
        usernameInput.addEventListener('input', (e) => {
            const username = e.target.value.trim();
            startButton.disabled = username.length < 2;
            if (username.length >= 2) {
                this.username = username;
            }
        });
        
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !startButton.disabled) {
                this.startGame();
            }
        });
        
        // Game control handlers
        startButton.addEventListener('click', () => this.startGame());
        playAgainButton.addEventListener('click', () => this.playAgain());
        backToMenuButton.addEventListener('click', () => this.backToMenu());
        
        // Responsive design handler
        window.addEventListener('resize', () => this.resizeCanvases());
    }
    
    /**
     * Handle game mode selection with visual feedback
     */
    selectGameMode(mode) {
        this.gameMode = mode;
        
        // Update UI to show selected mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Highlight selected button
        if (mode === 'single') {
            document.getElementById('singlePlayerBtn').classList.add('selected');
        } else {
            document.getElementById('multiPlayerBtn').classList.add('selected');
        }
        
        // Show difficulty selection
        document.getElementById('difficultyPanel').classList.remove('hidden');
        
        // Configure UI based on mode
        if (mode === 'single') {
            // Single player: need username after difficulty selection
            document.getElementById('usernameInput').classList.add('hidden');
            document.getElementById('startButton').classList.add('hidden');
        } else {
            // Multiplayer: no username needed
            document.getElementById('usernameInput').classList.add('hidden');
            document.getElementById('startButton').classList.add('hidden');
        }
    }
    
    /**
     * Handle difficulty selection with visual feedback
     */
    selectDifficulty(difficulty, event) {
        this.difficulty = difficulty;
        
        // Update UI to show selected difficulty
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.target.classList.add('selected');
        
        if (this.gameMode === 'single') {
            // Single player: show username input and start button
            document.getElementById('usernameInput').classList.remove('hidden');
            document.getElementById('startButton').classList.remove('hidden');
            document.getElementById('startButton').disabled = !this.username || this.username.length < 2;
            
            // Focus on username input for better UX
            setTimeout(() => {
                document.getElementById('usernameInput').focus();
            }, 100);
        } else {
            // Multiplayer: show start button immediately
            document.getElementById('startButton').classList.remove('hidden');
            document.getElementById('startButton').disabled = false;
        }
    }
    
    /**
     * Start a new game with reset state
     */
    startGame() {
        // Initialize game state
        this.gameActive = true;
        this.hands = [];
        this.score = { player1: 0, player2: 0 };
        this.gameStartTime = Date.now();
        this.gameDuration = 0;
        
        // Update UI
        document.getElementById('infoPanel').classList.add('hidden');
        document.getElementById('timer').classList.remove('hidden');
        
        // Reset game objects
        this.resetBall();
        this.resetPaddles();
        
        // Start game timer
        this.timerInterval = setInterval(() => {
            if (this.gameActive) {
                this.gameDuration = Date.now() - this.gameStartTime;
                this.updateTimer();
            }
        }, 100);
    }
    
    /**
     * Update the game timer display
     */
    updateTimer() {
        const seconds = Math.floor(this.gameDuration / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const timerText = 'Timer: ' + minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
        document.getElementById('timer').textContent = timerText;
    }
    
    /**
     * Stop the game timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    /**
     * Reset ball to center with random initial velocity
     */
    resetBall() {
        // Center position
        this.ball.x = this.gameCanvas.width / 2;
        this.ball.y = this.gameCanvas.height / 2;
        
        // Initialize rendering positions
        this.ball.renderX = this.ball.x;
        this.ball.renderY = this.ball.y;
        this.ball.prevX = this.ball.x;
        this.ball.prevY = this.ball.y;
        
        // Random initial velocity (rebalanced speeds)
        this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * (800 + Math.random() * 400);
        this.ball.vy = (Math.random() - 0.5) * 800;
        
        // Rebalanced difficulty multipliers
        const speedMultiplier = this.difficulty === 'easy' ? 0.55 :    // Much slower (was too fast)
                               this.difficulty === 'hard' ? 1.0 :     // Current normal speed
                               0.75;                                   // Current easy speed (new normal)
        this.ball.vx *= speedMultiplier;
        this.ball.vy *= speedMultiplier;
        
        // Initialize movement history for smooth rendering
        this.ball.history = [
            { x: this.ball.x, y: this.ball.y },
            { x: this.ball.x, y: this.ball.y },
            { x: this.ball.x, y: this.ball.y },
            { x: this.ball.x, y: this.ball.y }
        ];
    }
    
    /**
     * Reset paddles to center positions
     */
    resetPaddles() {
        // Left paddle (Player 1)
        this.paddle1.x = 50;
        this.paddle1.y = this.gameCanvas.height / 2 - this.paddle1.height / 2;
        this.paddle1.vy = 0;
        
        // Right paddle (Player 2/AI)
        this.paddle2.x = this.gameCanvas.width - 50 - this.paddle2.width;
        this.paddle2.y = this.gameCanvas.height / 2 - this.paddle2.height / 2;
        this.paddle2.vy = 0;
    }
    
    /**
     * Detect hands using MediaPipe with error handling
     */
    detectHands() {
        if (!this.handLandmarker || !this.video) return;
        
        let startTimeMs = performance.now();
        if (this.lastVideoTime !== this.video.currentTime) {
            this.lastVideoTime = this.video.currentTime;
            try {
                const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
                this.processHandResults(results);
            } catch (error) {
                console.error('Hand detection error:', error);
            }
        }
    }
    
    /**
     * Process hand detection results and update game state
     */
    processHandResults(results) {
        this.hands = [];
        if (results.landmarks) {
            results.landmarks.forEach((landmarks, index) => {
                // Get palm center for paddle control
                const palmCenter = landmarks[9]; // Landmark 9 is the middle finger MCP joint
                const handX = palmCenter.x * this.gameCanvas.width;
                const handY = palmCenter.y * this.gameCanvas.height;
                
                // Determine handedness (mirrored for natural control)
                let handedness = 'Unknown';
                if (results.handednesses && results.handednesses[index]) {
                    const detectedHand = results.handednesses[index][0].categoryName;
                    handedness = detectedHand === 'Left' ? 'Right' : 'Left'; // Mirror for natural control
                }
                
                const hand = {
                    id: index,
                    x: handX,
                    y: handY,
                    landmarks: landmarks,
                    handedness: handedness,
                    originalHandedness: results.handednesses[index] ? results.handednesses[index][0].categoryName : 'Unknown'
                };
                
                this.hands.push(hand);
            });
        }
        
        // Filter hands based on game mode
        if (this.gameMode === 'single') {
            // Single player: only use first detected hand
            this.hands = this.hands.slice(0, 1);
        } else if (this.gameMode === 'multi') {
            // Multiplayer: use up to 2 hands
            this.hands = this.hands.slice(0, 2);
        }
        
        if (this.gameActive) {
            this.updatePaddlesFromHands();
        }
    }
    
    /**
     * Update paddle positions based on detected hands
     */
    updatePaddlesFromHands() {
        if (this.hands.length > 0) {
            // Player 1 (left paddle) - first detected hand
            const hand1 = this.hands[0];
            const targetY = Math.max(0, Math.min(
                this.gameCanvas.height - this.paddle1.height,
                hand1.y - this.paddle1.height / 2
            ));
            
            // Smooth paddle movement
            this.paddle1.y += (targetY - this.paddle1.y) * 0.3;
            this.paddle1.vy = targetY - this.paddle1.y; // Store velocity for physics
        }
        
        if (this.gameMode === 'multi' && this.hands.length > 1) {
            // Player 2 (right paddle) - second detected hand
            const hand2 = this.hands[1];
            const targetY = Math.max(0, Math.min(
                this.gameCanvas.height - this.paddle2.height,
                hand2.y - this.paddle2.height / 2
            ));
            
            // Smooth paddle movement
            this.paddle2.y += (targetY - this.paddle2.y) * 0.3;
            this.paddle2.vy = targetY - this.paddle2.y; // Store velocity for physics
        }
    }
    
    /**
     * Update ball physics using fixed timestep with smooth interpolation
     * This is the core algorithm for smooth movement
     */
    updateBallPhysics(deltaTime) {
        // Store previous position for interpolation
        this.ball.prevX = this.ball.x;
        this.ball.prevY = this.ball.y;
        
        // Update position using velocity
        this.ball.x += this.ball.vx * deltaTime;
        this.ball.y += this.ball.vy * deltaTime;
        
        // Wall collision detection with NO energy loss - keep it fast!
        if (this.ball.y <= this.ball.radius) {
            this.ball.y = this.ball.radius;
            this.ball.vy = Math.abs(this.ball.vy); // Perfect bounce, no dampening
            this.ball.vy += (Math.random() - 0.5) * 50; // Small random variation
        } else if (this.ball.y >= this.gameCanvas.height - this.ball.radius) {
            this.ball.y = this.gameCanvas.height - this.ball.radius;
            this.ball.vy = -Math.abs(this.ball.vy); // Perfect bounce, no dampening
            this.ball.vy += (Math.random() - 0.5) * 50; // Small random variation
        }
        
        // Paddle collisions with advanced physics
        this.checkPaddleCollisionsSmooth();
        
        // AI opponent for single player mode
        if (this.gameMode === 'single') {
            this.updateAI();
        }
        
        // Speed limiting for stability
        this.limitBallSpeed();
        
        // Update movement history for smooth rendering
        this.updateBallHistory();
    }
    
    /**
     * Advanced paddle collision detection with smooth response
     */
    checkPaddleCollisionsSmooth() {
        // First check for direct hand collisions (more intuitive)
        if (this.checkHandCollisions()) {
            return; // Hand collision handled, skip paddle collision
        }
        
        // Left paddle collision
        if (this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width &&
            this.ball.y >= this.paddle1.y && this.ball.y <= this.paddle1.y + this.paddle1.height &&
            this.ball.vx < 0) {
            
            // Correct position to prevent ball from sticking
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
            
            // Calculate hit position for spin effect (0 = top, 1 = bottom)
            const hitPos = (this.ball.y - this.paddle1.y) / this.paddle1.height;
            const centerHit = hitPos - 0.5; // Convert to -0.5 to 0.5 range
            
            // SPEED BOOST on paddle hit - no dampening!
            this.ball.vx = Math.abs(this.ball.vx) * 1.1; // Speed increase
            this.ball.vy = this.ball.vy + centerHit * 600 + this.paddle1.vy * 0.5; // Strong spin effect
            
            // Add slight randomness to prevent repetitive patterns
            this.ball.vx += (Math.random() - 0.5) * 50;
            this.ball.vy += (Math.random() - 0.5) * 100;
        }
        
        // Right paddle collision (similar logic)
        if (this.ball.x + this.ball.radius >= this.paddle2.x &&
            this.ball.y >= this.paddle2.y && this.ball.y <= this.paddle2.y + this.paddle2.height &&
            this.ball.vx > 0) {
            
            // Correct position to prevent ball from sticking
            this.ball.x = this.paddle2.x - this.ball.radius;
            
            // Calculate hit position for spin effect
            const hitPos = (this.ball.y - this.paddle2.y) / this.paddle2.height;
            const centerHit = hitPos - 0.5;
            
            // SPEED BOOST on paddle hit - no dampening!
            this.ball.vx = -Math.abs(this.ball.vx) * 1.1; // Speed increase
            this.ball.vy = this.ball.vy + centerHit * 600 + this.paddle2.vy * 0.5; // Strong spin effect
            
            // Add slight randomness
            this.ball.vx += (Math.random() - 0.5) * 50;
            this.ball.vy += (Math.random() - 0.5) * 100;
        }
    }
    
    /**
     * Check for direct hand-ball collisions for more intuitive gameplay
     */
    checkHandCollisions() {
        if (!this.hands || this.hands.length === 0) return false;
        
        // Define hand hit radius (larger for more consistent detection)
        const handHitRadius = 80; // Increased from 60 for better consistency
        
        // Check each detected hand
        for (let i = 0; i < this.hands.length; i++) {
            const hand = this.hands[i];
            const handX = hand.x;
            const handY = hand.y;
            
            // Calculate distance between hand and ball
            const distance = Math.sqrt(
                (handX - this.ball.x) * (handX - this.ball.x) + 
                (handY - this.ball.y) * (handY - this.ball.y)
            );
            
            // Check if hand is close enough to ball
            if (distance <= handHitRadius) {
                // Determine which side the hand is on
                const isLeftSide = handX < this.gameCanvas.width / 2;
                const isRightSide = handX > this.gameCanvas.width / 2;
                
                // More lenient ball direction checking for better consistency
                const ballMovingLeft = this.ball.vx < 0;
                const ballMovingRight = this.ball.vx > 0;
                
                // Single player mode: only left side (player) hand collisions
                if (this.gameMode === 'single') {
                    if (isLeftSide && (ballMovingLeft || Math.abs(this.ball.vx) < 100)) {
                        this.handleHandHit(hand, 'left');
                        return true;
                    }
                }
                // Multiplayer mode: both sides with more lenient detection
                else if (this.gameMode === 'multi') {
                    if (isLeftSide && (ballMovingLeft || Math.abs(this.ball.vx) < 100)) {
                        this.handleHandHit(hand, 'left');
                        return true;
                    } else if (isRightSide && (ballMovingRight || Math.abs(this.ball.vx) < 100)) {
                        this.handleHandHit(hand, 'right');
                        return true;
                    }
                }
            }
        }
        
        return false; // No hand collision detected
    }
    
    /**
     * Handle physics when ball hits a hand directly
     */
    handleHandHit(hand, side) {
        const handX = hand.x;
        const handY = hand.y;
        
        // Calculate hit angle based on hand position relative to ball
        const deltaX = this.ball.x - handX;
        const deltaY = this.ball.y - handY;
        const angle = Math.atan2(deltaY, deltaX);
        
        // Calculate new velocity based on hit angle and add speed boost
        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy) * 1.15; // Speed boost
        
        if (side === 'left') {
            // Left hand hit - send ball to the right
            this.ball.vx = Math.abs(Math.cos(angle) * speed);
            this.ball.vy = Math.sin(angle) * speed;
            
            // Position correction to prevent multiple hits
            this.ball.x = handX + 80; // Move ball away from hand
        } else {
            // Right hand hit - send ball to the left  
            this.ball.vx = -Math.abs(Math.cos(angle) * speed);
            this.ball.vy = Math.sin(angle) * speed;
            
            // Position correction to prevent multiple hits
            this.ball.x = handX - 80; // Move ball away from hand
        }
        
        // Add some randomness for natural feel
        this.ball.vx += (Math.random() - 0.5) * 100;
        this.ball.vy += (Math.random() - 0.5) * 150;
        
        // Visual feedback
        console.log('Hand hit detected on ' + side + ' side!');
    }
    
    /**
     * Limit ball speed for gameplay stability
     */
    limitBallSpeed() {
        const maxSpeed = 1400; // Reduced max speed for better balance (23 pixels/frame at 60fps)
        const minSpeed = 300; // Adjusted minimum speed (5 pixels/frame at 60fps)
        const currentSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        
        if (currentSpeed > maxSpeed) {
            // Scale down to max speed
            this.ball.vx = (this.ball.vx / currentSpeed) * maxSpeed;
            this.ball.vy = (this.ball.vy / currentSpeed) * maxSpeed;
        } else if (currentSpeed < minSpeed && currentSpeed > 0) {
            // Scale up to min speed
            this.ball.vx = (this.ball.vx / currentSpeed) * minSpeed;
            this.ball.vy = (this.ball.vy / currentSpeed) * minSpeed;
        }
    }
    
    /**
     * Update ball movement history for smooth rendering
     */
    updateBallHistory() {
        if (!this.ball.history) {
            this.ball.history = [];
        }
        
        // Add current position to history
        this.ball.history.push({ x: this.ball.x, y: this.ball.y });
        
        // Keep only last 4 positions for cubic interpolation
        if (this.ball.history.length > 4) {
            this.ball.history.shift();
        }
    }
    
    /**
     * AI opponent logic with difficulty-based behavior
     */
    updateAI() {
        const ballCenterY = this.ball.y;
        const paddleCenterY = this.paddle2.y + this.paddle2.height / 2;
        const diff = ballCenterY - paddleCenterY;
        
        // Rebalanced AI speed to match new difficulty levels
        let aiSpeed = this.difficulty === 'easy' ? 400 :     // Slower for easier ball
                     this.difficulty === 'hard' ? 800 :      // Fast for hard ball  
                     600;                                     // Balanced for normal ball
        
        // AI reaction time based on difficulty
        const reactionDelay = this.difficulty === 'easy' ? 0.4 :     // More reaction time for easy
                             this.difficulty === 'hard' ? 0.08 :    // Quick reactions for hard
                             0.2;                                    // Balanced for normal
        
        // Only move AI paddle if ball is coming towards it and within reaction distance
        if (this.ball.vx > 0 && Math.abs(this.ball.x - this.paddle2.x) < this.gameCanvas.width * reactionDelay) {
            if (Math.abs(diff) > 15) {
                // Calculate target position and move towards it smoothly
                const moveDirection = Math.sign(diff);
                const moveAmount = aiSpeed * (1/60); // Convert to per-frame movement
                
                // Apply movement with bounds checking
                this.paddle2.y += moveDirection * moveAmount;
                this.paddle2.y = Math.max(0, Math.min(
                    this.gameCanvas.height - this.paddle2.height,
                    this.paddle2.y
                ));
                
                // Store velocity for collision physics
                this.paddle2.vy = moveDirection * aiSpeed;
            } else {
                // Stop moving when close to target
                this.paddle2.vy = 0;
            }
        } else {
            // Gradually return to center when not actively tracking
            const centerY = this.gameCanvas.height / 2 - this.paddle2.height / 2;
            const centerDiff = centerY - this.paddle2.y;
            if (Math.abs(centerDiff) > 5) {
                const returnSpeed = aiSpeed * 0.4; // Return to center speed
                const moveAmount = Math.sign(centerDiff) * returnSpeed * (1/60);
                this.paddle2.y += moveAmount;
                this.paddle2.vy = Math.sign(centerDiff) * returnSpeed;
            } else {
                this.paddle2.vy = 0;
            }
        }
    }
    
    /**
     * Check for scoring and handle ball reset
     */
    checkScore() {
        if (this.ball.x <= 0) {
            // Player 2/AI scores
            this.score.player2++;
            this.resetBall();
            this.checkWin();
        } else if (this.ball.x >= this.gameCanvas.width) {
            // Player 1 scores
            this.score.player1++;
            this.resetBall();
            this.checkWin();
        }
    }
    
    /**
     * Check for win condition (first to 5 points)
     */
    checkWin() {
        if (this.score.player1 >= 5 || this.score.player2 >= 5) {
            this.endGame();
        }
    }
    
    /**
     * End the game and show results
     */
    endGame() {
        this.gameActive = false;
        this.stopTimer();
        
        const winner = this.score.player1 >= 5 ? 'player1' : 'player2';
        const winnerName = winner === 'player1' ? 
            (this.gameMode === 'single' ? 'You' : 'Player 1') :
            (this.gameMode === 'single' ? 'AI' : 'Player 2');
        
        this.showCelebration(winnerName + ' Win!');
        
        // Save score for single player mode
        if (this.gameMode === 'single' && winner === 'player1') {
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
    
    /**
     * Show celebration animation
     */
    showCelebration(text) {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.textContent = text;
        document.getElementById('gameContainer').appendChild(celebration);
        setTimeout(() => celebration.remove(), 2500);
    }
    
    /**
     * Save player score to leaderboard
     */
    async saveScore() {
        if (this.gameMode !== 'single' || !this.username) return;
        
        try {
            const response = await fetch('/api/save-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.username,
                    score: this.score.player1,
                    time: Math.floor(this.gameDuration / 1000),
                    difficulty: this.difficulty
                })
            });
            if (!response.ok) {
                console.error('Failed to save score');
            }
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }
    
    /**
     * Display leaderboard with player rankings
     */
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
                    const isCurrentPlayer = entry.username === this.username && 
                                          entry.score === this.score.player1;
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'leaderboard-entry' + (isCurrentPlayer ? ' current-player' : '');
                    
                    const rank = index + 1;
                    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
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
    
    /**
     * Start a new game (play again)
     */
    playAgain() {
        document.getElementById('leaderboardPanel').classList.add('hidden');
        this.startGame();
    }
    
    /**
     * Return to main menu
     */
    backToMenu() {
        document.getElementById('leaderboardPanel').classList.add('hidden');
        document.getElementById('timer').classList.add('hidden');
        document.getElementById('infoPanel').classList.remove('hidden');
        
        // Reset form and remove all selected states
        document.getElementById('difficultyPanel').classList.add('hidden');
        document.getElementById('usernameInput').classList.add('hidden');
        document.getElementById('startButton').classList.add('hidden');
        document.getElementById('usernameInput').value = '';
        
        // Remove selected classes
        document.querySelectorAll('.mode-btn, .difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.gameMode = null;
        this.username = '';
    }
    
    /**
     * Render all game elements with smooth interpolation
     */
    render() {
        // Clear all canvases
        this.videoCtx.clearRect(0, 0, this.videoCanvas.width, this.videoCanvas.height);
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
        
        // Draw mirrored video feed
        if (this.video && this.video.videoWidth > 0 && this.video.readyState >= 2) {
            this.videoCtx.save();
            this.videoCtx.scale(-1, 1); // Mirror horizontally
            this.videoCtx.drawImage(this.video, -this.videoCanvas.width, 0, this.videoCanvas.width, this.videoCanvas.height);
            this.videoCtx.restore();
        }
        
        // Draw hand landmarks and connections
        this.renderHandLandmarks();
        
        // Draw pong game if active
        if (this.gameActive) {
            this.renderPongGame();
        }
        
        // Update UI elements
        this.updateUI();
    }
    
    /**
     * Render hand landmarks with connections
     */
    renderHandLandmarks() {
        this.hands.forEach((hand) => {
            if (hand.landmarks) {
                // Hand connection lines (skeleton)
                const HAND_CONNECTIONS = [
                    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
                    [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
                    [5, 9], [9, 10], [10, 11], [11, 12], // Middle finger
                    [9, 13], [13, 14], [14, 15], [15, 16], // Ring finger
                    [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
                    [0, 17] // Wrist to pinky base
                ];
                
                // Draw connections
                this.handCtx.strokeStyle = '#00FF00';
                this.handCtx.lineWidth = 4;
                this.handCtx.beginPath();
                HAND_CONNECTIONS.forEach(([start, end]) => {
                    const startPoint = hand.landmarks[start];
                    const endPoint = hand.landmarks[end];
                    const startX = this.handCanvas.width - (startPoint.x * this.handCanvas.width);
                    const startY = startPoint.y * this.handCanvas.height;
                    const endX = this.handCanvas.width - (endPoint.x * this.handCanvas.width);
                    const endY = endPoint.y * this.handCanvas.height;
                    this.handCtx.moveTo(startX, startY);
                    this.handCtx.lineTo(endX, endY);
                });
                this.handCtx.stroke();
                
                // Draw landmark points
                this.handCtx.fillStyle = '#FF0000';
                hand.landmarks.forEach(landmark => {
                    const x = this.handCanvas.width - (landmark.x * this.handCanvas.width);
                    const y = landmark.y * this.handCanvas.height;
                    this.handCtx.beginPath();
                    this.handCtx.arc(x, y, 6, 0, Math.PI * 2);
                    this.handCtx.fill();
                });
            }
        });
    }
    
    /**
     * Render the complete pong game with smooth effects
     */
    renderPongGame() {
        // Draw center line
        this.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.gameCtx.lineWidth = 4;
        this.gameCtx.setLineDash([20, 20]);
        this.gameCtx.beginPath();
        this.gameCtx.moveTo(this.gameCanvas.width / 2, 0);
        this.gameCtx.lineTo(this.gameCanvas.width / 2, this.gameCanvas.height);
        this.gameCtx.stroke();
        this.gameCtx.setLineDash([]);
        
        // Draw paddles with glow effects
        this.renderPaddles();
        
        // Draw ball with smooth interpolation and effects
        this.renderSmoothBall();
    }
    
    /**
     * Render paddles with visual effects
     */
    renderPaddles() {
        // Left paddle (Player 1) - Green
        this.gameCtx.fillStyle = '#4CAF50';
        this.gameCtx.shadowColor = '#4CAF50';
        this.gameCtx.shadowBlur = 10;
        this.gameCtx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        
        // Right paddle (Player 2/AI) - Blue for multiplayer, Red for AI
        this.gameCtx.fillStyle = this.gameMode === 'single' ? '#f44336' : '#2196F3';
        this.gameCtx.shadowColor = this.gameMode === 'single' ? '#f44336' : '#2196F3';
        this.gameCtx.shadowBlur = 10;
        this.gameCtx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);
        
        // Reset shadow
        this.gameCtx.shadowBlur = 0;
    }
    
    /**
     * Render ball with smooth interpolation and visual effects
     */
    renderSmoothBall() {
        // Use interpolated position for smooth rendering
        const ballX = this.ball.renderX || this.ball.x;
        const ballY = this.ball.renderY || this.ball.y;
        
        // Draw motion blur trail (adjust for per-second velocity system)
        const trailLength = 6;
        const velocityScale = 1/60; // Convert per-second velocity to per-frame for trail rendering
        for (let i = 0; i < trailLength; i++) {
            const alpha = (i + 1) / trailLength * 0.4;
            const trailX = ballX - (this.ball.vx * velocityScale * i * 0.4);
            const trailY = ballY - (this.ball.vy * velocityScale * i * 0.4);
            const trailRadius = this.ball.radius * (1 - i * 0.08);
            
            this.gameCtx.fillStyle = 'rgba(255, 215, 0, ' + alpha + ')';
            this.gameCtx.beginPath();
            this.gameCtx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
            this.gameCtx.fill();
        }
        
        // Draw main ball with glow effect
        this.gameCtx.fillStyle = '#FFD700';
        this.gameCtx.shadowColor = '#FFD700';
        this.gameCtx.shadowBlur = 15;
        this.gameCtx.beginPath();
        this.gameCtx.arc(ballX, ballY, this.ball.radius, 0, Math.PI * 2);
        this.gameCtx.fill();
        this.gameCtx.shadowBlur = 0; // Reset shadow
    }
    
    /**
     * Update UI elements (scores, etc.)
     */
    updateUI() {
        const scoresDiv = document.getElementById('scores');
        scoresDiv.innerHTML = '';
        
        if (this.gameActive) {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'player-score';
            const player1Name = this.gameMode === 'single' ? 'You' : 'Player 1';
            const player2Name = this.gameMode === 'single' ? 'AI' : 'Player 2';
            scoreDiv.innerHTML = 
                '<strong>Pong ' + player1Name + ':</strong> ' + this.score.player1 + ' | ' +
                '<strong>' + player2Name + ':</strong> ' + this.score.player2 + ' | ' +
                '<strong>First to 5 wins!</strong>';
            scoresDiv.appendChild(scoreDiv);
        }
    }
    
    /**
     * Main game loop using fixed timestep with interpolation
     * This ensures smooth, consistent gameplay across all devices and frame rates
     */
    gameLoop(currentTime = 0) {
        // Calculate delta time since last frame
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Prevent spiral of death by capping large delta times
        if (deltaTime > this.maxDeltaTime) {
            this.accumulator = this.fixedTimeStep;
        } else {
            this.accumulator += deltaTime;
        }
        
        // Fixed timestep physics updates (60 FPS)
        while (this.accumulator >= this.fixedTimeStep) {
            // Store previous position for interpolation
            this.ball.prevX = this.ball.x;
            this.ball.prevY = this.ball.y;
            
            // Update game logic at fixed timestep
            this.detectHands();
            if (this.gameActive) {
                this.updateBallPhysics(this.fixedTimeStep / 1000); // Convert to seconds
                this.checkScore();
            }
            
            this.accumulator -= this.fixedTimeStep;
        }
        
        // Linear interpolation for smooth rendering between physics updates
        if (this.gameActive) {
            const interpolation = this.accumulator / this.fixedTimeStep;
            this.ball.renderX = this.ball.prevX + (this.ball.x - this.ball.prevX) * interpolation;
            this.ball.renderY = this.ball.prevY + (this.ball.y - this.ball.prevY) * interpolation;
        }
        
        // Render everything
        this.render();
        
        // Continue the game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new HandPongGame();
});
`;