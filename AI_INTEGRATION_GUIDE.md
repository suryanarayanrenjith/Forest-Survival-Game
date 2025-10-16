# ADVANCED ENEMY AI SYSTEM - Integration Guide

## Summary

I've created a completely redesigned, sophisticated enemy AI system to fix the critical flaws in your game. The current system has enemies that don't properly hit the player due to frame-timing issues and lack of intelligent behavior.

## Critical Flaws Fixed

### 1. **Attack Hit Detection - CRITICAL BUG**
**Problem:** Damage only dealt in 40ms window (45-55% of animation), easily missed
**Solution:** New `AttackSystem.ts` uses sphere-based collision detection during entire strike phase

### 2. **Dead Zone Problem**
**Problem:** Enemies stop at 2.5 units but attack range is 3.5 units = can't hit player
**Solution:** New attack system has proper range management and movement-during-attack

### 3. **No Real Intelligence**
**Problem:** Enemies just run straight at player, no tactics
**Solution:** New `AIBehaviorSystem.ts` with state machine (Patrol, Hunt, Attack, Retreat, Coordinate)

### 4. **No Perception**
**Problem:** Enemies "see" through walls, no realistic awareness
**Solution:** New `EnemyPerception.ts` with vision cones, line-of-sight raycasting, hearing

## New AI Modules Created

### 1. `/src/utils/AIBehaviorSystem.ts`
- **State Machine**: idle, patrol, hunt, attack, retreat, coordinate, ambush
- **Behavior Tree**: Priority-based decision making
- **Predictive Movement**: Leads player movement for interception
- **Group Coordination**: Enemies work together to surround player
- **Personalities**: aggressive, tactical, defensive, support

### 2. `/src/utils/EnemyPerception.ts`
- **Vision System**: 90-degree cone, 50-unit range, blocked by terrain
- **Hearing System**: Detects gunshots and player movement
- **Threat Assessment**: 0-100 threat level based on all inputs
- **Memory**: Remembers last seen position, investigates sounds

### 3. `/src/utils/AttackSystem.ts`
- **Guaranteed Hits**: Sphere collision during strike phase, not frame-timing
- **Attack Phases**: windup → strike → recovery
- **Proper Cooldowns**: Per enemy type (fast: 800ms, normal: 1000ms, tank: 1500ms, boss: 1200ms)
- **Animation Integration**: Returns arm/torso rotations for smooth animations

### 4. `/src/types/game.ts` (Updated)
- Added imports for new AI systems
- Added optional properties to Enemy interface:
  - `aiBehavior?: AIBehaviorSystem`
  - `perception?: EnemyPerception`
  - `attackSystem?: AttackSystem`
  - `playerVelocity?: THREE.Vector3`

## Integration Steps

You need to make the following changes to [App.tsx](App.tsx):

### Step 1: Import New AI Systems
Add to top of App.tsx (after line 14):
```typescript
import { AIBehaviorSystem } from './utils/AIBehaviorSystem';
import { EnemyPerception } from './utils/EnemyPerception';
import { AttackSystem } from './utils/AttackSystem';
```

### Step 2: Add Player Velocity Tracking
After line 628 (after `let lastDamageTaken = 0;`), add:
```typescript
// Track player velocity for AI prediction
let playerVelocity = new THREE.Vector3(0, 0, 0);
let lastPlayerPosition = new THREE.Vector3(0, 5, 10);
```

### Step 3: Update createEnemy Function
Replace the return statement in createEnemy (lines 791-831) with this enhanced version:

