export const CSS_CONTENT = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    overflow: hidden;
    position: relative;
}

body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

#gameContainer {
    position: relative;
    width: 100vw;
    height: calc(100vh - 40px); /* Account for footer height */
    flex: 1;
}

canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#videoCanvas {
    z-index: 1;
}

#gameCanvas {
    z-index: 2;
}

#handCanvas {
    z-index: 3;
}

#ui {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
    display: none;
}

#ui.active {
    display: block; /* Show when game is active */
}

#timer {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
    font-weight: bold;
    font-size: 18px;
}

#cameraStatus, #handStatus, #loadingStatus {
    position: absolute;
    bottom: 50px; /* Moved up to account for footer */
    left: 10px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px 15px;
    border-radius: 8px;
    font-size: 14px;
    backdrop-filter: blur(10px);
}

#handStatus {
    bottom: 85px; /* Stacked above camera status */
}

#loadingStatus {
    bottom: 120px; /* Stacked above hand status */
    color: #FFD700;
    font-weight: bold;
}

.info-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 20;
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.leaderboard-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    padding: 30px;
    border-radius: 20px;
    text-align: center;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 20;
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.info-panel h2, .leaderboard-panel h2 {
    margin-bottom: 20px;
    color: #FFD700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.info-panel p {
    margin-bottom: 10px;
    line-height: 1.4;
}

.emoji {
    font-size: 1.2em;
    margin-right: 5px;
}

.game-modes {
    margin: 20px 0;
}

.mode-btn, .difficulty-btn {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 12px 20px;
    margin: 5px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.mode-btn:hover, .difficulty-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.mode-btn.selected, .difficulty-btn.selected {
    background: linear-gradient(45deg, #FFD700, #FFA500);
    color: #333;
}

#usernameInput {
    width: 100%;
    padding: 12px;
    margin: 15px 0;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    text-align: center;
    background: rgba(255, 255, 255, 0.9);
    color: #333;
}

#startButton, #playAgainButton, #backToMenuButton {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    border: none;
    padding: 15px 30px;
    margin: 10px 5px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

#startButton:hover, #playAgainButton:hover, #backToMenuButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

#startButton:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.hidden {
    display: none !important;
}

.player-score {
    font-size: 18px;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.leaderboard-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    margin: 5px 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    backdrop-filter: blur(5px);
}

.leaderboard-entry.current-player {
    background: rgba(255, 215, 0, 0.3);
    border: 2px solid #FFD700;
}

.leaderboard-rank {
    font-weight: bold;
    min-width: 60px;
}

.leaderboard-name {
    flex: 1;
    font-weight: bold;
    text-align: left;
    margin: 0 10px;
}

.leaderboard-stats {
    font-size: 14px;
    opacity: 0.8;
}

/* Sticky Footer Styles */
#gameFooter {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: rgba(0, 0, 0, 0.8);
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    font-family: 'Courier New', monospace;
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1000;
}

#gameFooter .heart {
    color: #ff6b6b;
    animation: heartbeat 1.5s ease-in-out infinite;
    margin: 0 2px;
}

#gameFooter a {
    color: #64b5f6;
    text-decoration: none;
    transition: color 0.3s ease;
}

#gameFooter a:hover {
    color: #90caf9;
    text-decoration: underline;
}

@keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .info-panel, .leaderboard-panel {
        max-width: 90vw;
        padding: 20px;
    }
    
    #gameFooter {
        font-size: 12px;
        padding: 0 10px;
        text-align: center;
    }
    
    .mode-btn, .difficulty-btn {
        padding: 10px 15px;
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    #gameFooter {
        font-size: 11px;
        height: 35px;
    }
    
    #gameContainer {
        height: calc(100vh - 35px);
    }
    
    #cameraStatus, #handStatus, #loadingStatus {
        bottom: 45px;
        font-size: 12px;
        padding: 6px 12px;
    }
    
    #handStatus {
        bottom: 75px;
    }
    
    #loadingStatus {
        bottom: 105px;
    }
}
`;