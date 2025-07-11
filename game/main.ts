import { HAND_DETECTION } from './core/HandDetection.js';
import { PHYSICS_ENGINE } from './core/PhysicsEngine.js';
import { AI_CONTROLLER } from './core/AIController.js';
import { UI_MANAGER } from './core/UIManager.js';
import { RENDER_ENGINE } from './core/RenderEngine.js';
import { HAND_PONG_GAME } from './core/HandPongGame.js';

export const MAIN_SCRIPT = `
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

${HAND_DETECTION}

${PHYSICS_ENGINE}

${AI_CONTROLLER}

${UI_MANAGER}

${RENDER_ENGINE}

${HAND_PONG_GAME}

// Initialize the game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new HandPongGame();
});
`;