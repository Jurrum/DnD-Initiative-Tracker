/**
 * Player Unit Tests
 */

describe('Player', () => {
  let player;

  beforeEach(() => {
    player = new Player('Gandalf', 50, 15, 3, 'player');
  });

  describe('constructor', () => {
    test('should create player with all parameters', () => {
      expect(player.name).toBe('Gandalf');
      expect(player.maxHp).toBe(50);
      expect(player.currentHp).toBe(50);
      expect(player.ac).toBe(15);
      expect(player.initiativeModifier).toBe(3);
      expect(player.type).toBe('player');
    });

    test('should handle invalid HP gracefully', () => {
      const p = new Player('Test', -5, 10, 0);
      expect(p.maxHp).toBe(1); // Minimum HP is 1
    });

    test('should handle invalid AC gracefully', () => {
      const p = new Player('Test', 10, -5, 0);
      expect(p.ac).toBe(10); // Default AC
    });

    test('should generate player-specific ID', () => {
      expect(player.id).toMatch(/^player_/);
    });
  });

  describe('clone', () => {
    test('should create independent copy', () => {
      player.takeDamage(10);
      player.addCondition('poisoned', 3);

      const clone = player.clone();

      expect(clone.id).not.toBe(player.id);
      expect(clone.name).toBe(player.name);
      expect(clone.currentHp).toBe(player.currentHp);
      expect(clone.conditions.length).toBe(player.conditions.length);
    });

    test('clone conditions should be deep copied', () => {
      player.addCondition('poisoned', 3);
      const clone = player.clone();

      // Modify original's condition
      player.conditions[0].duration = 100;

      // Clone should be unaffected
      expect(clone.conditions[0].duration).toBe(3);
    });

    test('clone actions should be deep copied', () => {
      player.addAction('Attack');
      const clone = player.clone();

      // Modify original's action
      player.actions[0].action = 'Modified';

      // Clone should be unaffected
      expect(clone.actions[0].action).toBe('Attack');
    });
  });

  describe('serialization', () => {
    test('toJSON should return serializable object', () => {
      const json = player.toJSON();

      expect(json.name).toBe('Gandalf');
      expect(json.maxHp).toBe(50);
      expect(json.ac).toBe(15);
      expect(json.initiativeModifier).toBe(3);
      expect(json.type).toBe('player');
    });

    test('fromJSON should recreate player', () => {
      player.takeDamage(10);
      player.addCondition('stunned');

      const json = player.toJSON();
      const restored = Player.fromJSON(json);

      expect(restored.name).toBe(player.name);
      expect(restored.currentHp).toBe(player.currentHp);
      expect(restored.hasCondition('stunned')).toBe(true);
    });

    test('fromJSON should handle missing data gracefully', () => {
      const restored = Player.fromJSON({ name: 'Test' });

      expect(restored.name).toBe('Test');
      expect(restored.maxHp).toBe(10); // Default
      expect(restored.ac).toBe(10); // Default
    });

    test('fromJSON should throw on null data', () => {
      expect(() => Player.fromJSON(null)).toThrow();
    });
  });

  describe('inherited functionality', () => {
    test('should inherit takeDamage from BaseCharacter', () => {
      player.takeDamage(10);
      expect(player.currentHp).toBe(40);
    });

    test('should inherit heal from BaseCharacter', () => {
      player.takeDamage(20);
      player.heal(5);
      expect(player.currentHp).toBe(35);
    });

    test('should inherit condition methods from BaseCharacter', () => {
      player.addCondition('poisoned');
      expect(player.hasCondition('poisoned')).toBe(true);
      player.removeCondition('poisoned');
      expect(player.hasCondition('poisoned')).toBe(false);
    });
  });
});