```typescript
      // Determine AI personality based on type
      let personality: 'aggressive' | 'tactical' | 'defensive' | 'support' = 'aggressive';
      if (type === 'fast') personality = 'tactical';
      else if (type === 'tank') personality = 'defensive';
      else if (type === 'boss') personality = 'aggressive';

      // Create AI systems
      const aiBehavior = new AIBehaviorSystem(personality);
      const perception = new EnemyPerception(
        type === 'boss' ? 60 : type === 'fast' ? 55 : 50, // Vision range
        type === 'boss' ? Math.PI * 0.75 : Math.PI / 2, // Vision angle
        type === 'boss' ? 50 : 40, // Hearing range
        1.0 // Hearing sensitivity
      );
      const attackSystem = new AttackSystem(
        AttackSystem.createConfigForType(type, enemyDamage * diffSettings.damageMult)
      );

      return {
        mesh: enemyGroup,
        health: enemyHealth * diffSettings.healthMult * healthMultiplier,
        maxHealth: enemyHealth * diffSettings.healthMult * healthMultiplier,
        speed: (enemySpeed + Math.random() * 0.02) * diffSettings.speedMult,
        dead: false,
        type,
        damage: enemyDamage * diffSettings.damageMult,
        scoreValue: enemyScore,
        // Animation state
        walkTime: Math.random() * Math.PI * 2,
        damageFlashTime: 0,
        deathTime: 0,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        torso,
        // AI state - prevent clumping
        targetPosition: new THREE.Vector3(x, 0, z),
        spreadOffset: new THREE.Vector2(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ),
        lastPathUpdate: 0,
        stuckTimer: 0,
        lastPosition: new THREE.Vector3(x, 0, z),
        behaviorState: 'chase',
        aggroRange: 50 + Math.random() * 20,
        // Advanced AI - scales with wave
        dodgeSkill: dodgeSkill,
        reactionTime: reactionTime,
        lastDodgeTime: 0,
        dodgeCooldown: 1000 / (1 + wave * 0.1),
        detectedBullets: new Set(),
        // Attack animation
        isAttacking: false,
        attackTime: 0,
        attackCooldown: type === 'fast' ? 800 : type === 'boss' ? 1500 : 1000,
        lastAttackTime: 0,
        // NEW: Advanced AI Systems
        aiBehavior,
        perception,
        attackSystem,
        playerVelocity: new THREE.Vector3(0, 0, 0)
      };
```

### Step 4: Update Player Velocity Tracking in Animation Loop
In the animate() function, after the movement section (around line 1389), add:

```typescript
      // Track player velocity for AI prediction
      playerVelocity.subVectors(camera.position, lastPlayerPosition).divideScalar(delta);
      lastPlayerPosition.copy(camera.position);
```

### Step 5: Notify AI of Gunshots
In the `shoot()` function (around line 1116), after creating the muzzle flash, add:

```typescript
        // Notify all enemies about gunshot
        for (const enemy of enemies) {
          if (!enemy.dead && enemy.perception) {
            enemy.perception.registerSound(camera.position.clone(), 1.0);
          }
        }
```

### Step 6: REPLACE Enemy AI Update Loop
**THIS IS THE MOST IMPORTANT CHANGE**

Replace the ENTIRE enemy AI update section (lines 1571-1920 in the current code) with this new implementation:

