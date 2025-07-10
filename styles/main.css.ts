export const CSS_CONTENT = `
* { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
}

body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
    overflow: hidden; 
    color: white;
}

#gameContainer { 
    position: relative; 
    width: 100vw; 
    height: 100vh; 
}

#videoCanvas { 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    z-index: 1; 
    background: #000; 
}

#gameCanvas { 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    z-index: 2; 
    pointer-events: none;
    border: 4px solid rgba(255, 255, 255, 0.8);
    box-shadow: 
        0 0 20px rgba(255, 255, 255, 0.3),
        inset 0 0 20px rgba(255, 255, 255, 0.1);
}

#gameCanvas::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-radius: 8px;
    pointer-events: none;
}

/* Corner indicators for game area */
#gameContainer::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 20px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    pointer-events: none;
    z-index: 4;
    box-shadow: 
        inset 0 0 30px rgba(255, 255, 255, 0.1),
        0 0 30px rgba(255, 255, 255, 0.2);
}

#handCanvas { 
    position: absolute; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    z-index: 3; 
    pointer-events: none; 
}

#ui { 
    position: absolute; 
    top: 20px; 
    left: 20px; 
    z-index: 4; 
    color: white; 
    font-size: 24px; 
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5); 
}

.player-score { 
    margin-bottom: 10px; 
    padding: 15px; 
    background: rgba(0,0,0,0.4); 
    border-radius: 10px; 
    border-left: 4px solid #4CAF50; 
}
        
#timer { 
    position: absolute; 
    top: 20px; 
    right: 20px; 
    z-index: 4; 
    background: rgba(0,0,0,0.6); 
    padding: 15px; 
    border-radius: 10px; 
    font-size: 24px; 
    font-weight: bold; 
    color: #FFD700; 
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.info-panel { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    z-index: 10; 
    background: rgba(0,0,0,0.9); 
    color: white; 
    padding: 40px; 
    border-radius: 20px; 
    text-align: center; 
    max-width: 600px; 
    border: 2px solid #4CAF50; 
}

.info-panel h2 { 
    margin-bottom: 20px; 
    color: #4CAF50; 
    font-size: 32px; 
}

.info-panel p { 
    margin-bottom: 15px; 
    line-height: 1.6; 
    font-size: 18px; 
}

.info-panel .emoji { 
    font-size: 24px; 
    margin: 0 5px; 
}

.game-modes {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin: 20px 0;
}

.mode-btn {
    padding: 15px 30px;
    font-size: 18px;
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    transition: all 0.3s;
    font-weight: 600;
}

.mode-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}

.mode-btn.selected {
    transform: scale(1.2);
    background: linear-gradient(45deg, #FFD700, #FF8F00) !important;
    border: 4px solid #fff;
    box-shadow: 
        0 0 30px rgba(255, 215, 0, 0.8),
        0 8px 25px rgba(255, 215, 0, 0.4);
    font-size: 22px;
    padding: 20px 40px;
    color: #000 !important;
    font-weight: 800;
    text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
    animation: selectedPulse 2s ease-in-out infinite;
}

.mode-btn.selected:hover {
    transform: scale(1.2) translateY(-2px);
}

/* Make unselected buttons fade when one is selected */
.game-modes:has(.mode-btn.selected) .mode-btn:not(.selected) {
    opacity: 0.4;
    transform: scale(0.9);
}

#difficultyPanel {
    margin: 20px 0;
}

#difficultyPanel h3 {
    margin-bottom: 15px;
    color: #4CAF50;
}

.difficulty-btn {
    padding: 10px 25px;
    margin: 0 10px;
    font-size: 16px;
    background: linear-gradient(45deg, #2196F3, #1976D2);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.difficulty-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.difficulty-btn.selected {
    transform: scale(1.05);
    background: linear-gradient(45deg, #FFD700, #FFA000);
    border: 2px solid #fff;
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.3);
}

#startButton { 
    padding: 25px 50px; 
    font-size: 28px; 
    background: linear-gradient(45deg, #FF9800, #F57C00); 
    color: white; 
    border: none; 
    border-radius: 15px; 
    cursor: pointer; 
    box-shadow: 0 8px 15px rgba(0,0,0,0.3); 
    transition: all 0.3s; 
    margin-top: 20px;
}

#startButton:hover { 
    background: linear-gradient(45deg, #F57C00, #FF9800); 
    transform: scale(1.05); 
}

#startButton:disabled { 
    background: #666; 
    cursor: not-allowed; 
    transform: none; 
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

#usernameInput {
    padding: 15px; 
    font-size: 18px; 
    border: 2px solid #4CAF50; 
    border-radius: 10px; 
    background: rgba(255,255,255,0.9); 
    color: #333; 
    margin: 15px 0; 
    width: 300px; 
    text-align: center;
}

#usernameInput:focus { 
    outline: none; 
    border-color: #45a049; 
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5); 
}

#cameraStatus { 
    position: absolute; 
    bottom: 20px; 
    left: 20px; 
    z-index: 4; 
    background: rgba(0,0,0,0.6); 
    padding: 15px; 
    border-radius: 10px; 
    font-size: 14px; 
}

#handStatus { 
    position: absolute; 
    bottom: 60px; 
    right: 20px; 
    z-index: 4; 
    background: rgba(0,0,0,0.6); 
    padding: 15px; 
    border-radius: 10px; 
    font-size: 14px; 
}

#loadingStatus { 
    position: absolute; 
    bottom: 20px; 
    right: 20px; 
    z-index: 4; 
    background: rgba(0,0,0,0.8); 
    padding: 15px; 
    border-radius: 10px; 
    font-size: 14px; 
    color: #4CAF50; 
}

.leaderboard-panel {
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    z-index: 10;
    background: rgba(0,0,0,0.95); 
    color: white; 
    padding: 40px; 
    border-radius: 20px;
    text-align: center; 
    max-width: 700px; 
    min-width: 500px; 
    border: 2px solid #FFD700;
}

.leaderboard-panel h2 { 
    margin-bottom: 30px; 
    color: #FFD700; 
    font-size: 36px; 
}

.leaderboard-entry { 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    padding: 12px 20px; 
    margin: 8px 0; 
    background: rgba(255,255,255,0.1);
    border-radius: 10px; 
    font-size: 18px;
}

.leaderboard-entry.current-player { 
    background: rgba(255,215,0,0.2); 
    border: 2px solid #FFD700;
}

.leaderboard-rank { 
    font-weight: bold; 
    color: #FFD700; 
    min-width: 40px; 
}

.leaderboard-name { 
    flex: 1; 
    text-align: left; 
    margin-left: 20px; 
}

.leaderboard-stats { 
    text-align: right; 
    font-family: monospace; 
}

#playAgainButton, #backToMenuButton {
    padding: 20px 40px; 
    font-size: 24px; 
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white; 
    border: none; 
    border-radius: 15px; 
    cursor: pointer;
    margin: 10px; 
    transition: all 0.3s;
}

#playAgainButton:hover, #backToMenuButton:hover { 
    transform: scale(1.05); 
}

#backToMenuButton {
    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
}

.celebration { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    font-size: 64px; 
    color: #FFD700; 
    text-shadow: 3px 3px 6px rgba(0,0,0,0.8); 
    z-index: 6; 
    animation: celebration 2.5s ease-out; 
}

@keyframes celebration { 
    0% { transform: translate(-50%, -50%) scale(0) rotate(-180deg); opacity: 0; } 
    50% { transform: translate(-50%, -50%) scale(1.3) rotate(0deg); opacity: 1; } 
    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0; } 
}

@keyframes selectedPulse {
    0%, 100% { 
        box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.8),
            0 8px 25px rgba(255, 215, 0, 0.4);
    }
    50% { 
        box-shadow: 
            0 0 40px rgba(255, 215, 0, 1),
            0 8px 30px rgba(255, 215, 0, 0.6);
    }
}

.hidden { 
    display: none; 
}

/* Responsive design */
@media (max-width: 768px) {
    .info-panel {
        padding: 20px;
        max-width: 90%;
    }
    
    .game-modes {
        flex-direction: column;
        gap: 10px;
    }
    
    .mode-btn {
        font-size: 16px;
        padding: 12px 25px;
    }
    
    #usernameInput {
        width: 250px;
        font-size: 16px;
    }
    
    #startButton {
        font-size: 24px;
        padding: 20px 40px;
    }
}
`;