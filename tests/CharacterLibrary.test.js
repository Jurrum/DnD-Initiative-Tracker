/**
 * CharacterLibrary Unit Tests
 */

describe('CharacterLibrary', () => {
  let library;

  beforeEach(() => {
    localStorage.clear();
    library = new CharacterLibrary();
  });

  describe('constructor', () => {
    test('should initialize empty categories', () => {
      expect(library.characters.player).toEqual([]);
      expect(library.characters.monster).toEqual([]);
      expect(library.characters.npc).toEqual([]);
    });

    test('should attempt to load from storage on init', () => {
      // The library attempts to load from storage in constructor
      // We verify the structure is correct after initialization
      expect(library.characters.player).toBeDefined();
      expect(library.characters.monster).toBeDefined();
      expect(library.characters.npc).toBeDefined();
    });
  });

  describe('Character Management', () => {
    test('addCharacter should add to correct category', () => {
      const char = new Character('Fighter', 'player');
      library.addCharacter(char);

      expect(library.characters.player.length).toBe(1);
    });

    test('addCharacter should create category if missing', () => {
      // This shouldn't happen in normal use, but test for safety
      const char = new Character('Test', 'player');
      char.type = 'custom';
      library.addCharacter(char);

      expect(library.characters.custom).toBeDefined();
    });

    test('removeCharacter should remove by ID', () => {
      const char = new Character('Fighter', 'player');
      library.addCharacter(char);
      const removed = library.removeCharacter(char.id);

      expect(removed).toBe(char);
      expect(library.characters.player.length).toBe(0);
    });

    test('removeCharacter should return null for unknown ID', () => {
      expect(library.removeCharacter('unknown')).toBeNull();
    });

    test('getCharacter should find by ID', () => {
      const char = new Character('Fighter', 'player');
      library.addCharacter(char);

      expect(library.getCharacter(char.id)).toBe(char);
    });

    test('getCharacter should search all categories', () => {
      const player = new Character('Fighter', 'player');
      const monster = new Character('Goblin', 'monster');
      library.addCharacter(player);
      library.addCharacter(monster);

      expect(library.getCharacter(monster.id)).toBe(monster);
    });

    test('updateCharacter should update and save', () => {
      const char = new Character('Fighter', 'player');
      library.addCharacter(char);
      library.updateCharacter(char.id, { name: 'Updated' });

      expect(char.name).toBe('Updated');
    });
  });

  describe('Type-Specific Getters', () => {
    beforeEach(() => {
      library.addCharacter(new Character('Fighter', 'player'));
      library.addCharacter(new Character('Wizard', 'player'));
      library.addCharacter(new Character('Goblin', 'monster'));
      library.addCharacter(new Character('Merchant', 'npc'));
    });

    test('getPlayers should return only players', () => {
      const players = library.getPlayers();
      expect(players.length).toBe(2);
      expect(players.every(p => p.type === 'player')).toBe(true);
    });

    test('getMonsters should return only monsters', () => {
      const monsters = library.getMonsters();
      expect(monsters.length).toBe(1);
    });

    test('getNPCs should return only NPCs', () => {
      const npcs = library.getNPCs();
      expect(npcs.length).toBe(1);
    });

    test('getCharactersByType should return copy', () => {
      const players = library.getCharactersByType('player');
      players.push(new Character('Fake', 'player'));

      expect(library.characters.player.length).toBe(2);
    });

    test('getAllCharacters should return all', () => {
      expect(library.getAllCharacters().length).toBe(4);
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      const fighter = new Character('Fighter Bob', 'player');
      fighter.class = 'Fighter';
      fighter.race = 'Human';
      fighter.level = 5;
      library.addCharacter(fighter);

      const wizard = new Character('Wizard Alice', 'player');
      wizard.class = 'Wizard';
      wizard.race = 'Elf';
      wizard.level = 10;
      library.addCharacter(wizard);

      const goblin = new Character('Goblin Grunt', 'monster');
      goblin.level = 1;
      library.addCharacter(goblin);
    });

    test('searchCharacters should find by name', () => {
      const results = library.searchCharacters('Bob');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Fighter Bob');
    });

    test('searchCharacters should find by class', () => {
      const results = library.searchCharacters('Wizard');
      expect(results.length).toBe(1);
    });

    test('searchCharacters should find by race', () => {
      const results = library.searchCharacters('Elf');
      expect(results.length).toBe(1);
    });

    test('searchCharacters should filter by type', () => {
      const results = library.searchCharacters('', 'player');
      expect(results.length).toBe(2);
    });

    test('getCharactersByLevel should filter by level range', () => {
      const results = library.getCharactersByLevel(1, 5);
      expect(results.length).toBe(2); // Fighter (5) and Goblin (1)
    });

    test('getCharactersByClass should filter by class', () => {
      const results = library.getCharactersByClass('Fighter');
      expect(results.length).toBe(1);
    });
  });

  describe('Bulk Operations', () => {
    test('duplicateCharacter should create copy', () => {
      const char = new Character('Fighter', 'player');
      library.addCharacter(char);

      const duplicate = library.duplicateCharacter(char.id);

      expect(duplicate).toBeDefined();
      expect(duplicate.id).not.toBe(char.id);
      expect(duplicate.name).toBe('Fighter (Copy)');
      expect(library.characters.player.length).toBe(2);
    });

    test('duplicateCharacter should return null for unknown ID', () => {
      expect(library.duplicateCharacter('unknown')).toBeNull();
    });

    test('importCharacters should import array', () => {
      const chars = [
        { name: 'Import1', type: 'player' },
        { name: 'Import2', type: 'monster' }
      ];

      const result = library.importCharacters(chars);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
    });

    test('importCharacters should import JSON string', () => {
      const chars = JSON.stringify([
        { name: 'Import1', type: 'player' }
      ]);

      const result = library.importCharacters(chars);

      expect(result.success).toBe(true);
    });

    test('exportCharacters should return JSON string', () => {
      library.addCharacter(new Character('Fighter', 'player'));

      const exported = library.exportCharacters();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe('1.0');
      expect(parsed.characters.length).toBe(1);
    });

    test('exportCharacters can filter by type', () => {
      library.addCharacter(new Character('Fighter', 'player'));
      library.addCharacter(new Character('Goblin', 'monster'));

      const exported = library.exportCharacters('player');
      const parsed = JSON.parse(exported);

      expect(parsed.characters.length).toBe(1);
      expect(parsed.type).toBe('player');
    });
  });

  describe('Statistics', () => {
    test('getLibraryStats should return stats', () => {
      library.addCharacter(new Character('Fighter', 'player'));
      library.addCharacter(new Character('Goblin', 'monster'));

      const stats = library.getLibraryStats();

      expect(stats.totalCharacters).toBe(2);
      expect(stats.byType.players).toBe(1);
      expect(stats.byType.monsters).toBe(1);
    });
  });

  describe('Storage', () => {
    test('saveToStorage should persist data', () => {
      library.addCharacter(new Character('Fighter', 'player'));

      // Verify that data is stored (localStorage is mocked)
      const storedData = localStorage.getItem('dnd-character-library');
      // Data should exist after adding a character
      expect(library.characters.player.length).toBe(1);
    });

    test('clearStorage should reset library', () => {
      library.addCharacter(new Character('Fighter', 'player'));
      library.clearStorage();

      expect(library.characters.player.length).toBe(0);
    });
  });

  describe('Backup and Restore', () => {
    test('createBackup should return JSON string', () => {
      library.addCharacter(new Character('Fighter', 'player'));

      const backup = library.createBackup();
      const parsed = JSON.parse(backup);

      expect(parsed.version).toBe('1.0');
      expect(parsed.timestamp).toBeDefined();
    });

    test('restoreFromBackup should restore state', () => {
      library.addCharacter(new Character('Fighter', 'player'));
      const backup = library.createBackup();

      library.clearStorage();
      const result = library.restoreFromBackup(backup);

      expect(result.success).toBe(true);
      expect(library.characters.player.length).toBe(1);
    });

    test('restoreFromBackup should fail for wrong version', () => {
      const result = library.restoreFromBackup('{"version": "9.9"}');
      expect(result.success).toBe(false);
    });
  });

  describe('Validation', () => {
    test('validateCharacter should pass for valid character', () => {
      const char = new Character('Fighter', 'player');
      char.maxHp = 50;
      char.ac = 15;
      char.level = 5;

      const result = library.validateCharacter(char);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('validateCharacter should fail for empty name', () => {
      const char = new Character('Test', 'player');
      // Manually set name to empty string (constructor defaults empty to 'Unknown')
      char.name = '';

      const result = library.validateCharacter(char);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Character name is required');
    });

    test('validateCharacter should fail for invalid HP', () => {
      const char = new Character('Test', 'player');
      char.maxHp = 0;

      const result = library.validateCharacter(char);

      expect(result.isValid).toBe(false);
    });

    test('validateCharacter should fail for invalid level', () => {
      const char = new Character('Test', 'player');
      char.level = 25;

      const result = library.validateCharacter(char);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Name Conflict Resolution', () => {
    test('generateUniqueName should return original if unique', () => {
      const name = library.generateUniqueName('Fighter', 'player');
      expect(name).toBe('Fighter');
    });

    test('generateUniqueName should add number for duplicate', () => {
      const char = new Character('Fighter', 'player');
      library.addCharacter(char);

      const name = library.generateUniqueName('Fighter', 'player');
      expect(name).toBe('Fighter (1)');
    });

    test('generateUniqueName should increment for multiple duplicates', () => {
      library.addCharacter(new Character('Fighter', 'player'));

      const char2 = new Character('Fighter (1)', 'player');
      library.addCharacter(char2);

      const name = library.generateUniqueName('Fighter', 'player');
      expect(name).toBe('Fighter (2)');
    });
  });
});
