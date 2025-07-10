import { HTML_CONTENT } from '../html/html-content.js';
import { CSS_CONTENT } from '../styles/main.css.js';

// Cloudflare Worker for Hand-Based Pong Game with AI and Leaderboard
export interface Env {
  DB: D1Database; // Cloudflare D1 database binding
  AI?: Ai; // Cloudflare Workers AI binding (optional)
  LEADERBOARD?: DurableObjectNamespace; // Fallback to Durable Object
}

interface ScoreBody {
  username: string;
  score: number;
  time: number;
  difficulty: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/') {
      return new Response(HTML_CONTENT, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    if (url.pathname === '/styles/main.css') {
      return new Response(CSS_CONTENT, {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    // API endpoint to save score (1-player mode only)
    if (url.pathname === '/api/save-score' && request.method === 'POST') {
      try {
        const body = await request.json() as ScoreBody;
        const { username, score, time, difficulty } = body;
        
        // Validate input
        if (!username || typeof score !== 'number' || typeof time !== 'number') {
          return new Response('Invalid data', { status: 400 });
        }
        
        // Try D1 first
        if (env.DB) {
          try {
            // Insert into hand-pong leaderboard
            await env.DB.prepare(
              'INSERT INTO hand_pong_leaderboard (username, score, time, difficulty, date) VALUES (?, ?, ?, ?, ?)'
            ).bind(
              username.slice(0, 20), 
              score, 
              time,
              difficulty || 'normal',
              new Date().toISOString()
            ).run();
            
            return new Response('Score saved to Hand-Pong leaderboard', { status: 200 });
          } catch (dbError) {
            console.error('D1 Error:', dbError);
            return new Response('Database error', { status: 500 });
          }
        }
        
        return new Response('Score saved (no database)', { status: 200 });
        
      } catch (error) {
        console.error('Error saving score:', error);
        return new Response('Error saving score', { status: 500 });
      }
    }
    
    // API endpoint to get hand-pong leaderboard
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
      try {
        // Try D1 first
        if (env.DB) {
          try {
            const result = await env.DB.prepare(
              'SELECT username, score, time, difficulty, date FROM hand_pong_leaderboard ORDER BY score DESC, time ASC LIMIT 10'
            ).all();
            
            return new Response(JSON.stringify(result.results), {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (dbError) {
            console.error('D1 Error:', dbError);
          }
        }
        
        // Demo mode - return sample leaderboard data
        const demoLeaderboard = [
          { username: "PongMaster", score: 15, time: 120, difficulty: 'hard', date: new Date().toISOString() },
          { username: "HandPaddle", score: 12, time: 98, difficulty: 'normal', date: new Date().toISOString() },
          { username: "AIPunisher", score: 10, time: 85, difficulty: 'easy', date: new Date().toISOString() },
          { username: "QuickHands", score: 8, time: 75, difficulty: 'normal', date: new Date().toISOString() },
          { username: "PongProud", score: 7, time: 68, difficulty: 'hard', date: new Date().toISOString() }
        ];
        
        return new Response(JSON.stringify(demoLeaderboard), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return new Response('Error fetching leaderboard', { status: 500 });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};