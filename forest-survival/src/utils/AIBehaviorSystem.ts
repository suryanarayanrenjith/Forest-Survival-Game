import * as THREE from 'three';

/**
 * ADVANCED ENEMY AI BEHAVIOR SYSTEM
 *
 * This system implements a sophisticated AI with:
 * - State Machine (Idle, Patrol, Hunt, Attack, Retreat, Coordinate)
 * - Behavior Trees for hierarchical decision making
 * - Predictive movement and attack patterns
 * - Group coordination and tactics
 */

export type AIState = 'idle' | 'patrol' | 'hunt' | 'attack' | 'retreat' | 'coordinate' | 'ambush';
export type AIPersonality = 'aggressive' | 'tactical' | 'defensive' | 'support';

export interface AIBehaviorContext {
  enemyPosition: THREE.Vector3;
  enemyRotation: number;
  playerPosition: THREE.Vector3;
  playerVelocity: THREE.Vector3;
  distanceToPlayer: number;
  health: number;
  maxHealth: number;
  type: 'normal' | 'fast' | 'tank' | 'boss';
  allEnemies: any[];
  terrainObjects: any[];
  canSeePlayer: boolean;
  hearPlayerShooting: boolean;
  timeSinceLastSawPlayer: number;
  isInCover: boolean;
}

export interface AIDecision {
  state: AIState;
  targetPosition: THREE.Vector3;
  shouldAttack: boolean;
  moveSpeed: number;
  priority: number;
}

export class AIBehaviorSystem {
  private currentState: AIState = 'idle';
  private personality: AIPersonality;
  private stateTimer: number = 0;
  private lastDecisionTime: number = 0;
  private decisionCooldown: number = 200; // Make decisions every 200ms
  private patrolPoints: THREE.Vector3[] = [];
  private currentPatrolIndex: number = 0;
  private lastKnownPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  private investigatePosition: THREE.Vector3 | null = null;
  private alertLevel: number = 0; // 0-100, how aware the enemy is

  constructor(personality: AIPersonality = 'aggressive') {
    this.personality = personality;
    this.generatePatrolPoints();
  }

