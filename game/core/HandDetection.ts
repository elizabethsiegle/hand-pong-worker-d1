export const HAND_DETECTION = `
class HandDetection {
    constructor(game) {
        this.game = game;
        this.video = null;
        this.handLandmarker = null;
        this.hands = [];
        this.runningMode = "VIDEO";
        this.lastVideoTime = -1;
    }
    
    async initialize() {
        await this.setupCamera();
        await this.initializeHandDetection();
    }
    
    async setupCamera() {
        const statusEl = document.getElementById('cameraStatus');
        try {
            statusEl.textContent = 'Camera: Requesting access...';
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
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
            statusEl.textContent = 'Camera: Access denied';
        }
    }
    
    async initializeHandDetection() {
        const statusEl = document.getElementById('handStatus');
        const loadingEl = document.getElementById('loadingStatus');
        try {
            statusEl.textContent = 'Hands: Loading MediaPipe...';
            loadingEl.textContent = 'Loading Hand Landmarker...';
            
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: this.runningMode,
                numHands: 2
            });
            
            statusEl.textContent = 'Hands: AI Ready!';
            loadingEl.textContent = 'MediaPipe Loaded!';
            setTimeout(() => loadingEl.style.display = 'none', 2000);
        } catch (error) {
            console.error('Hand detection initialization failed:', error);
            statusEl.textContent = 'Hands: Failed to load';
            loadingEl.textContent = 'MediaPipe Failed';
        }
    }
    
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
    
    processHandResults(results) {
        this.hands = [];
        if (results.landmarks) {
            results.landmarks.forEach((landmarks, index) => {
                const palmCenter = landmarks[9];
                const handX = palmCenter.x * this.game.gameCanvas.width;
                const handY = palmCenter.y * this.game.gameCanvas.height;
                
                let handedness = 'Unknown';
                if (results.handednesses && results.handednesses[index]) {
                    const detectedHand = results.handednesses[index][0].categoryName;
                    handedness = detectedHand === 'Left' ? 'Right' : 'Left';
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
        
        if (this.game.gameMode === 'single') {
            this.hands = this.hands.slice(0, 1);
        } else if (this.game.gameMode === 'multi') {
            this.hands = this.hands.slice(0, 2);
        }
        
        if (this.game.gameActive) {
            this.updatePaddlesFromHands();
        }
        
        this.game.hands = this.hands;
    }
    
    updatePaddlesFromHands() {
        if (this.hands.length > 0) {
            const hand1 = this.hands[0];
            const targetY = Math.max(0, Math.min(
                this.game.gameCanvas.height - this.game.paddle1.height,
                hand1.y - this.game.paddle1.height / 2
            ));
            
            this.game.paddle1.y += (targetY - this.game.paddle1.y) * 0.3;
            this.game.paddle1.vy = targetY - this.game.paddle1.y;
        }
        
        if (this.game.gameMode === 'multi' && this.hands.length > 1) {
            const hand2 = this.hands[1];
            const targetY = Math.max(0, Math.min(
                this.game.gameCanvas.height - this.game.paddle2.height,
                hand2.y - this.game.paddle2.height / 2
            ));
            
            this.game.paddle2.y += (targetY - this.game.paddle2.y) * 0.3;
            this.game.paddle2.vy = targetY - this.game.paddle2.y;
        }
    }
}
`;