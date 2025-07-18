import { CSS_CONTENT } from '../styles/main.css.js';
import { MAIN_SCRIPT } from '../game/main.js';

export const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏓 Hand Pong - Play Pong with Your Hands!</title>
    <style>
    ${CSS_CONTENT}
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="videoCanvas"></canvas>
        <canvas id="gameCanvas"></canvas>
        <canvas id="handCanvas"></canvas>
        
        <div id="ui"><div id="scores"></div></div>
        <div id="timer" class="hidden">⏱️ 00:00</div>
        <div id="cameraStatus">📷 Camera: Initializing...</div>
        <div id="handStatus">🤚 Hands: Loading AI...</div>
        <div id="loadingStatus">🤖 Loading MediaPipe...</div>
        
        <div id="infoPanel" class="info-panel">
            <h2>🏓 Hand Pong</h2>
            <p><strong>🎯 How to Play:</strong></p>
            <p><span class="emoji">🤚</span> Show your hands to the camera</p>
            <p><span class="emoji">🏓</span> Move your hand up and down to control your paddle</p>
            <p><span class="emoji">🤖</span> Play against our AI opponent or with a friend!</p>
            <p><span class="emoji">🏆</span> First to 5 points wins!</p>
            <p><strong>🤖 AI-Powered Detection:</strong></p>
            <p>Uses MediaPipe for real-time hand tracking and paddle control</p>
            <p><em>⚡ Smooth hand movements for precise paddle control!</em></p>
            
            <div class="game-modes">
                <button id="singlePlayerBtn" class="mode-btn">🤖 1 Player (vs AI)</button>
                <button id="multiPlayerBtn" class="mode-btn">👥 2 Players</button>
            </div>
            
            <div id="difficultyPanel" class="hidden">
                <h3>Select Difficulty:</h3>
                <button class="difficulty-btn" data-difficulty="easy">Easy</button>
                <button class="difficulty-btn" data-difficulty="normal">Normal</button>
                <button class="difficulty-btn" data-difficulty="hard">Hard</button>
            </div>
            
            <input type="text" id="usernameInput" placeholder="Enter your username" maxlength="20" class="hidden" />
            <button id="startButton" class="hidden">🎮 Start Game</button>
        </div>
        
        <div id="leaderboardPanel" class="leaderboard-panel hidden">
            <h2>🏆 Hand-Pong Leaderboard</h2>
            <div id="leaderboardContent"></div>
            <button id="playAgainButton">🎮 Play Again</button>
            <button id="backToMenuButton">🏠 Main Menu</button>
        </div>
    </div>
    
    <!-- Sticky Footer -->
    <footer id="gameFooter">
        made w/ <span class="heart">♥</span> in sf🌉 w/ <a href="https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js">mediapipe handlandmarker</a>, <a href="https://developers.cloudflare.com/workers/">cloudflare workers</a>, <a href="https://developers.cloudflare.com/workers-ai/">workers ai</a>, <a href="https://developers.cloudflare.com/d1/">d1</a>. 
        <a href="https://github.com/elizabethsiegle/hand-pong-worker-d1" target="_blank" rel="noopener">
            👩🏻‍💻code: here on github
        </a>
    </footer>

    <script type="module">
        ${MAIN_SCRIPT}
    </script>
</body>
</html>`;