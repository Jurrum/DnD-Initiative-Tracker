/**
 * Encounter Unit Tests
 */

describe('Encounter', () => {
  let encounter;

  beforeEach(() => {
    encounter = new Encounter('Test Battle');
  });

  describe('constructor', () => {
    test('should create encounter with name', () => {
      expect(encounter.name).toBe('Test Battle');
    });

    test('should generate unique ID', () => {
      const enc2 = new Encounter('Another');
      expect(encounter.id).not.toBe(enc2.id);
    });

    test('should initialize with empty players', () => {
      expect(encounter.players).toEqual([]);
    });

    test('should initialize Initiative instance', () => {
      expect(encounter.initiative).toBeInstanceOf(Initiative);
    });
  });

  describe('Player Management', () => {
    test('addPlayer should add player to encounter', () => {
      const player = encounter.addPlayer('Fighter', 50, 18, 2, 'player');

      expect(player.name).toBe('Fighter');
      expect(encounter.players.length).toBe(1);
    });

    test('addPlayer should add to initiative', () => {
      encounter.addPlayer('Fighter', 50, 18, 2, 'player');
      expect(encounter.initiative.players.length).toBe(1);
    });

    test('removePlayer should remove player', () => {
      const player = encounter.addPlayer('Fighter', 50, 18);
      const result = encounter.removePlayer(player.id);

      expect(result).toBe(true);
      expect(encounter.players.length).toBe(0);
    });

    test('removePlayer should return false for unknown player', () => {
      expect(encounter.removePlayer('unknown')).toBe(false);
    });

    test('getPlayer should return player by ID', () => {
      const player = encounter.addPlayer('Fighter', 50, 18);
      expect(encounter.getPlayer(player.id)).toBe(player);
    });

    test('getAllPlayers should return copy of players', () => {
      encounter.addPlayer('Fighter', 50, 18);
      const players = encounter.getAllPlayers();
      players.push(new Player('Fake', 1, 1));
      expect(encounter.players.length).toBe(1);
    });

    test('getPlayersByType should filter by type', () => {
      encounter.addPlayer('Fighter', 50, 18, 0, 'player');
      encounter.addPlayer('Goblin', 20, 13, 0, 'monster');

      const players = encounter.getPlayersByType('player');
      const monsters = encounter.getPlayersByType('monster');

      expect(players.length).toBe(1);
      expect(monsters.length).toBe(1);
    });
  });

  describe('Encounter Control', () => {
    beforeEach(() => {
      encounter.addPlayer('Fighter', 50, 18, 2);
      encounter.addPlayer('Wizard', 30, 12, 4);
    });

    test('startEncounter should activate and roll initiative', () => {
      const result = encounter.startEncounter();

      expect(result.success).toBe(true);
      expect(encounter.isActive).toBe(true);
      expect(encounter.initiative.isActive).toBe(true);
    });

    test('startEncounter should fail with no players', () => {
      const emptyEncounter = new Encounter('Empty');
      const result = emptyEncounter.startEncounter();

      expect(result.success).toBe(false);
    });

    test('endEncounter should deactivate', () => {
      encounter.startEncounter();
      const result = encounter.endEncounter();

      expect(result.success).toBe(true);
      expect(encounter.isActive).toBe(false);
    });
  });

  describe('Turn Management', () => {
    beforeEach(() => {
      encounter.addPlayer('Fighter', 50, 18, 2);
      encounter.addPlayer('Wizard', 30, 12, 4);
      encounter.startEncounter();
    });

    test('nextTurn should advance turn', () => {
      const result = encounter.nextTurn();

      expect(result.success).toBe(true);
      expect(result.currentPlayer).toBeDefined();
    });

    test('nextTurn should fail when not active', () => {
      encounter.endEncounter();
      const result = encounter.nextTurn();

      expect(result.success).toBe(false);
    });

    test('previousTurn should go back', () => {
      encounter.nextTurn();
      const result = encounter.previousTurn();

      expect(result.success).toBe(true);
    });

    test('getCurrentPlayer should return current player', () => {
      const current = encounter.getCurrentPlayer();
      expect(current).toBeDefined();
    });

    test('getCurrentRound should return round number', () => {
      expect(encounter.getCurrentRound()).toBe(1);
    });
  });

  describe('Combat Actions', () => {
    let fighter;

    beforeEach(() => {
      fighter = encounter.addPlayer('Fighter', 50, 18);
    });

    test('dealDamage should reduce player HP', () => {
      const result = encounter.dealDamage(fighter.id, 10);

      expect(result.success).toBe(true);
      expect(result.newHp).toBe(40);
    });

    test('dealDamage should return failure for unknown player', () => {
      const result = encounter.dealDamage('unknown', 10);
      expect(result.success).toBe(false);
    });

    test('healPlayer should increase player HP', () => {
      encounter.dealDamage(fighter.id, 20);
      const result = encounter.healPlayer(fighter.id, 10);

      expect(result.success).toBe(true);
      expect(result.newHp).toBe(40);
    });

    test('addCondition should add condition to player', () => {
      const result = encounter.addCondition(fighter.id, 'poisoned', 3);

      expect(result.success).toBe(true);
      expect(fighter.hasCondition('poisoned')).toBe(true);
    });

    test('removeCondition should remove condition', () => {
      encounter.addCondition(fighter.id, 'poisoned');
      const result = encounter.removeCondition(fighter.id, 'poisoned');

      expect(result.success).toBe(true);
      expect(fighter.hasCondition('poisoned')).toBe(false);
    });
  });

  describe('Conditions', () => {
    test('getAllConditions should aggregate all conditions', () => {
      const fighter = encounter.addPlayer('Fighter', 50, 18);
      const wizard = encounter.addPlayer('Wizard', 30, 12);

      encounter.addCondition(fighter.id, 'poisoned');
      encounter.addCondition(wizard.id, 'stunned');

      const conditions = encounter.getAllConditions();

      expect(conditions.length).toBe(2);
      expect(conditions[0].playerName).toBeDefined();
      expect(conditions[0].playerId).toBeDefined();
    });
  });

  describe('Statistics', () => {
    test('getEncounterStats should return stats', () => {
      encounter.addPlayer('Fighter', 50, 18, 0, 'player');
      encounter.addPlayer('Goblin', 20, 13, 0, 'monster');

      const stats = encounter.getEncounterStats();

      expect(stats.totalPlayers).toBe(2);
      expect(stats.playerTypes.player).toBe(1);
      expect(stats.playerTypes.monster).toBe(1);
    });
  });

  describe('Reset and Clone', () => {
    beforeEach(() => {
      encounter.addPlayer('Fighter', 50, 18);
      encounter.dealDamage(encounter.players[0].id, 20);
      encounter.addCondition(encounter.players[0].id, 'poisoned');
    });

    test('reset should restore all players', () => {
      encounter.reset();
      const player = encounter.players[0];

      expect(player.currentHp).toBe(player.maxHp);
      expect(player.isAlive).toBe(true);
      expect(player.conditions.length).toBe(0);
    });

    test('clone should create copy', () => {
      const clone = encounter.clone();

      expect(clone.id).not.toBe(encounter.id);
      expect(clone.name).toBe('Test Battle (Copy)');
      expect(clone.players.length).toBe(1);
    });

    test('clone should have independent players', () => {
      const clone = encounter.clone();
      clone.players[0].name = 'Modified';

      expect(encounter.players[0].name).toBe('Fighter');
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      encounter.addPlayer('Fighter', 50, 18);
      encounter.description = 'A test battle';
      encounter.difficulty = 'hard';
    });

    test('toJSON should serialize encounter', () => {
      const json = encounter.toJSON();

      expect(json.name).toBe('Test Battle');
      expect(json.players.length).toBe(1);
      expect(json.description).toBe('A test battle');
      expect(json.difficulty).toBe('hard');
    });

    test('fromJSON should restore encounter', () => {
      const json = encounter.toJSON();
      const restored = Encounter.fromJSON(json);

      expect(restored.name).toBe(encounter.name);
      expect(restored.players.length).toBe(encounter.players.length);
      expect(restored.description).toBe(encounter.description);
    });
  });
});