```typescript
      // === NEW ADVANCED AI SYSTEM ===
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Death animation (unchanged)
        if (enemy.dead && enemy.deathTime > 0) {
          enemy.deathTime -= delta;
          const deathProgress = 1.0 - (enemy.deathTime / 1.0);

          enemy.mesh.rotation.x = deathProgress * Math.PI / 2;
          enemy.mesh.position.y = 1.5 - deathProgress * 1.5;

          if (enemy.leftArm) {
            enemy.leftArm.rotation.z = deathProgress * Math.PI / 3;
            enemy.leftArm.rotation.x = deathProgress * Math.PI / 4;
          }
          if (enemy.rightArm) {
            enemy.rightArm.rotation.z = -deathProgress * Math.PI / 3;
            enemy.rightArm.rotation.x = deathProgress * Math.PI / 4;
          }
          if (enemy.leftLeg) {
            enemy.leftLeg.rotation.x = deathProgress * Math.PI / 6;
          }
          if (enemy.rightLeg) {
            enemy.rightLeg.rotation.x = -deathProgress * Math.PI / 6;
          }

          enemy.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
              child.material.opacity = 1.0 - deathProgress;
              child.material.transparent = true;
            }
          });

          if (enemy.deathTime <= 0) {
            scene.remove(enemy.mesh);
            enemies.splice(i, 1);
          }
          continue;
        }

        if (enemy.dead) continue;

        // Health regeneration
        if (diffSettings.regenRate > 0 && enemy.health < enemy.maxHealth) {
          enemy.health = Math.min(enemy.maxHealth, enemy.health + diffSettings.regenRate * delta * 10);
        }

        // === PERCEPTION SYSTEM ===
        const perception = enemy.perception?.perceive(
          enemy.mesh.position,
          enemy.mesh.rotation.y,
          camera.position,
          playerVelocity,
          terrainObjects,
          timeOfDay === 'night'
        );

        const canSeePlayer = perception?.canSeePlayer || false;
        const canHearPlayer = perception?.canHearPlayer || false;
        const distance = enemy.mesh.position.distanceTo(camera.position);

        // === AI DECISION MAKING ===
        if (enemy.aiBehavior && perception) {
          const aiDecision = enemy.aiBehavior.makeDecision({
            enemyPosition: enemy.mesh.position,
            enemyRotation: enemy.mesh.rotation.y,
            playerPosition: camera.position,
            playerVelocity: playerVelocity,
            distanceToPlayer: distance,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            type: enemy.type,
            allEnemies: enemies,
            terrainObjects: terrainObjects,
            canSeePlayer,
            hearPlayerShooting: canHearPlayer,
            timeSinceLastSawPlayer: perception.timeSinceLastSeen,
            isInCover: false
          }, delta);

          // Update target position from AI decision
          enemy.targetPosition.copy(aiDecision.targetPosition);

          // === MOVEMENT ===
          const isMoving = distance > 2.0 && (!enemy.attackSystem || enemy.attackSystem.canMove());

          if (isMoving) {
            enemy.walkTime += delta * 8;

            // Leg animation
            if (enemy.leftLeg && enemy.rightLeg) {
              enemy.leftLeg.rotation.x = Math.sin(enemy.walkTime) * 0.5;
              enemy.rightLeg.rotation.x = Math.sin(enemy.walkTime + Math.PI) * 0.5;
            }

            // Movement direction
            const moveDirX = enemy.targetPosition.x - enemy.mesh.position.x;
            const moveDirZ = enemy.targetPosition.z - enemy.mesh.position.z;
            const moveLength = Math.sqrt(moveDirX * moveDirX + moveDirZ * moveDirZ);

            if (moveLength > 0) {
              const normalizedX = moveDirX / moveLength;
              const normalizedZ = moveDirZ / moveLength;

              const newX = enemy.mesh.position.x + normalizedX * enemy.speed * aiDecision.moveSpeed;
              const newZ = enemy.mesh.position.z + normalizedZ * enemy.speed * aiDecision.moveSpeed;

              if (!checkTerrainCollision(newX, newZ)) {
                enemy.mesh.position.x = newX;
                enemy.mesh.position.z = newZ;
              }

              // Look at player
              const dx = camera.position.x - enemy.mesh.position.x;
              const dz = camera.position.z - enemy.mesh.position.z;
              enemy.mesh.rotation.y = THREE.MathUtils.lerp(
                enemy.mesh.rotation.y,
                Math.atan2(dx, dz),
                0.1
              );
            }
          } else {
            // Reset to idle
            if (enemy.leftLeg) enemy.leftLeg.rotation.x *= 0.9;
            if (enemy.rightLeg) enemy.rightLeg.rotation.x *= 0.9;
          }
        }

        // === ATTACK SYSTEM ===
        if (enemy.attackSystem) {
          enemy.attackSystem.update(delta);

          // Try to attack if in range and AI decided to attack
          const shouldAttack = distance < 4.0;
          if (shouldAttack) {
            const attackStarted = enemy.attackSystem.tryAttack(
              enemy.mesh.position,
              camera.position
            );

            if (attackStarted) {
              enemy.isAttacking = true;
            }
          }

          // Check for hit
          const hitPlayer = enemy.attackSystem.checkHit(
            enemy.mesh.position,
            enemy.mesh.rotation.y,
            camera.position
          );

          if (hitPlayer) {
            const damage = enemy.attackSystem.getDamage();
            health -= damage;
            soundManager.play('playerHurt', 0.5);
            cameraShakeIntensity = Math.min(cameraShakeIntensity + 0.2, 0.25);

            if (combo > 0) {
              combo = Math.max(0, combo - 1);
            }

            updateGameState();

            // Game over check
            if (health <= 0) {
              health = 0;
              isGameOver = true;
              updateGameState();
              document.exitPointerLock();
            }
          }

          // Update arm animations from attack system
          const armRotations = enemy.attackSystem.getArmRotation();
          if (enemy.leftArm && enemy.rightArm) {
            if (enemy.attackSystem.getAttackState().isAttacking) {
              enemy.leftArm.rotation.x = armRotations.left;
              enemy.rightArm.rotation.x = armRotations.right;

              if (enemy.torso) {
                enemy.torso.rotation.x = enemy.attackSystem.getTorsoRotation();
              }
            } else {
              // Idle arm animation
              enemy.leftArm.rotation.x = Math.sin(enemy.walkTime + Math.PI) * 0.3;
              enemy.rightArm.rotation.x = Math.sin(enemy.walkTime) * 0.3;

              if (enemy.torso) {
                enemy.torso.position.y = 0.2 + Math.sin(enemy.walkTime * 2) * 0.05;
                enemy.torso.rotation.x *= 0.9;
              }
            }
          }
        }

        // Damage flash animation
        if (enemy.damageFlashTime > 0) {
          enemy.damageFlashTime -= delta;
          const flashIntensity = Math.max(0, enemy.damageFlashTime);

          if (enemy.torso && enemy.torso.material instanceof THREE.MeshLambertMaterial) {
            enemy.torso.material.emissiveIntensity = 0.2 + flashIntensity * 2;
          }
        }
      }
```

