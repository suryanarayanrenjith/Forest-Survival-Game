import OpenAI from 'openai';

export interface GameplayConfig {
  enemySpawnRate: number; // 0.5 - 3.0 (multiplier)
  enemyDifficulty: number; // 0.5 - 3.0 (multiplier for health/damage)
  enemySpeed: number; // 0.5 - 2.5 (multiplier)
  spawnVariety: {
    normal: number; // 0-100 percentage
    fast: number;
    tank: number;
    boss: number;
  };
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk' | 'bloodmoon';
  atmosphere: 'normal' | 'foggy' | 'stormy' | 'ethereal' | 'apocalyptic';
  intensity: 'calm' | 'moderate' | 'intense' | 'extreme';
  progressiveDifficulty: boolean; // Gradually increase difficulty over time
  difficultyRamp: number; // 0-1, how fast difficulty increases
  specialFeatures: string[];
}

export interface AIGameState {
  currentWave: number;
  enemiesKilled: number;
  playerHealth: number;
  score: number;
  survivalTime: number;
}

export class AIGameAgent {
  private openai: OpenAI;
  private initialPrompt: string;
  private gameplayConfig: GameplayConfig;
  private conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

  constructor(apiKey: string, playerPrompt: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });

    this.initialPrompt = playerPrompt;
    this.conversationHistory = [];

    // Default balanced config
    this.gameplayConfig = {
      enemySpawnRate: 1.0,
      enemyDifficulty: 1.0,
      enemySpeed: 1.0,
      spawnVariety: {
        normal: 60,
        fast: 25,
        tank: 10,
        boss: 5,
      },
      timeOfDay: 'day',
      atmosphere: 'normal',
      intensity: 'moderate',
      progressiveDifficulty: false,
      difficultyRamp: 0.5,
      specialFeatures: [],
    };
  }

  /**
   * Initialize the AI agent with player's gameplay prompt
   */
  async initialize(): Promise<GameplayConfig> {
    const systemPrompt = `You are an intelligent game director AI for a 3D forest survival shooter game. Your role is to interpret player's gameplay preferences and create engaging, balanced gameplay experiences.

Game Mechanics:
- Players fight waves of enemies in a forest environment
- Enemy types: normal (balanced), fast (quick, low health), tank (slow, high health), boss (powerful)
- Time of day: day, night, dawn, dusk, bloodmoon (affects visibility/atmosphere)
- Atmosphere: normal, foggy, stormy, ethereal, apocalyptic
- Progressive difficulty: can increase over time based on player performance
- Players unlock weapons by earning score

Your Task:
Analyze the player's prompt and generate a JSON configuration that creates their desired experience. Balance challenge with fun.

Response Format (JSON only, no markdown):
{
  "enemySpawnRate": 0.5-3.0,
  "enemyDifficulty": 0.5-3.0,
  "enemySpeed": 0.5-2.5,
  "spawnVariety": {
    "normal": 0-100,
    "fast": 0-100,
    "tank": 0-100,
    "boss": 0-100
  },
  "timeOfDay": "day" | "night" | "dawn" | "dusk" | "bloodmoon",
  "atmosphere": "normal" | "foggy" | "stormy" | "ethereal" | "apocalyptic",
  "intensity": "calm" | "moderate" | "intense" | "extreme",
  "progressiveDifficulty": true/false (enable if they want gradual increase),
  "difficultyRamp": 0.1-1.0 (how fast difficulty increases, 0.5 = moderate),
  "specialFeatures": ["description of special adaptations"],
  "interpretation": "brief explanation of your choices"
}

Rules:
- spawnVariety percentages should sum to 100
- Keep values within specified ranges
- Balance difficulty - too easy is boring, too hard is frustrating
- Consider player intent (e.g., "relaxing" = lower values, "nightmare" = higher values)
- If they mention "progressive", "gradually harder", "ramp up" = set progressiveDifficulty: true
- Atmosphere should match mood (foggy for scary, stormy for intense, ethereal for mysterious)
- Respond ONLY with valid JSON, no other text`;

    try {
      this.conversationHistory.push({
        role: 'system',
        content: systemPrompt,
      });

      this.conversationHistory.push({
        role: 'user',
        content: `Player's gameplay prompt: "${this.initialPrompt}"\n\nGenerate the gameplay configuration.`,
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Using GPT-4o as GPT-5 is not yet available
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Parse and validate response
      const config = this.parseAndValidateConfig(aiResponse);
      this.gameplayConfig = config;

      console.log('🤖 AI Game Director initialized:', config);
      return config;
    } catch (error) {
      console.error('❌ AI initialization error:', error);
      throw new Error('Failed to initialize AI game director. Please check your API key and try again.');
    }
  }

  /**
   * Dynamically adapt gameplay based on current state
   */
  async adaptGameplay(gameState: AIGameState): Promise<GameplayConfig> {
    const adaptationPrompt = `Current game state:
- Wave: ${gameState.currentWave}
- Enemies Killed: ${gameState.enemiesKilled}
- Player Health: ${gameState.playerHealth}%
- Score: ${gameState.score}
- Survival Time: ${Math.floor(gameState.survivalTime / 60)}min ${gameState.survivalTime % 60}sec

Based on the original player prompt "${this.initialPrompt}" and current gameplay, should we adjust difficulty?

If player is struggling (low health, low kills), make it slightly easier.
If player is dominating (high health, high kills), increase challenge gradually.

Respond with updated JSON configuration (same format as before) or "NO_CHANGE" if current settings are good.`;

    try {
      this.conversationHistory.push({
        role: 'user',
        content: adaptationPrompt,
      });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: this.conversationHistory,
        temperature: 0.6,
        max_tokens: 500,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });

      if (aiResponse.includes('NO_CHANGE')) {
        console.log('🤖 AI: No changes needed');
        return this.gameplayConfig;
      }

      const config = this.parseAndValidateConfig(aiResponse);
      this.gameplayConfig = config;

      console.log('🤖 AI adapted gameplay:', config);
      return config;
    } catch (error) {
      console.error('❌ AI adaptation error:', error);
      // Return current config on error
      return this.gameplayConfig;
    }
  }

  /**
   * Get current gameplay configuration
   */
  getCurrentConfig(): GameplayConfig {
    return this.gameplayConfig;
  }

  /**
   * Parse and validate AI response
   */
  private parseAndValidateConfig(response: string): GameplayConfig {
    try {
      // Extract JSON from response (handles markdown code blocks)
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and clamp values
      const config: GameplayConfig = {
        enemySpawnRate: this.clamp(parsed.enemySpawnRate || 1.0, 0.5, 3.0),
        enemyDifficulty: this.clamp(parsed.enemyDifficulty || 1.0, 0.5, 3.0),
        enemySpeed: this.clamp(parsed.enemySpeed || 1.0, 0.5, 2.5),
        spawnVariety: this.normalizeSpawnVariety(parsed.spawnVariety || {
          normal: 60,
          fast: 25,
          tank: 10,
          boss: 5,
        }),
        timeOfDay: this.validateTimeOfDay(parsed.timeOfDay),
        atmosphere: this.validateAtmosphere(parsed.atmosphere),
        intensity: this.validateIntensity(parsed.intensity),
        progressiveDifficulty: Boolean(parsed.progressiveDifficulty),
        difficultyRamp: this.clamp(parsed.difficultyRamp || 0.5, 0.1, 1.0),
        specialFeatures: Array.isArray(parsed.specialFeatures) ? parsed.specialFeatures : [],
      };

      return config;
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.log('Raw response:', response);

      // Return safe defaults
      return {
        enemySpawnRate: 1.0,
        enemyDifficulty: 1.0,
        enemySpeed: 1.0,
        spawnVariety: { normal: 60, fast: 25, tank: 10, boss: 5 },
        timeOfDay: 'day',
        atmosphere: 'normal',
        intensity: 'moderate',
        progressiveDifficulty: false,
        difficultyRamp: 0.5,
        specialFeatures: [],
      };
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private normalizeSpawnVariety(variety: any): GameplayConfig['spawnVariety'] {
    const normal = Math.max(0, Math.min(100, variety.normal || 60));
    const fast = Math.max(0, Math.min(100, variety.fast || 25));
    const tank = Math.max(0, Math.min(100, variety.tank || 10));
    const boss = Math.max(0, Math.min(100, variety.boss || 5));

    const total = normal + fast + tank + boss;

    if (total === 0) {
      return { normal: 60, fast: 25, tank: 10, boss: 5 };
    }

    // Normalize to sum to 100
    return {
      normal: Math.round((normal / total) * 100),
      fast: Math.round((fast / total) * 100),
      tank: Math.round((tank / total) * 100),
      boss: Math.round((boss / total) * 100),
    };
  }

  private validateTimeOfDay(timeOfDay: string): 'day' | 'night' | 'dawn' | 'dusk' | 'bloodmoon' {
    const valid = ['day', 'night', 'dawn', 'dusk', 'bloodmoon'];
    return valid.includes(timeOfDay) ? timeOfDay as any : 'day';
  }

  private validateAtmosphere(atmosphere: string): 'normal' | 'foggy' | 'stormy' | 'ethereal' | 'apocalyptic' {
    const valid = ['normal', 'foggy', 'stormy', 'ethereal', 'apocalyptic'];
    return valid.includes(atmosphere) ? atmosphere as any : 'normal';
  }

  private validateIntensity(intensity: string): 'calm' | 'moderate' | 'intense' | 'extreme' {
    const valid = ['calm', 'moderate', 'intense', 'extreme'];
    return valid.includes(intensity) ? intensity as any : 'moderate';
  }
}
