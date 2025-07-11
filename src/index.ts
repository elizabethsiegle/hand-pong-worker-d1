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

interface NameGenerationRequest {
  type: 'ai_opponent' | 'multiplayer';
  playerUsername?: string; // For single player, to avoid duplicates
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
    
    // API endpoint for generating player names
    if (url.pathname === '/api/generate-names' && request.method === 'POST') {
      try {
        if (!env.AI) {
          return new Response('AI service not available', { status: 503 });
        }

        const body = await request.json() as NameGenerationRequest;
        const { type, playerUsername } = body;

        let generatedNames;
        
        if (type === 'ai_opponent') {
          // Generate AI/computer-related name for single player opponent
          generatedNames = await this.generateAIOpponentName(env.AI, playerUsername);
        } else if (type === 'multiplayer') {
          // Generate Cloudflare/developer-related names for both players
          generatedNames = await this.generateMultiplayerNames(env.AI);
        }

        return new Response(JSON.stringify(generatedNames), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Name generation error:', error);
        return new Response('Name generation failed', { status: 500 });
      }
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
  },

  // Generate AI/computer-related name for single player opponent
  async generateAIOpponentName(AI: Ai, playerUsername?: string): Promise<{ aiName: string }> {
    try {
      const timestamp = Date.now() % 10000; // Add timestamp for uniqueness
      
      const messages = [
        { 
          role: "system", 
          content: "You are an extremely creative AI name generator. Your job is to invent completely original, unique names for AI opponents in a pong game. Never repeat names. Be wildly creative and combine tech themes with action concepts." 
        },
        {
          role: "user",
          content: `Create ONE unique, original AI/robot/computer-themed name for a pong opponent. Draw inspiration from words like: cyber, quantum, neural, algorithm, data, binary, digital, virtual, android, circuit combined with action words like: master, ninja, titan, storm, blade, force, ace, pro, guru, striker. Be creative and original! ${playerUsername ? `Avoid anything similar to "${playerUsername}".` : ''} Unique session: ${timestamp}. ONLY return the name, nothing else.`
        }
      ];

      const response = await AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { 
        messages,
        max_tokens: 30,
        temperature: 1.0  // Maximum creativity
      }) as { response?: string };

      if (response && response.response) {
        // Clean up the response
        let aiName = response.response.trim()
          .replace(/['"]/g, '')
          .replace(/^(Name:|AI:|Opponent:)/i, '')
          .split('\n')[0]
          .split('.')[0]
          .split(',')[0]
          .trim();
        
        // Basic validation
        if (aiName && aiName.length > 0 && aiName.length <= 25 && /^[a-zA-Z0-9_-]+$/i.test(aiName)) {
          // Check it's not the same as player username
          if (!playerUsername || aiName.toLowerCase() !== playerUsername.toLowerCase()) {
            return { aiName };
          }
        }
      }
      
      // If AI generation fails, generate a simple unique name
      const uniqueId = Date.now().toString().slice(-4);
      return { aiName: `TechBot${uniqueId}` };
      
    } catch (error) {
      console.error('AI opponent name generation failed:', error);
      const uniqueId = Date.now().toString().slice(-4);
      return { aiName: `CyberAI${uniqueId}` };
    }
  },

  // Generate Cloudflare/developer-related names for multiplayer
  async generateMultiplayerNames(AI: Ai): Promise<{ player1Name: string; player2Name: string }> {
    try {
      const sessionId = Date.now() % 1000;
      
      const messages = [
        { 
          role: "system", 
          content: "You are a creative name generator for developer/Cloudflare themed names. Create original names that combine Cloudflare and developer concepts with powerful action energy. Think like a creative developer who loves Cloudflare and coding." 
        },
        {
          role: "user",
          content: `Generate exactly TWO different, creative Cloudflare/developer-themed names for pong players. Draw inspiration from Cloudflare terms like: edge, worker, zone, CDN, DNS, cache, firewall, analytics, R2, D1, and developer terms like: code, git, API, stack, repo, commit, deploy, debug, syntax, framework, combined with action words like: master, hero, ninja, guru, ace, pro, king, wizard, boss, champion. Make them sound like powerful developer heroes. Session: ${sessionId}. Format: Name1, Name2. ONLY return the two names separated by a comma.`
        }
      ];

      const response = await AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", { 
        messages,
        max_tokens: 40,
        temperature: 1.0  // Maximum creativity
      }) as { response?: string };

      if (response && response.response) {
        const cleanResponse = response.response.trim()
          .replace(/['"]/g, '')
          .replace(/^(Names:|Players:)/i, '');
          
        const names = cleanResponse
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0 && name.length <= 25 && /^[a-zA-Z0-9_-]+$/i.test(name));
        
        if (names.length >= 2) {
          return { player1Name: names[0], player2Name: names[1] };
        }
      }
      
      // If AI generation fails, generate simple unique names
      const uniqueId1 = Date.now().toString().slice(-3);
      const uniqueId2 = (Date.now() + 1).toString().slice(-3);
      return { 
        player1Name: `EdgeDev${uniqueId1}`, 
        player2Name: `CloudPro${uniqueId2}` 
      };
      
    } catch (error) {
      console.error('Multiplayer name generation failed:', error);
      const uniqueId1 = Date.now().toString().slice(-3);
      const uniqueId2 = (Date.now() + 1).toString().slice(-3);
      return { 
        player1Name: `WorkerBee${uniqueId1}`, 
        player2Name: `FlareCode${uniqueId2}` 
      };
    }
  }
};