/**
 * Initiative Unit Tests
 */

describe('Initiative', () => {
  let initiative;
  let player1, player2, player3;

  beforeEach(() => {
    initiative = new Initiative();
    player1 = new Player('Fighter', 50, 18, 2, 'player');
    player2 = new Player('Wizard', 30, 12, 4, 'player');
    player3 = new Player('Goblin', 20, 13, 1, 'monster');
  });

  describe('Player Management', () => {
    test('addPlayer should add player to initiative', () => {
      expect(initiative.addPlayer(player1)).toBe(true);
      expect(initiative.players.length).toBe(1);
    });

    test('addPlayer should not add duplicate players', () => {
      initiative.addPlayer(player1);
      expect(initiative.addPlayer(player1)).toBe(false);
      expect(initiative.players.length).toBe(1);
    });

    test('addPlayer should reject null/undefined', () => {
      expect(initiative.addPlayer(null)).toBe(false);
      expect(initiative.addPlayer(undefined)).toBe(false);
    });

    test('removePlayer should remove player', () => {
      initiative.addPlayer(player1);
      expect(initiative.removePlayer(player1.id)).toBe(true);
      expect(initiative.players.length).toBe(0);
    });

    test('removePlayer should return false for unknown player', () => {
      expect(initiative.removePlayer('unknown')).toBe(false);
    });

    test('getPlayer should return player by ID', () => {
      initiative.addPlayer(player1);
      expect(initiative.getPlayer(player1.id)).toBe(player1);
    });

    test('getPlayer should return null for unknown ID', () => {
      expect(initiative.getPlayer('unknown')).toBeNull();
    });
  });

  describe('Turn Index Management', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      initiative.addPlayer(player3);
      initiative.startEncounter();
    });

    test('removing player before current turn should adjust index', () => {
      initiative.currentTurn = 2; // At player3
      initiative.removePlayer(player1.id); // Remove player at index 0
      expect(initiative.currentTurn).toBe(1); // Should shift back
    });

    test('removing current player should keep index in bounds', () => {
      initiative.currentTurn = 2; // At player3 (last)
      initiative.removePlayer(player3.id);
      expect(initiative.currentTurn).toBe(0); // Should wrap to start
    });

    test('removing last player should reset currentTurn to 0', () => {
      initiative.removePlayer(player1.id);
      initiative.removePlayer(player2.id);
      initiative.removePlayer(player3.id);
      expect(initiative.currentTurn).toBe(0);
    });

    test('currentTurn should never be negative', () => {
      initiative.currentTurn = 0;
      initiative.removePlayer(player2.id);
      initiative.removePlayer(player3.id);
      expect(initiative.currentTurn).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Initiative Rolling', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      initiative.addPlayer(player3);
    });

    test('rollInitiativeForAll should roll for all players', () => {
      initiative.rollInitiativeForAll();
      initiative.players.forEach(p => {
        expect(p.initiative).toBeGreaterThan(0);
      });
    });

    test('rollInitiativeForAll should sort by initiative', () => {
      // Force specific initiative values
      player1.initiative = 10;
      player2.initiative = 20;
      player3.initiative = 15;

      initiative.sortByInitiative();

      expect(initiative.players[0]).toBe(player2); // Highest
      expect(initiative.players[1]).toBe(player3);
      expect(initiative.players[2]).toBe(player1); // Lowest
    });

    test('ties should be broken by initiative modifier', () => {
      player1.initiative = 15;
      player1.initiativeModifier = 2;
      player2.initiative = 15;
      player2.initiativeModifier = 4; // Higher modifier

      initiative.sortByInitiative();

      expect(initiative.players[0]).toBe(player2); // Higher modifier wins
    });

    test('setPlayerInitiative should update and sort', () => {
      initiative.setPlayerInitiative(player1.id, 25);
      expect(player1.initiative).toBe(25);
    });

    test('setPlayerInitiative should return false for invalid value', () => {
      expect(initiative.setPlayerInitiative(player1.id, 'abc')).toBe(false);
    });
  });

  describe('Encounter Control', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
    });

    test('startEncounter should activate encounter', () => {
      expect(initiative.startEncounter()).toBe(true);
      expect(initiative.isActive).toBe(true);
      expect(initiative.round).toBe(1);
      expect(initiative.currentTurn).toBe(0);
    });

    test('startEncounter should fail with no players', () => {
      const emptyInit = new Initiative();
      expect(emptyInit.startEncounter()).toBe(false);
    });

    test('endEncounter should deactivate encounter', () => {
      initiative.startEncounter();
      initiative.endEncounter();
      expect(initiative.isActive).toBe(false);
    });

    test('reset should clear state but keep players', () => {
      initiative.startEncounter();
      initiative.nextTurn();
      initiative.reset();

      expect(initiative.isActive).toBe(false);
      expect(initiative.round).toBe(1);
      expect(initiative.currentTurn).toBe(0);
      expect(initiative.players.length).toBe(2); // Players kept
    });
  });

  describe('Turn Management', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      initiative.addPlayer(player3);
      initiative.startEncounter();
    });

    test('nextTurn should advance to next player', () => {
      const current = initiative.getCurrentPlayer();
      initiative.nextTurn();
      expect(initiative.currentTurn).toBe(1);
    });

    test('nextTurn should wrap and increment round', () => {
      initiative.nextTurn(); // 0 -> 1
      initiative.nextTurn(); // 1 -> 2
      initiative.nextTurn(); // 2 -> 0, round 2

      expect(initiative.currentTurn).toBe(0);
      expect(initiative.round).toBe(2);
    });

    test('previousTurn should go back', () => {
      initiative.nextTurn();
      initiative.previousTurn();
      expect(initiative.currentTurn).toBe(0);
    });

    test('previousTurn should wrap to end of previous round', () => {
      initiative.round = 2;
      initiative.currentTurn = 0;
      initiative.previousTurn();

      expect(initiative.currentTurn).toBe(2);
      expect(initiative.round).toBe(1);
    });

    test('previousTurn at round 1, turn 0 should stay at round 1', () => {
      initiative.currentTurn = 0;
      initiative.round = 1;
      initiative.previousTurn();

      expect(initiative.round).toBe(1); // Can't go below round 1
      expect(initiative.currentTurn).toBe(2);
    });

    test('nextTurn should return null when not active', () => {
      initiative.endEncounter();
      expect(initiative.nextTurn()).toBeNull();
    });

    test('getCurrentPlayer should return current player', () => {
      expect(initiative.getCurrentPlayer()).toBe(initiative.players[0]);
    });

    test('getCurrentPlayer should return null when not active', () => {
      initiative.endEncounter();
      expect(initiative.getCurrentPlayer()).toBeNull();
    });
  });

  describe('Move Player', () => {
    beforeEach(() => {
      // Set specific initiatives so order after sorting is known: player1, player2, player3
      player1.initiative = 20;
      player2.initiative = 15;
      player3.initiative = 10;
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      initiative.addPlayer(player3);
      initiative.startEncounter();
    });

    test('movePlayer should reorder players', () => {
      // After sorting: player1 (20), player2 (15), player3 (10)
      // Move player at index 0 to index 2
      initiative.movePlayer(0, 2);
      expect(initiative.players[2]).toBe(player1);
    });

    test('movePlayer should adjust currentTurn when moving current player', () => {
      initiative.currentTurn = 0;
      initiative.movePlayer(0, 2);
      expect(initiative.currentTurn).toBe(2);
    });

    test('movePlayer should return false for invalid indices', () => {
      expect(initiative.movePlayer(-1, 0)).toBe(false);
      expect(initiative.movePlayer(0, 100)).toBe(false);
    });

    test('movePlayer same position should return true', () => {
      expect(initiative.movePlayer(0, 0)).toBe(true);
    });
  });

  describe('Query Methods', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      player2.isAlive = false;
    });

    test('getAlivePlayersCount should count alive players', () => {
      expect(initiative.getAlivePlayersCount()).toBe(1);
    });

    test('getPlayersWithCondition should filter by condition', () => {
      player1.addCondition('poisoned');
      const result = initiative.getPlayersWithCondition('poisoned');
      expect(result.length).toBe(1);
      expect(result[0]).toBe(player1);
    });

    test('hasPlayers should return true when players exist', () => {
      expect(initiative.hasPlayers()).toBe(true);
    });

    test('getPlayerCount should return correct count', () => {
      expect(initiative.getPlayerCount()).toBe(2);
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      initiative.startEncounter();
      initiative.nextTurn();
    });

    test('toJSON should serialize state', () => {
      const json = initiative.toJSON();

      expect(json.players.length).toBe(2);
      expect(json.currentTurn).toBe(1);
      expect(json.round).toBe(1);
      expect(json.isActive).toBe(true);
    });

    test('fromJSON should restore state', () => {
      const json = initiative.toJSON();
      const restored = Initiative.fromJSON(json);

      expect(restored.players.length).toBe(2);
      expect(restored.currentTurn).toBe(1);
      expect(restored.isActive).toBe(true);
    });

    test('fromJSON should handle invalid currentTurn', () => {
      const json = initiative.toJSON();
      json.currentTurn = 100; // Invalid

      const restored = Initiative.fromJSON(json);
      expect(restored.currentTurn).toBeLessThan(restored.players.length);
    });

    test('fromJSON should throw on null data', () => {
      expect(() => Initiative.fromJSON(null)).toThrow();
    });
  });

  describe('Sort Preserves Current Player During Active Encounter', () => {
    beforeEach(() => {
      initiative.addPlayer(player1);
      initiative.addPlayer(player2);
      initiative.addPlayer(player3);
      player1.initiative = 10;
      player2.initiative = 20;
      player3.initiative = 15;
      initiative.sortByInitiative();
      initiative.startEncounter();
    });

    test('should preserve current player when sorting during active encounter', () => {
      // Current order: player2 (20), player3 (15), player1 (10)
      // Current player is player2 at index 0
      const currentBefore = initiative.getCurrentPlayer();
      expect(currentBefore).toBe(player2);

      // Change player1's initiative to be highest
      player1.initiative = 25;
      initiative.sortByInitiative();

      // Current player should still be player2
      const currentAfter = initiative.getCurrentPlayer();
      expect(currentAfter).toBe(player2);
    });
  });
});
