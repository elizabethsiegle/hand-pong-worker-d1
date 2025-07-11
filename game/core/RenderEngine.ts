export const RENDER_ENGINE = `
class RenderEngine {
    constructor(game) {
        this.game = game;
    }
    
    render() {
        this.clearCanvases();
        this.renderVideo();
        this.renderHandLandmarks();
        if (this.game.gameActive) this.renderPongGame();
        this.game.ui.updateUI();
    }
    
    clearCanvases() {
        [this.game.videoCtx, this.game.gameCtx, this.game.handCtx].forEach((ctx, i) => {
            const canvas = [this.game.videoCanvas, this.game.gameCanvas, this.game.handCanvas][i];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }
    
    renderVideo() {
        const video = this.game.handDetection.video;
        if (video?.videoWidth > 0 && video.readyState >= 2) {
            this.game.videoCtx.save();
            this.game.videoCtx.scale(-1, 1);
            this.game.videoCtx.drawImage(video, -this.game.videoCanvas.width, 0, this.game.videoCanvas.width, this.game.videoCanvas.height);
            this.game.videoCtx.restore();
        }
    }
    
    renderHandLandmarks() {
        if (!this.game.hands) return;
        
        const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
        
        this.game.hands.forEach((hand) => {
            if (!hand.landmarks) return;
            
            this.game.handCtx.strokeStyle = '#00FF00';
            this.game.handCtx.lineWidth = 4;
            this.game.handCtx.beginPath();
            
            connections.forEach(([start, end]) => {
                const startPoint = hand.landmarks[start], endPoint = hand.landmarks[end];
                const startX = (1 - startPoint.x) * this.game.handCanvas.width;
                const startY = startPoint.y * this.game.handCanvas.height;
                const endX = (1 - endPoint.x) * this.game.handCanvas.width;
                const endY = endPoint.y * this.game.handCanvas.height;
                this.game.handCtx.moveTo(startX, startY);
                this.game.handCtx.lineTo(endX, endY);
            });
            this.game.handCtx.stroke();
            
            this.game.handCtx.fillStyle = '#FF0000';
            hand.landmarks.forEach(landmark => {
                const x = (1 - landmark.x) * this.game.handCanvas.width;
                const y = landmark.y * this.game.handCanvas.height;
                this.game.handCtx.beginPath();
                this.game.handCtx.arc(x, y, 6, 0, Math.PI * 2);
                this.game.handCtx.fill();
            });
        });
    }
    
    renderPongGame() {
        this.renderCenterLine();
        this.renderPaddles();
        this.renderSmoothBall();
    }
    
    renderCenterLine() {
        const ctx = this.game.gameCtx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(this.game.gameCanvas.width / 2, 0);
        ctx.lineTo(this.game.gameCanvas.width / 2, this.game.gameCanvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    renderPaddles() {
        const ctx = this.game.gameCtx;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = ctx.shadowColor = '#4CAF50';
        ctx.fillRect(this.game.paddle1.x, this.game.paddle1.y, this.game.paddle1.width, this.game.paddle1.height);
        
        const color = this.game.gameMode === 'single' ? '#f44336' : '#2196F3';
        ctx.fillStyle = ctx.shadowColor = color;
        ctx.fillRect(this.game.paddle2.x, this.game.paddle2.y, this.game.paddle2.width, this.game.paddle2.height);
        
        ctx.shadowBlur = 0;
    }
    
    renderSmoothBall() {
        const ballX = this.game.ball.renderX || this.game.ball.x;
        const ballY = this.game.ball.renderY || this.game.ball.y;
        const ctx = this.game.gameCtx;
        
        // Trail
        for (let i = 0; i < 6; i++) {
            const alpha = (i + 1) / 6 * 0.4;
            const trailX = ballX - (this.game.ball.vx / 60 * i * 0.4);
            const trailY = ballY - (this.game.ball.vy / 60 * i * 0.4);
            const trailRadius = this.game.ball.radius * (1 - i * 0.08);
            
            ctx.fillStyle = \`rgba(255, 215, 0, \${alpha})\`;
            ctx.beginPath();
            ctx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Main ball
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ballX, ballY, this.game.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
`;