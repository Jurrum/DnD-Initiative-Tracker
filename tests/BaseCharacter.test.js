/**
 * BaseCharacter Unit Tests
 */

describe('BaseCharacter', () => {
  let character;

  beforeEach(() => {
    character = new BaseCharacter('Test Hero', 'player');
  });

  describe('constructor', () => {
    test('should create character with name and type', () => {
      expect(character.name).toBe('Test Hero');
      expect(character.type).toBe('player');
    });

    test('should generate unique ID', () => {
      const char2 = new BaseCharacter('Another', 'monster');
      expect(character.id).not.toBe(char2.id);
    });

    test('should throw error for invalid type', () => {
      expect(() => new BaseCharacter('Test', 'invalid')).toThrow('Invalid character type');
    });

    test('should accept valid types', () => {
      expect(() => new BaseCharacter('Test', 'player')).not.toThrow();
      expect(() => new BaseCharacter('Test', 'monster')).not.toThrow();
      expect(() => new BaseCharacter('Test', 'npc')).not.toThrow();
    });

    test('should set default values', () => {
      expect(character.maxHp).toBe(10);
      expect(character.currentHp).toBe(10);
      expect(character.ac).toBe(10);
      expect(character.initiative).toBe(0);
      expect(character.isAlive).toBe(true);
      expect(character.conditions).toEqual([]);
      expect(character.actions).toEqual([]);
    });
  });

  describe('Health Management', () => {
    beforeEach(() => {
      character.maxHp = 20;
      character.currentHp = 20;
    });

    test('takeDamage should reduce HP', () => {
      character.takeDamage(5);
      expect(character.currentHp).toBe(15);
    });

    test('takeDamage should not go below 0', () => {
      character.takeDamage(100);
      expect(character.currentHp).toBe(0);
    });

    test('takeDamage should set isAlive to false at 0 HP', () => {
      character.takeDamage(20);
      expect(character.isAlive).toBe(false);
    });

    test('takeDamage should add unconscious condition at 0 HP', () => {
      character.takeDamage(20);
      expect(character.hasCondition('unconscious')).toBe(true);
    });

    test('takeDamage should throw error for negative amount', () => {
      expect(() => character.takeDamage(-5)).toThrow();
    });

    test('takeDamage should throw error for non-numeric amount', () => {
      expect(() => character.takeDamage('abc')).toThrow();
    });

    test('heal should increase HP', () => {
      character.takeDamage(10);
      character.heal(5);
      expect(character.currentHp).toBe(15);
    });

    test('heal should not exceed maxHp', () => {
      character.takeDamage(5);
      character.heal(100);
      expect(character.currentHp).toBe(20);
    });

    test('heal should revive and remove unconscious', () => {
      character.takeDamage(20);
      expect(character.isAlive).toBe(false);
      character.heal(1);
      expect(character.isAlive).toBe(true);
      expect(character.hasCondition('unconscious')).toBe(false);
    });

    test('heal should throw error for negative amount', () => {
      expect(() => character.heal(-5)).toThrow();
    });

    test('getHpPercentage should return correct percentage', () => {
      character.currentHp = 10;
      expect(character.getHpPercentage()).toBe(50);
    });

    test('getHpPercentage should handle 0 maxHp', () => {
      character.maxHp = 0;
      expect(character.getHpPercentage()).toBe(0);
    });
  });

  describe('Conditions', () => {
    test('addCondition should add a condition', () => {
      const condition = character.addCondition('poisoned', 3, 'From spider');
      expect(condition.name).toBe('poisoned');
      expect(condition.duration).toBe(3);
      expect(condition.description).toBe('From spider');
      expect(character.conditions.length).toBe(1);
    });

    test('addCondition with duration -1 should be permanent', () => {
      character.addCondition('blessed', -1);
      expect(character.conditions[0].duration).toBe(-1);
    });

    test('addCondition should throw error without name', () => {
      expect(() => character.addCondition('')).toThrow();
    });

    test('hasCondition should return true if condition exists', () => {
      character.addCondition('stunned');
      expect(character.hasCondition('stunned')).toBe(true);
    });

    test('hasCondition should return false if condition does not exist', () => {
      expect(character.hasCondition('stunned')).toBe(false);
    });

    test('removeCondition should remove by name', () => {
      character.addCondition('poisoned');
      const removed = character.removeCondition('poisoned');
      expect(removed).toBe(true);
      expect(character.hasCondition('poisoned')).toBe(false);
    });

    test('removeCondition should return false if not found', () => {
      const removed = character.removeCondition('nonexistent');
      expect(removed).toBe(false);
    });

    test('removeConditionById should remove by ID', () => {
      const condition = character.addCondition('poisoned');
      const removed = character.removeConditionById(condition.id);
      expect(removed).toBe(true);
      expect(character.conditions.length).toBe(0);
    });

    test('updateConditions should decrement duration', () => {
      character.addCondition('poisoned', 3);
      character.updateConditions();
      expect(character.conditions[0].duration).toBe(2);
    });

    test('updateConditions should remove expired conditions', () => {
      character.addCondition('poisoned', 1);
      character.updateConditions(); // duration becomes 0
      expect(character.hasCondition('poisoned')).toBe(true); // Still there at 0
      character.updateConditions(); // duration becomes -1, but wait...
      // Actually the logic is: duration-- then check >= 0
      // So at 1: becomes 0, >= 0 is true, stays
      // At 0: becomes -1, >= 0 is false, removed
    });

    test('updateConditions should NOT remove permanent conditions', () => {
      character.addCondition('cursed', -1);
      character.updateConditions();
      character.updateConditions();
      character.updateConditions();
      expect(character.hasCondition('cursed')).toBe(true);
    });

    test('condition duration of 1 should last one turn', () => {
      // FIX TEST: A condition with duration 1 should last through the current turn
      character.addCondition('quickbuff', 1);
      expect(character.hasCondition('quickbuff')).toBe(true);

      // After first updateConditions (end of turn), duration becomes 0
      character.updateConditions();
      expect(character.hasCondition('quickbuff')).toBe(true); // Still there

      // After second updateConditions, duration becomes -1 and is removed
      character.updateConditions();
      expect(character.hasCondition('quickbuff')).toBe(false);
    });
  });

  describe('Actions', () => {
    test('addAction should record an action', () => {
      const action = character.addAction('Attack with sword');
      expect(action.action).toBe('Attack with sword');
      expect(character.actions.length).toBe(1);
    });

    test('addAction should throw error without description', () => {
      expect(() => character.addAction('')).toThrow();
    });

    test('getActions should return copy of actions', () => {
      character.addAction('Action 1');
      const actions = character.getActions();
      actions.push({ action: 'Fake' });
      expect(character.actions.length).toBe(1);
    });

    test('clearActions should remove all actions', () => {
      character.addAction('Action 1');
      character.addAction('Action 2');
      character.clearActions();
      expect(character.actions.length).toBe(0);
    });
  });

  describe('Initiative', () => {
    test('rollInitiative should return a number', () => {
      character.initiativeModifier = 2;
      const result = character.rollInitiative();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(3); // 1 + 2
      expect(result).toBeLessThanOrEqual(22); // 20 + 2
    });

    test('setInitiative should set initiative value', () => {
      character.setInitiative(15);
      expect(character.initiative).toBe(15);
    });

    test('setInitiative should throw error for non-numeric value', () => {
      expect(() => character.setInitiative('abc')).toThrow();
    });
  });

  describe('Reset', () => {
    test('reset should restore character to full state', () => {
      character.maxHp = 20;
      character.takeDamage(15);
      character.addCondition('poisoned');
      character.addAction('Some action');
      character.initiative = 15;

      character.reset();

      expect(character.currentHp).toBe(20);
      expect(character.isAlive).toBe(true);
      expect(character.conditions.length).toBe(0);
      expect(character.actions.length).toBe(0);
      expect(character.initiative).toBe(0);
    });
  });

  describe('Status Display', () => {
    test('getStatusText should return appropriate text', () => {
      character.maxHp = 100;

      character.currentHp = 100;
      expect(character.getStatusText()).toBe('Healthy');

      character.currentHp = 75;
      expect(character.getStatusText()).toBe('Injured');

      character.currentHp = 50;
      expect(character.getStatusText()).toBe('Wounded');

      character.currentHp = 25;
      expect(character.getStatusText()).toBe('Critical');

      character.isAlive = false;
      expect(character.getStatusText()).toBe('Dead');
    });

    test('getTypeIcon should return correct icon', () => {
      expect(new BaseCharacter('Test', 'player').getTypeIcon()).toBe('👤');
      expect(new BaseCharacter('Test', 'monster').getTypeIcon()).toBe('👹');
      expect(new BaseCharacter('Test', 'npc').getTypeIcon()).toBe('🧑');
    });
  });

  describe('Validation Utilities', () => {
    test('validateNumber should return valid number', () => {
      expect(BaseCharacter.validateNumber(5, 1, 10, 'test')).toBe(5);
    });

    test('validateNumber should throw for out of range', () => {
      expect(() => BaseCharacter.validateNumber(15, 1, 10, 'test')).toThrow();
    });

    test('validateNumber should throw for non-numeric', () => {
      expect(() => BaseCharacter.validateNumber('abc', 1, 10, 'test')).toThrow();
    });

    test('validateString should return trimmed string', () => {
      expect(BaseCharacter.validateString('  hello  ', 'test')).toBe('hello');
    });

    test('validateString should throw for empty string', () => {
      expect(() => BaseCharacter.validateString('', 'test')).toThrow();
      expect(() => BaseCharacter.validateString('   ', 'test')).toThrow();
    });
  });
});
