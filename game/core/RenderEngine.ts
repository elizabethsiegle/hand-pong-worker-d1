export const RENDER_ENGINE = `
class RenderEngine {
    constructor(game) {
        this.game = game;
    }
    
    render() {
        this.clearCanvases();
        this.renderVideo();
        this.renderHandLandmarks();
        
        if (this.game.gameActive) {
            this.renderPongGame();
        }
        
        this.game.ui.updateUI();
    }
    
    clearCanvases() {
        this.game.videoCtx.clearRect(0, 0, this.game.videoCanvas.width, this.game.videoCanvas.height);
        this.game.gameCtx.clearRect(0, 0, this.game.gameCanvas.width, this.game.gameCanvas.height);
        this.game.handCtx.clearRect(0, 0, this.game.handCanvas.width, this.game.handCanvas.height);
    }
    
    renderVideo() {
        if (this.game.handDetection.video && this.game.handDetection.video.videoWidth > 0 && this.game.handDetection.video.readyState >= 2) {
            this.game.videoCtx.save();
            this.game.videoCtx.scale(-1, 1);
            this.game.videoCtx.drawImage(this.game.handDetection.video, -this.game.videoCanvas.width, 0, this.game.videoCanvas.width, this.game.videoCanvas.height);
            this.game.videoCtx.restore();
        }
    }
    
    renderHandLandmarks() {
        if (!this.game.hands) return;
        
        this.game.hands.forEach((hand) => {
            if (hand.landmarks) {
                const HAND_CONNECTIONS = [
                    [0, 1], [1, 2], [2, 3], [3, 4],
                    [0, 5], [5, 6], [6, 7], [7, 8],
                    [5, 9], [9, 10], [10, 11], [11, 12],
                    [9, 13], [13, 14], [14, 15], [15, 16],
                    [13, 17], [17, 18], [18, 19], [19, 20],
                    [0, 17]
                ];
                
                this.game.handCtx.strokeStyle = '#00FF00';
                this.game.handCtx.lineWidth = 4;
                this.game.handCtx.beginPath();
                HAND_CONNECTIONS.forEach(([start, end]) => {
                    const startPoint = hand.landmarks[start];
                    const endPoint = hand.landmarks[end];
                    const startX = this.game.handCanvas.width - (startPoint.x * this.game.handCanvas.width);
                    const startY = startPoint.y * this.game.handCanvas.height;
                    const endX = this.game.handCanvas.width - (endPoint.x * this.game.handCanvas.width);
                    const endY = endPoint.y * this.game.handCanvas.height;
                    this.game.handCtx.moveTo(startX, startY);
                    this.game.handCtx.lineTo(endX, endY);
                });
                this.game.handCtx.stroke();
                
                this.game.handCtx.fillStyle = '#FF0000';
                hand.landmarks.forEach(landmark => {
                    const x = this.game.handCanvas.width - (landmark.x * this.game.handCanvas.width);
                    const y = landmark.y * this.game.handCanvas.height;
                    this.game.handCtx.beginPath();
                    this.game.handCtx.arc(x, y, 6, 0, Math.PI * 2);
                    this.game.handCtx.fill();
                });
            }
        });
    }
    
    renderPongGame() {
        this.renderCenterLine();
        this.renderPaddles();
        this.renderSmoothBall();
    }
    
    renderCenterLine() {
        this.game.gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.game.gameCtx.lineWidth = 4;
        this.game.gameCtx.setLineDash([20, 20]);
        this.game.gameCtx.beginPath();
        this.game.gameCtx.moveTo(this.game.gameCanvas.width / 2, 0);
        this.game.gameCtx.lineTo(this.game.gameCanvas.width / 2, this.game.gameCanvas.height);
        this.game.gameCtx.stroke();
        this.game.gameCtx.setLineDash([]);
    }
    
    renderPaddles() {
        this.game.gameCtx.fillStyle = '#4CAF50';
        this.game.gameCtx.shadowColor = '#4CAF50';
        this.game.gameCtx.shadowBlur = 10;
        this.game.gameCtx.fillRect(this.game.paddle1.x, this.game.paddle1.y, this.game.paddle1.width, this.game.paddle1.height);
        
        this.game.gameCtx.fillStyle = this.game.gameMode === 'single' ? '#f44336' : '#2196F3';
        this.game.gameCtx.shadowColor = this.game.gameMode === 'single' ? '#f44336' : '#2196F3';
        this.game.gameCtx.shadowBlur = 10;
        this.game.gameCtx.fillRect(this.game.paddle2.x, this.game.paddle2.y, this.game.paddle2.width, this.game.paddle2.height);
        
        this.game.gameCtx.shadowBlur = 0;
    }
    
    renderSmoothBall() {
        const ballX = this.game.ball.renderX || this.game.ball.x;
        const ballY = this.game.ball.renderY || this.game.ball.y;
        
        const trailLength = 6;
        const velocityScale = 1/60;
        for (let i = 0; i < trailLength; i++) {
            const alpha = (i + 1) / trailLength * 0.4;
            const trailX = ballX - (this.game.ball.vx * velocityScale * i * 0.4);
            const trailY = ballY - (this.game.ball.vy * velocityScale * i * 0.4);
            const trailRadius = this.game.ball.radius * (1 - i * 0.08);
            
            this.game.gameCtx.fillStyle = 'rgba(255, 215, 0, ' + alpha + ')';
            this.game.gameCtx.beginPath();
            this.game.gameCtx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
            this.game.gameCtx.fill();
        }
        
        this.game.gameCtx.fillStyle = '#FFD700';
        this.game.gameCtx.shadowColor = '#FFD700';
        this.game.gameCtx.shadowBlur = 15;
        this.game.gameCtx.beginPath();
        this.game.gameCtx.arc(ballX, ballY, this.game.ball.radius, 0, Math.PI * 2);
        this.game.gameCtx.fill();
        this.game.gameCtx.shadowBlur = 0;
    }
}
`;