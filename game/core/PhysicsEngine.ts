export const PHYSICS_ENGINE = `
class PhysicsEngine {
    constructor(game) {
        this.game = game;
    }
    
    resetBall() {
        this.game.ball.x = this.game.gameCanvas.width / 2;
        this.game.ball.y = this.game.gameCanvas.height / 2;
        
        this.game.ball.renderX = this.game.ball.x;
        this.game.ball.renderY = this.game.ball.y;
        this.game.ball.prevX = this.game.ball.x;
        this.game.ball.prevY = this.game.ball.y;
        
        this.game.ball.vx = (Math.random() > 0.5 ? 1 : -1) * (800 + Math.random() * 400);
        this.game.ball.vy = (Math.random() - 0.5) * 800;
        
        const speedMultiplier = this.game.difficulty === 'easy' ? 0.55 :    
                               this.game.difficulty === 'hard' ? 1.0 :     
                               0.75;                                   
        this.game.ball.vx *= speedMultiplier;
        this.game.ball.vy *= speedMultiplier;
        
        this.game.ball.history = [
            { x: this.game.ball.x, y: this.game.ball.y },
            { x: this.game.ball.x, y: this.game.ball.y },
            { x: this.game.ball.x, y: this.game.ball.y },
            { x: this.game.ball.x, y: this.game.ball.y }
        ];
    }
    
    resetPaddles() {
        this.game.paddle1.x = 50;
        this.game.paddle1.y = this.game.gameCanvas.height / 2 - this.game.paddle1.height / 2;
        this.game.paddle1.vy = 0;
        
        this.game.paddle2.x = this.game.gameCanvas.width - 50 - this.game.paddle2.width;
        this.game.paddle2.y = this.game.gameCanvas.height / 2 - this.game.paddle2.height / 2;
        this.game.paddle2.vy = 0;
    }
    
    updateBallPhysics(deltaTime) {
        this.game.ball.prevX = this.game.ball.x;
        this.game.ball.prevY = this.game.ball.y;
        
        this.game.ball.x += this.game.ball.vx * deltaTime;
        this.game.ball.y += this.game.ball.vy * deltaTime;
        
        if (this.game.ball.y <= this.game.ball.radius) {
            this.game.ball.y = this.game.ball.radius;
            this.game.ball.vy = Math.abs(this.game.ball.vy);
            this.game.ball.vy += (Math.random() - 0.5) * 50;
        } else if (this.game.ball.y >= this.game.gameCanvas.height - this.game.ball.radius) {
            this.game.ball.y = this.game.gameCanvas.height - this.game.ball.radius;
            this.game.ball.vy = -Math.abs(this.game.ball.vy);
            this.game.ball.vy += (Math.random() - 0.5) * 50;
        }
        
        this.checkPaddleCollisions();
        
        if (this.game.gameMode === 'single') {
            this.game.ai.update();
        }
        
        this.limitBallSpeed();
        this.updateBallHistory();
    }
    
    checkPaddleCollisions() {
        if (this.checkHandCollisions()) {
            return;
        }
        
        // Left paddle collision
        if (this.game.ball.x - this.game.ball.radius <= this.game.paddle1.x + this.game.paddle1.width &&
            this.game.ball.y >= this.game.paddle1.y && this.game.ball.y <= this.game.paddle1.y + this.game.paddle1.height &&
            this.game.ball.vx < 0) {
            
            this.game.ball.x = this.game.paddle1.x + this.game.paddle1.width + this.game.ball.radius;
            
            const hitPos = (this.game.ball.y - this.game.paddle1.y) / this.game.paddle1.height;
            const centerHit = hitPos - 0.5;
            
            this.game.ball.vx = Math.abs(this.game.ball.vx) * 1.1;
            this.game.ball.vy = this.game.ball.vy + centerHit * 600 + this.game.paddle1.vy * 0.5;
            
            this.game.ball.vx += (Math.random() - 0.5) * 50;
            this.game.ball.vy += (Math.random() - 0.5) * 100;
        }
        
        // Right paddle collision
        if (this.game.ball.x + this.game.ball.radius >= this.game.paddle2.x &&
            this.game.ball.y >= this.game.paddle2.y && this.game.ball.y <= this.game.paddle2.y + this.game.paddle2.height &&
            this.game.ball.vx > 0) {
            
            this.game.ball.x = this.game.paddle2.x - this.game.ball.radius;
            
            const hitPos = (this.game.ball.y - this.game.paddle2.y) / this.game.paddle2.height;
            const centerHit = hitPos - 0.5;
            
            this.game.ball.vx = -Math.abs(this.game.ball.vx) * 1.1;
            this.game.ball.vy = this.game.ball.vy + centerHit * 600 + this.game.paddle2.vy * 0.5;
            
            this.game.ball.vx += (Math.random() - 0.5) * 50;
            this.game.ball.vy += (Math.random() - 0.5) * 100;
        }
    }
    
    checkHandCollisions() {
        if (!this.game.hands || this.game.hands.length === 0) return false;
        
        for (let i = 0; i < this.game.hands.length; i++) {
            const hand = this.game.hands[i];
            
            if (!hand.landmarks) continue;
            
            // Get palm landmarks for more precise collision (landmarks 0, 5, 9, 13, 17)
            const palmLandmarks = [
                hand.landmarks[0],  // Wrist
                hand.landmarks[5],  // Index finger base
                hand.landmarks[9],  // Middle finger base  
                hand.landmarks[13], // Ring finger base
                hand.landmarks[17]  // Pinky base
            ];
            
            // Calculate smaller palm-focused bounding box
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            palmLandmarks.forEach(landmark => {
                const x = this.game.gameCanvas.width - (landmark.x * this.game.gameCanvas.width);
                const y = landmark.y * this.game.gameCanvas.height;
                
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            });
            
            // Determine which paddle this hand should control
            const handCenterX = (minX + maxX) / 2;
            const isLeftSide = handCenterX < this.game.gameCanvas.width / 2;
            const isRightSide = handCenterX > this.game.gameCanvas.width / 2;
            
            // Get the corresponding paddle for collision area constraint
            let paddle;
            if (this.game.gameMode === 'single' && isLeftSide) {
                paddle = this.game.paddle1;
            } else if (this.game.gameMode === 'multi') {
                if (isLeftSide) paddle = this.game.paddle1;
                else if (isRightSide) paddle = this.game.paddle2;
            }
            
            if (!paddle) continue;
            
            // Create collision area that matches paddle size more closely
            const handCollisionWidth = paddle.width + 30;  // Slightly wider than paddle
            const handCollisionHeight = paddle.height + 20; // Slightly taller than paddle
            
            // Center the collision area on the hand palm center
            const palmCenterX = (minX + maxX) / 2;
            const palmCenterY = (minY + maxY) / 2;
            
            const collisionLeft = palmCenterX - handCollisionWidth / 2;
            const collisionRight = palmCenterX + handCollisionWidth / 2;
            const collisionTop = palmCenterY - handCollisionHeight / 2;
            const collisionBottom = palmCenterY + handCollisionHeight / 2;
            
            // Check if ball intersects with the precise hand collision area
            const ballLeft = this.game.ball.x - this.game.ball.radius;
            const ballRight = this.game.ball.x + this.game.ball.radius;
            const ballTop = this.game.ball.y - this.game.ball.radius;
            const ballBottom = this.game.ball.y + this.game.ball.radius;
            
            const handCollision = (ballRight >= collisionLeft && ballLeft <= collisionRight && 
                                 ballBottom >= collisionTop && ballTop <= collisionBottom);
            
            if (handCollision) {
                const ballMovingLeft = this.game.ball.vx < 0;
                const ballMovingRight = this.game.ball.vx > 0;
                
                // Only allow collision if ball is moving toward the hand and hand is in correct area
                if (this.game.gameMode === 'single') {
                    if (isLeftSide && (ballMovingLeft || Math.abs(this.game.ball.vx) < 200)) {
                        this.handleHandHit(hand, 'left', palmCenterX, palmCenterY);
                        return true;
                    }
                } else if (this.game.gameMode === 'multi') {
                    if (isLeftSide && (ballMovingLeft || Math.abs(this.game.ball.vx) < 200)) {
                        this.handleHandHit(hand, 'left', palmCenterX, palmCenterY);
                        return true;
                    } else if (isRightSide && (ballMovingRight || Math.abs(this.game.ball.vx) < 200)) {
                        this.handleHandHit(hand, 'right', palmCenterX, palmCenterY);
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    handleHandHit(hand, side, handCenterX, handCenterY) {
        const deltaX = this.game.ball.x - handCenterX;
        const deltaY = this.game.ball.y - handCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        
        const speed = Math.sqrt(this.game.ball.vx * this.game.ball.vx + this.game.ball.vy * this.game.ball.vy) * 1.15;
        
        if (side === 'left') {
            this.game.ball.vx = Math.abs(Math.cos(angle) * speed);
            this.game.ball.vy = Math.sin(angle) * speed;
            this.game.ball.x = handCenterX + 60; // Closer position correction
        } else {
            this.game.ball.vx = -Math.abs(Math.cos(angle) * speed);
            this.game.ball.vy = Math.sin(angle) * speed;
            this.game.ball.x = handCenterX - 60; // Closer position correction
        }
        
        this.game.ball.vx += (Math.random() - 0.5) * 100;
        this.game.ball.vy += (Math.random() - 0.5) * 150;
        
        console.log('Hand hit detected on ' + side + ' side!');
    }
    
    limitBallSpeed() {
        const maxSpeed = 1400;
        const minSpeed = 300;
        const currentSpeed = Math.sqrt(this.game.ball.vx * this.game.ball.vx + this.game.ball.vy * this.game.ball.vy);
        
        if (currentSpeed > maxSpeed) {
            this.game.ball.vx = (this.game.ball.vx / currentSpeed) * maxSpeed;
            this.game.ball.vy = (this.game.ball.vy / currentSpeed) * maxSpeed;
        } else if (currentSpeed < minSpeed && currentSpeed > 0) {
            this.game.ball.vx = (this.game.ball.vx / currentSpeed) * minSpeed;
            this.game.ball.vy = (this.game.ball.vy / currentSpeed) * minSpeed;
        }
    }
    
    updateBallHistory() {
        if (!this.game.ball.history) {
            this.game.ball.history = [];
        }
        
        this.game.ball.history.push({ x: this.game.ball.x, y: this.game.ball.y });
        
        if (this.game.ball.history.length > 4) {
            this.game.ball.history.shift();
        }
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