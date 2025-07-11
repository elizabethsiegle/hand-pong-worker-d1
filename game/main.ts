import { HAND_DETECTION } from './core/HandDetection';
import { PHYSICS_ENGINE } from './core/PhysicsEngine';
import { AI_CONTROLLER, HAND_PONG_GAME } from './core/GameComponents';
import { UI_MANAGER } from './core/UIManager.js';
import { RENDER_ENGINE } from './core/RenderEngine';

export const MAIN_SCRIPT = `
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

${HAND_DETECTION}
${PHYSICS_ENGINE}
${AI_CONTROLLER}
${UI_MANAGER}
${RENDER_ENGINE}
${HAND_PONG_GAME}

window.addEventListener('DOMContentLoaded', () => new HandPongGame());
`;