export const PHYSICS_ENGINE = `
class PhysicsEngine {
    constructor(game) {
        this.game = game;
    }
    
    resetBall() {
        const g = this.game;
        g.ball.x = g.ball.renderX = g.ball.prevX = g.gameCanvas.width / 2;
        g.ball.y = g.ball.renderY = g.ball.prevY = g.gameCanvas.height / 2;
        
        const speed = (800 + Math.random() * 400) * (g.difficulty === 'easy' ? 0.55 : g.difficulty === 'hard' ? 1.0 : 0.75);
        g.ball.vx = (Math.random() > 0.5 ? 1 : -1) * speed;
        g.ball.vy = (Math.random() - 0.5) * 800 * (g.difficulty === 'easy' ? 0.55 : g.difficulty === 'hard' ? 1.0 : 0.75);
        
        g.lastHitter = null;
        g.ball.history = Array(4).fill({ x: g.ball.x, y: g.ball.y });
    }
    
    resetPaddles() {
        const g = this.game;
        g.paddle1.x = 50;
        g.paddle1.y = g.gameCanvas.height / 2 - g.paddle1.height / 2;
        g.paddle1.vy = 0;
        g.paddle2.x = g.gameCanvas.width - 50 - g.paddle2.width;
        g.paddle2.y = g.gameCanvas.height / 2 - g.paddle2.height / 2;
        g.paddle2.vy = 0;
    }
    
    updateBallPhysics(deltaTime) {
        const g = this.game, b = g.ball;
        b.prevX = b.x;
        b.prevY = b.y;
        b.x += b.vx * deltaTime;
        b.y += b.vy * deltaTime;
        
        if (b.y <= b.radius) {
            b.y = b.radius;
            b.vy = Math.abs(b.vy) + (Math.random() - 0.5) * 50;
        } else if (b.y >= g.gameCanvas.height - b.radius) {
            b.y = g.gameCanvas.height - b.radius;
            b.vy = -Math.abs(b.vy) + (Math.random() - 0.5) * 50;
        }
        
        this.checkPaddleCollisions();
        if (g.gameMode === 'single') g.ai.update();
        this.limitBallSpeed();
        this.updateBallHistory();
    }
    
    checkPaddleCollisions() {
        if (this.checkHandCollisions()) return;
        
        const g = this.game, b = g.ball, p1 = g.paddle1, p2 = g.paddle2;
        
        // Left paddle
        if (b.x - b.radius <= p1.x + p1.width && b.y >= p1.y && b.y <= p1.y + p1.height && b.vx < 0 && g.lastHitter !== 'paddle1') {
            b.x = p1.x + p1.width + b.radius;
            const centerHit = (b.y - p1.y) / p1.height - 0.5;
            b.vx = Math.abs(b.vx) * 1.1 + (Math.random() - 0.5) * 50;
            b.vy = b.vy + centerHit * 600 + p1.vy * 0.5 + (Math.random() - 0.5) * 100;
            g.lastHitter = 'paddle1';
        }
        
        // Right paddle
        if (b.x + b.radius >= p2.x && b.y >= p2.y && b.y <= p2.y + p2.height && b.vx > 0 && g.lastHitter !== 'paddle2') {
            b.x = p2.x - b.radius;
            const centerHit = (b.y - p2.y) / p2.height - 0.5;
            b.vx = -Math.abs(b.vx) * 1.1 + (Math.random() - 0.5) * 50;
            b.vy = b.vy + centerHit * 600 + p2.vy * 0.5 + (Math.random() - 0.5) * 100;
            g.lastHitter = 'paddle2';
        }
    }
    
    checkHandCollisions() {
        if (!this.game.hands?.length) return false;
        
        for (const hand of this.game.hands) {
            if (!hand.landmarks) continue;
            
            const palmLandmarks = [hand.landmarks[0], hand.landmarks[5], hand.landmarks[9], hand.landmarks[13], hand.landmarks[17]];
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            
            palmLandmarks.forEach(landmark => {
                const x = (1 - landmark.x) * this.game.gameCanvas.width;
                const y = landmark.y * this.game.gameCanvas.height;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            });
            
            const handCenterX = (minX + maxX) / 2;
            const isLeftSide = handCenterX < this.game.gameCanvas.width / 2;
            const isRightSide = !isLeftSide;
            
            let paddle = null;
            if (this.game.gameMode === 'single' && isLeftSide) paddle = this.game.paddle1;
            else if (this.game.gameMode === 'multi') paddle = isLeftSide ? this.game.paddle1 : isRightSide ? this.game.paddle2 : null;
            
            if (!paddle) continue;
            
            const palmCenterX = handCenterX, palmCenterY = (minY + maxY) / 2;
            const collisionWidth = paddle.width + 30, collisionHeight = paddle.height + 20;
            const ballInCollision = this.game.ball.x + this.game.ball.radius >= palmCenterX - collisionWidth/2 && 
                                   this.game.ball.x - this.game.ball.radius <= palmCenterX + collisionWidth/2 && 
                                   this.game.ball.y + this.game.ball.radius >= palmCenterY - collisionHeight/2 && 
                                   this.game.ball.y - this.game.ball.radius <= palmCenterY + collisionHeight/2;
            
            if (ballInCollision) {
                const handId = isLeftSide ? 'leftHand' : 'rightHand';
                const ballMovingToward = (isLeftSide && this.game.ball.vx < 0) || (isRightSide && this.game.ball.vx > 0) || Math.abs(this.game.ball.vx) < 200;
                
                if (ballMovingToward && this.game.lastHitter !== handId) {
                    this.handleHandHit(hand, isLeftSide ? 'left' : 'right', palmCenterX, palmCenterY, handId);
                    return true;
                }
            }
        }
        return false;
    }
    
    handleHandHit(hand, side, handCenterX, handCenterY, handId) {
        const deltaX = this.game.ball.x - handCenterX, deltaY = this.game.ball.y - handCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const speed = Math.sqrt(this.game.ball.vx * this.game.ball.vx + this.game.ball.vy * this.game.ball.vy) * 1.15;
        
        if (side === 'left') {
            this.game.ball.vx = Math.abs(Math.cos(angle) * speed);
            this.game.ball.x = handCenterX + 60;
        } else {
            this.game.ball.vx = -Math.abs(Math.cos(angle) * speed);
            this.game.ball.x = handCenterX - 60;
        }
        
        this.game.ball.vy = Math.sin(angle) * speed;
        this.game.ball.vx += (Math.random() - 0.5) * 100;
        this.game.ball.vy += (Math.random() - 0.5) * 150;
        this.game.lastHitter = handId;
    }
    
    limitBallSpeed() {
        const currentSpeed = Math.sqrt(this.game.ball.vx * this.game.ball.vx + this.game.ball.vy * this.game.ball.vy);
        if (currentSpeed > 1400) {
            this.game.ball.vx = (this.game.ball.vx / currentSpeed) * 1400;
            this.game.ball.vy = (this.game.ball.vy / currentSpeed) * 1400;
        } else if (currentSpeed < 300 && currentSpeed > 0) {
            this.game.ball.vx = (this.game.ball.vx / currentSpeed) * 300;
            this.game.ball.vy = (this.game.ball.vy / currentSpeed) * 300;
        }
    }
    
    updateBallHistory() {
        this.game.ball.history = this.game.ball.history || [];
        this.game.ball.history.push({ x: this.game.ball.x, y: this.game.ball.y });
        if (this.game.ball.history.length > 4) this.game.ball.history.shift();
    }
    
    checkScore() {
        if (this.game.ball.x <= 0) {
            this.game.score.player2++;
            this.resetBall();
            this.checkWin();
        } else if (this.game.ball.x >= this.game.gameCanvas.width) {
            this.game.score.player1++;
            this.resetBall();
            this.checkWin();
        }
    }
    
    checkWin() {
        if (this.game.score.player1 >= 5 || this.game.score.player2 >= 5) {
            this.game.ui.endGame();
        }
    }
}
`;