## Key Improvements

### 1. **Guaranteed Attack Hits**
- Old: 40ms timing window, easily missed
- New: Sphere collision during entire strike phase (120ms+)

### 2. **Intelligent Behavior**
- Old: Run straight at player
- New: Hunt → Flank → Attack → Retreat based on situation
- Enemies surround player in groups
- Tactical positioning based on enemy type

### 3. **Realistic Perception**
- Old: Always knows where player is
- New: Vision cones, blocked by terrain, investigates sounds
- Enemies search for player if line of sight breaks

### 4. **Predictive Combat**
- Old: Chase current position
- New: Intercepts where player will be based on velocity

### 5. **Type-Specific Tactics**
- **Fast**: Flanking, hit-and-run (800ms attack cooldown)
- **Normal**: Direct assault (1000ms cooldown)
- **Tank**: Blocking, heavy damage (1500ms cooldown)
- **Boss**: Tactical positioning, coordinated attacks (1200ms cooldown)

## Testing Checklist

After integration:
- [ ] Enemies actually hit the player consistently
- [ ] Enemies search for player when you hide behind trees
- [ ] Fast enemies flank from sides
- [ ] Multiple enemies surround you
- [ ] Tank enemies block your escape
- [ ] Boss enemies maintain optimal distance
- [ ] Enemies react to gunshots
- [ ] Health decreases when enemies attack
- [ ] No more "running over player" without dealing damage

## Performance Notes

- Perception checks run every 200ms (not every frame)
- AI decisions update at 5 FPS (200ms intervals)
- Attack collision is simple sphere check (very fast)
- No additional rendering overhead

## Difficulty Scaling

The new AI respects all existing difficulty multipliers:
- `healthMult`: Enemy health scales
- `damageMult`: Attack damage scales
- `speedMult`: Movement speed scales
- Wave progression: Vision, reaction time, coordination improve

## Summary

You now have an AI system that functions almost like a real AI model - it perceives, thinks, decides, and acts based on context. The enemies will finally pose a real threat and provide dynamic, challenging gameplay.

**The most critical fix**: Enemies will now ACTUALLY HIT THE PLAYER instead of just running past them!
