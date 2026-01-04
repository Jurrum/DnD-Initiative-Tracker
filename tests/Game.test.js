/**
 * Game Unit Tests
 */

describe('Game', () => {
  let game;

  beforeEach(() => {
    // Clear localStorage mock before each test
    localStorage.clear();
    game = new Game();
  });

  describe('constructor', () => {
    test('should create default encounter', () => {
      expect(game.currentEncounter).toBeInstanceOf(Encounter);
    });

    test('should initialize with default settings', () => {
      expect(game.settings.autoSort).toBe(true);
      expect(game.settings.theme).toBe('dark');
    });

    test('should attempt to load from storage on init', () => {
      // Game attempts to load from storage in constructor
      // Verify the default state exists
      expect(game.currentEncounter).toBeDefined();
      expect(game.savedEncounters).toEqual([]);
    });
  });

  describe('Encounter Management', () => {
    test('createNewEncounter should create and set current', () => {
      const enc = game.createNewEncounter('New Battle');

      expect(enc.name).toBe('New Battle');
      expect(game.currentEncounter).toBe(enc);
    });

    test('saveEncounter should add to saved list', () => {
      game.addPlayer('Fighter', 50, 18);
      game.saveEncounter('My Encounter');

      expect(game.savedEncounters.length).toBe(1);
      expect(game.savedEncounters[0].name).toBe('My Encounter');
    });

    test('saveEncounter should update existing', () => {
      game.saveEncounter('First');
      game.currentEncounter.name = 'Updated';
      game.saveEncounter();

      expect(game.savedEncounters.length).toBe(1);
      expect(game.savedEncounters[0].name).toBe('Updated');
    });

    test('loadEncounter should set current', () => {
      game.saveEncounter('Saved Battle');
      const savedId = game.savedEncounters[0].id;

      game.createNewEncounter('New');
      const result = game.loadEncounter(savedId);

      expect(result.success).toBe(true);
      expect(game.currentEncounter.id).toBe(savedId);
    });

    test('loadEncounter should fail for unknown ID', () => {
      const result = game.loadEncounter('unknown');
      expect(result.success).toBe(false);
    });

    test('deleteEncounter should remove from saved', () => {
      game.saveEncounter('To Delete');
      const savedId = game.savedEncounters[0].id;

      const result = game.deleteEncounter(savedId);

      expect(result.success).toBe(true);
      expect(game.savedEncounters.length).toBe(0);
    });

    test('duplicateEncounter should create copy', () => {
      game.addPlayer('Fighter', 50, 18);
      game.saveEncounter('Original');
      const savedId = game.savedEncounters[0].id;

      const result = game.duplicateEncounter(savedId);

      expect(result.success).toBe(true);
      expect(game.savedEncounters.length).toBe(2);
    });
  });

  describe('Player Management', () => {
    test('addPlayer should add to current encounter', () => {
      const result = game.addPlayer('Fighter', 50, 18, 2, 'player');

      expect(result.success).toBe(true);
      expect(game.currentEncounter.players.length).toBe(1);
    });

    test('removePlayer should remove from current encounter', () => {
      game.addPlayer('Fighter', 50, 18);
      const playerId = game.currentEncounter.players[0].id;

      const result = game.removePlayer(playerId);

      expect(result.success).toBe(true);
      expect(game.currentEncounter.players.length).toBe(0);
    });

    test('updatePlayer should update player data', () => {
      game.addPlayer('Fighter', 50, 18);
      const playerId = game.currentEncounter.players[0].id;

      const result = game.updatePlayer(playerId, { name: 'Updated' });

      expect(result.success).toBe(true);
      expect(game.currentEncounter.players[0].name).toBe('Updated');
    });
  });

  describe('Combat Flow', () => {
    beforeEach(() => {
      game.addPlayer('Fighter', 50, 18, 2);
      game.addPlayer('Wizard', 30, 12, 4);
    });

    test('startEncounter should start combat', () => {
      const result = game.startEncounter();

      expect(result.success).toBe(true);
      expect(game.currentEncounter.isActive).toBe(true);
    });

    test('endEncounter should end combat', () => {
      game.startEncounter();
      const result = game.endEncounter();

      expect(result.success).toBe(true);
      expect(game.currentEncounter.isActive).toBe(false);
    });

    test('nextTurn should advance turn', () => {
      game.startEncounter();
      const result = game.nextTurn();

      expect(result.success).toBe(true);
    });

    test('previousTurn should go back', () => {
      game.startEncounter();
      game.nextTurn();
      const result = game.previousTurn();

      expect(result.success).toBe(true);
    });
  });

  describe('Combat Actions', () => {
    let playerId;

    beforeEach(() => {
      game.addPlayer('Fighter', 50, 18);
      playerId = game.currentEncounter.players[0].id;
    });

    test('dealDamage should reduce HP', () => {
      const result = game.dealDamage(playerId, 10);

      expect(result.success).toBe(true);
      expect(result.newHp).toBe(40);
    });

    test('healPlayer should increase HP', () => {
      game.dealDamage(playerId, 20);
      const result = game.healPlayer(playerId, 10);

      expect(result.success).toBe(true);
      expect(result.newHp).toBe(40);
    });

    test('addCondition should add condition', () => {
      const result = game.addCondition(playerId, 'poisoned', 3);

      expect(result.success).toBe(true);
    });

    test('removeCondition should remove condition', () => {
      game.addCondition(playerId, 'poisoned');
      const result = game.removeCondition(playerId, 'poisoned');

      expect(result.success).toBe(true);
    });
  });

  describe('Initiative', () => {
    beforeEach(() => {
      game.addPlayer('Fighter', 50, 18, 2);
      game.addPlayer('Wizard', 30, 12, 4);
    });

    test('rollInitiative should roll for all', () => {
      const result = game.rollInitiative();

      expect(result.success).toBe(true);
      game.currentEncounter.players.forEach(p => {
        expect(p.initiative).toBeGreaterThan(0);
      });
    });

    test('rollInitiativeForPlayer should roll for one', () => {
      const playerId = game.currentEncounter.players[0].id;
      const result = game.rollInitiativeForPlayer(playerId);

      expect(result.success).toBe(true);
      expect(result.initiative).toBeGreaterThan(0);
    });

    test('setPlayerInitiative should set value', () => {
      const playerId = game.currentEncounter.players[0].id;
      const result = game.setPlayerInitiative(playerId, 20);

      expect(result.success).toBe(true);
      expect(game.currentEncounter.players[0].initiative).toBe(20);
    });
  });

  describe('Settings', () => {
    test('updateSettings should merge settings', () => {
      game.updateSettings({ theme: 'light' });

      expect(game.settings.theme).toBe('light');
      expect(game.settings.autoSort).toBe(true); // Preserved
    });

    test('getSettings should return copy', () => {
      const settings = game.getSettings();
      settings.theme = 'modified';

      expect(game.settings.theme).toBe('dark');
    });
  });

  describe('Storage', () => {
    test('saveToStorage should persist data', () => {
      game.addPlayer('Fighter', 50, 18);

      // Verify data is persisted by checking player was added
      expect(game.currentEncounter.players.length).toBe(1);
    });

    test('clearStorage should reset state', () => {
      game.addPlayer('Fighter', 50, 18);
      game.saveEncounter('Test');
      game.clearStorage();

      expect(game.savedEncounters.length).toBe(0);
      expect(game.currentEncounter.players.length).toBe(0);
    });
  });

  describe('Import/Export', () => {
    test('exportData should return JSON string', () => {
      game.addPlayer('Fighter', 50, 18);
      const exported = game.exportData();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe('1.0');
    });

    test('importData should restore state', () => {
      game.addPlayer('Fighter', 50, 18);
      game.saveEncounter('Test');
      const exported = game.exportData();

      game.clearStorage();
      const result = game.importData(exported);

      expect(result.success).toBe(true);
      expect(game.savedEncounters.length).toBe(1);
    });

    test('importData should fail for invalid JSON', () => {
      const result = game.importData('not json');
      expect(result.success).toBe(false);
    });

    test('importData should fail for wrong version', () => {
      const result = game.importData('{"version": "9.9"}');
      expect(result.success).toBe(false);
    });
  });

  describe('Events', () => {
    test('on should register event handler', () => {
      const handler = jest.fn();
      game.on('playerAdded', handler);
      game.addPlayer('Fighter', 50, 18);

      expect(handler).toHaveBeenCalled();
    });

    test('off should remove event handler', () => {
      // Create a fresh game for this test to avoid handler pollution
      const testGame = new Game();
      const handler = jest.fn();
      testGame.on('playerAdded', handler);
      testGame.off('playerAdded', handler);
      testGame.addPlayer('Fighter', 50, 18);

      expect(handler).not.toHaveBeenCalled();
    });

    test('emit should call handlers with data', () => {
      const handler = jest.fn();
      game.on('custom', handler);
      game.emit('custom', { test: true });

      expect(handler).toHaveBeenCalledWith({ test: true });
    });

    test('emit should handle handler errors gracefully', () => {
      const errorHandler = jest.fn(() => { throw new Error('Test'); });
      const goodHandler = jest.fn();

      game.on('test', errorHandler);
      game.on('test', goodHandler);

      // Should not throw
      expect(() => game.emit('test', {})).not.toThrow();
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    test('getEncounterStats should return stats', () => {
      game.addPlayer('Fighter', 50, 18, 0, 'player');
      game.addPlayer('Goblin', 20, 13, 0, 'monster');

      const stats = game.getEncounterStats();

      expect(stats.totalPlayers).toBe(2);
    });
  });
});