  /**
   * Generate patrol points around spawn location
   */
  private generatePatrolPoints() {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = 10 + Math.random() * 15;
      this.patrolPoints.push(new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      ));
    }
  }

  /**
   * Main AI decision-making system
   * Returns the optimal decision based on current context
   */
  public makeDecision(context: AIBehaviorContext, deltaTime: number): AIDecision {
    const currentTime = Date.now();
    this.stateTimer += deltaTime;

    // Update alert level
    this.updateAlertLevel(context, deltaTime);

    // Only make new decisions at intervals to simulate "thinking time"
    if (currentTime - this.lastDecisionTime < this.decisionCooldown) {
      return this.executCurrentState(context);
    }

    this.lastDecisionTime = currentTime;

    // Store last known player position if we can see them
    if (context.canSeePlayer) {
      this.lastKnownPlayerPosition.copy(context.playerPosition);
      this.investigatePosition = null;
    }

    // === BEHAVIOR TREE EVALUATION ===
    // Priority-based decision making

    const decisions: AIDecision[] = [];

    // 1. RETREAT - Low health
    if (context.health < context.maxHealth * 0.25 && this.personality !== 'aggressive') {
      decisions.push(this.evaluateRetreat(context));
    }

    // 2. ATTACK - Close range and can see player
    if (context.canSeePlayer && context.distanceToPlayer < 5) {
      decisions.push(this.evaluateAttack(context));
    }

    // 3. HUNT - Can see player or heard shooting
    if (context.canSeePlayer || context.hearPlayerShooting || this.alertLevel > 50) {
      decisions.push(this.evaluateHunt(context));
    }

    // 4. COORDINATE - Multiple enemies nearby
    if (context.allEnemies.length > 2 && context.distanceToPlayer < 40) {
      decisions.push(this.evaluateCoordinate(context));
    }

    // 5. INVESTIGATE - Heard something but can't see player
    if (!context.canSeePlayer && this.investigatePosition) {
      decisions.push(this.evaluateInvestigate(context));
    }

    // 6. PATROL - Default behavior
    decisions.push(this.evaluatePatrol(context));

    // Select highest priority decision
    decisions.sort((a, b) => b.priority - a.priority);
    const bestDecision = decisions[0];

    this.currentState = bestDecision.state;
    this.stateTimer = 0;

    return bestDecision;
  }

  /**
   * Update alert level based on context
   */
  private updateAlertLevel(context: AIBehaviorContext, deltaTime: number) {
    if (context.canSeePlayer) {
      this.alertLevel = Math.min(100, this.alertLevel + deltaTime * 50);
    } else if (context.hearPlayerShooting) {
      this.alertLevel = Math.min(100, this.alertLevel + deltaTime * 30);
    } else {
      // Alert level decays slowly
      this.alertLevel = Math.max(0, this.alertLevel - deltaTime * 5);
    }
  }

  /**
   * Execute current state without changing it
   */
  private executCurrentState(context: AIBehaviorContext): AIDecision {
    switch (this.currentState) {
      case 'attack':
        return this.evaluateAttack(context);
      case 'hunt':
        return this.evaluateHunt(context);
      case 'retreat':
        return this.evaluateRetreat(context);
      case 'coordinate':
        return this.evaluateCoordinate(context);
      case 'patrol':
        return this.evaluatePatrol(context);
      default:
        return this.evaluatePatrol(context);
    }
  }

  /**
   * ATTACK STATE: Aggressive close-range engagement
   */
  private evaluateAttack(context: AIBehaviorContext): AIDecision {
    const priority = 100; // Highest priority when in range

    // Predict where player will be
    const predictedPosition = context.playerPosition.clone()
      .add(context.playerVelocity.clone().multiplyScalar(0.3));

    // Move to intercept position
    const attackRange = 3.0; // Optimal attack range
    const direction = new THREE.Vector3()
      .subVectors(predictedPosition, context.enemyPosition)
      .normalize();

    const targetPosition = predictedPosition.clone()
      .sub(direction.clone().multiplyScalar(attackRange));

    return {
      state: 'attack',
      targetPosition,
      shouldAttack: context.distanceToPlayer <= attackRange + 0.5,
      moveSpeed: this.personality === 'aggressive' ? 1.5 : 1.2,
      priority
    };
  }

  /**
   * HUNT STATE: Actively pursue player
   */
  private evaluateHunt(context: AIBehaviorContext): AIDecision {
    const priority = 80;

    // Use predictive movement
    const predictAhead = Math.min(context.distanceToPlayer * 0.05, 2.0);
    const predictedPosition = context.playerPosition.clone()
      .add(context.playerVelocity.clone().multiplyScalar(predictAhead));

    // Choose hunting behavior based on personality and type
    let targetPosition = predictedPosition.clone();
    let moveSpeed = 1.0;

    if (this.personality === 'tactical' || context.type === 'fast') {
      // Flanking approach
      const angle = Math.atan2(
        context.playerPosition.z - context.enemyPosition.z,
        context.playerPosition.x - context.enemyPosition.x
      );
      const flankAngle = angle + (Math.random() > 0.5 ? Math.PI / 3 : -Math.PI / 3);
      const flankDistance = 15;

      targetPosition = context.playerPosition.clone().add(
        new THREE.Vector3(
          Math.cos(flankAngle) * flankDistance,
          0,
          Math.sin(flankAngle) * flankDistance
        )
      );
      moveSpeed = 1.3;
    } else if (this.personality === 'aggressive' || context.type === 'tank') {
      // Direct charge
      targetPosition = predictedPosition;
      moveSpeed = 1.2;
    }

    return {
      state: 'hunt',
      targetPosition,
      shouldAttack: false,
      moveSpeed,
      priority
    };
  }

  /**
   * RETREAT STATE: Pull back to safety
   */
  private evaluateRetreat(context: AIBehaviorContext): AIDecision {
    const priority = context.health < context.maxHealth * 0.15 ? 95 : 70;

    // Retreat away from player
    const retreatDirection = new THREE.Vector3()
      .subVectors(context.enemyPosition, context.playerPosition)
      .normalize();

    const retreatDistance = 25;
    const targetPosition = context.enemyPosition.clone()
      .add(retreatDirection.multiplyScalar(retreatDistance));

    return {
      state: 'retreat',
      targetPosition,
      shouldAttack: false,
      moveSpeed: 1.5, // Retreat fast
      priority
    };
  }

  /**
   * COORDINATE STATE: Work with other enemies for tactical advantage
   */
  private evaluateCoordinate(context: AIBehaviorContext): AIDecision {
    const priority = 60;

    // Find nearby enemies
    const nearbyEnemies = context.allEnemies.filter(e =>
      !e.dead && e.mesh.position.distanceTo(context.enemyPosition) < 30
    );

    if (nearbyEnemies.length < 2) {
      // Not enough allies, fall back to hunt
      return this.evaluateHunt(context);
    }

    // Determine role in coordinated attack
    const enemyIndex = nearbyEnemies.findIndex(e =>
      e.mesh.position.equals(context.enemyPosition)
    );

    const totalEnemies = nearbyEnemies.length;
    const angleOffset = (Math.PI * 2 * enemyIndex) / totalEnemies;
    const angle = Math.atan2(
      context.playerPosition.z - context.enemyPosition.z,
      context.playerPosition.x - context.enemyPosition.x
    ) + angleOffset;

    const surroundDistance = 12;
    const targetPosition = context.playerPosition.clone().add(
      new THREE.Vector3(
        Math.cos(angle) * surroundDistance,
        0,
        Math.sin(angle) * surroundDistance
      )
    );

    return {
      state: 'coordinate',
      targetPosition,
      shouldAttack: context.distanceToPlayer < 4,
      moveSpeed: 1.1,
      priority
    };
  }

  /**
   * INVESTIGATE STATE: Check out suspicious activity
   */
  private evaluateInvestigate(context: AIBehaviorContext): AIDecision {
    const priority = 50;

    const targetPosition = this.investigatePosition || this.lastKnownPlayerPosition;

    // If we reached investigation point and still no player, go back to patrol
    const distanceToInvestigate = context.enemyPosition.distanceTo(targetPosition);
    if (distanceToInvestigate < 3) {
      this.investigatePosition = null;
      return this.evaluatePatrol(context);
    }

    return {
      state: 'hunt', // Use hunt behavior for investigation
      targetPosition,
      shouldAttack: false,
      moveSpeed: 0.8,
      priority
    };
  }

  /**
   * PATROL STATE: Default idle behavior
   */
  private evaluatePatrol(context: AIBehaviorContext): AIDecision {
    const priority = 10; // Lowest priority

    // Get current patrol point
    const currentPoint = this.patrolPoints[this.currentPatrolIndex];
    const worldPatrolPoint = currentPoint.clone().add(context.enemyPosition);

    // Check if reached patrol point
    if (context.enemyPosition.distanceTo(worldPatrolPoint) < 3) {
      this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
    }

    return {
      state: 'patrol',
      targetPosition: worldPatrolPoint,
      shouldAttack: false,
      moveSpeed: 0.5,
      priority
    };
  }

  /**
   * Notify AI of player shooting nearby
   */
  public notifyPlayerShooting(shotPosition: THREE.Vector3, enemyPosition: THREE.Vector3) {
    const distance = shotPosition.distanceTo(enemyPosition);
    if (distance < 40) {
      this.investigatePosition = shotPosition.clone();
      this.alertLevel = Math.min(100, this.alertLevel + 30);
    }
  }

  /**
   * Get current AI state for debugging
   */
  public getCurrentState(): AIState {
    return this.currentState;
  }

  /**
   * Get alert level for UI/debugging
   */
  public getAlertLevel(): number {
    return this.alertLevel;
  }

  /**
   * Reset AI state (useful for respawning)
   */
  public reset() {
    this.currentState = 'idle';
    this.stateTimer = 0;
    this.alertLevel = 0;
    this.investigatePosition = null;
  }
}
