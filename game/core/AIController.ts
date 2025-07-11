export const AI_CONTROLLER = `
class AIController {
    constructor(game) {
        this.game = game;
    }
    
    update() {
        // Calculate where the ball is versus where the AI paddle center is
        const ballCenterY = this.game.ball.y;
        const paddleCenterY = this.game.paddle2.y + this.game.paddle2.height / 2;
        const diff = ballCenterY - paddleCenterY; // Positive = ball below paddle, Negative = ball above paddle
        
        // AI difficulty settings - speed in pixels per second
        let aiSpeed = this.game.difficulty === 'easy' ? 400 :     // Slow and beatable
                     this.game.difficulty === 'hard' ? 800 :      // Fast and challenging
                     600;                                         // Balanced for normal play
        
        // Reaction distance - how close the ball needs to be before AI "sees" it
        const reactionDelay = this.game.difficulty === 'easy' ? 0.4 :     // 40% of screen width - slow reaction
                             this.game.difficulty === 'hard' ? 0.08 :    // 8% of screen width - quick reaction
                             0.2;                                        // 20% of screen width - balanced
        
        // STATE A: Ball is coming toward AI paddle (ball moving right AND within reaction distance)
        if (this.game.ball.vx > 0 && Math.abs(this.game.ball.x - this.game.paddle2.x) < this.game.gameCanvas.width * reactionDelay) {
            
            // Only move if paddle is more than 15 pixels away from ball (prevents oscillation)
            if (Math.abs(diff) > 15) {
                // Determine movement direction: +1 = down, -1 = up
                const moveDirection = Math.sign(diff);
                
                // Convert per-second speed to per-frame movement (60 FPS)
                const moveAmount = aiSpeed * (1/60);
                
                // Update paddle position
                this.game.paddle2.y += moveDirection * moveAmount;
                
                // Keep paddle within screen boundaries
                this.game.paddle2.y = Math.max(0, Math.min(
                    this.game.gameCanvas.height - this.game.paddle2.height,
                    this.game.paddle2.y
                ));
                
                // Store velocity for physics (used in ball collision calculations)
                this.game.paddle2.vy = moveDirection * aiSpeed;
            } else {
                // Ball is close enough - stop moving to prevent jittery behavior
                this.game.paddle2.vy = 0;
            }
        } else {
            // STATE B: Ball is moving away or too far - gradually return to center court position
            const centerY = this.game.gameCanvas.height / 2 - this.game.paddle2.height / 2;
            const centerDiff = centerY - this.game.paddle2.y;
            
            // Only move toward center if more than 5 pixels away
            if (Math.abs(centerDiff) > 5) {
                // Move toward center at 40% of normal speed (slower, casual return)
                const returnSpeed = aiSpeed * 0.4;
                const moveAmount = Math.sign(centerDiff) * returnSpeed * (1/60);
                
                this.game.paddle2.y += moveAmount;
                this.game.paddle2.vy = Math.sign(centerDiff) * returnSpeed;
            } else {
                // Close enough to center - stop moving
                this.game.paddle2.vy = 0;
            }
        }
    }
}
`;