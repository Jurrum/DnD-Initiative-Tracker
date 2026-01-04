/**
 * Jest Test Setup
 * Loads all class files for testing using Function constructor
 */

const fs = require('fs');
const path = require('path');

// Read all class files
function readClassFile(filename) {
  const filepath = path.join(__dirname, '..', 'js', 'classes', filename);
  return fs.readFileSync(filepath, 'utf8');
}

// Combine all class files into one script to maintain scope
const classFiles = [
  'BaseCharacter.js',
  'Player.js',
  'Character.js',
  'Initiative.js',
  'Encounter.js',
  'CharacterLibrary.js',
  'Game.js'
];

// Build combined code
let combinedCode = classFiles.map(f => readClassFile(f)).join('\n\n');

// Remove module.exports lines since we're in browser-like environment
combinedCode = combinedCode.replace(/if \(typeof module !== 'undefined'.*\n.*\n\}/g, '');

// Create a function that returns all classes
const factoryCode = `
${combinedCode}

return {
  BaseCharacter: BaseCharacter,
  Player: Player,
  Character: Character,
  Initiative: Initiative,
  Encounter: Encounter,
  CharacterLibrary: CharacterLibrary,
  Game: Game
};
`;

// Execute and get classes
const factory = new Function('localStorage', factoryCode);

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value.toString();
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

global.localStorage = localStorageMock;

// Get all classes
const classes = factory(localStorageMock);

// Make classes globally available in Jest
global.BaseCharacter = classes.BaseCharacter;
global.Player = classes.Player;
global.Character = classes.Character;
global.Initiative = classes.Initiative;
global.Encounter = classes.Encounter;
global.CharacterLibrary = classes.CharacterLibrary;
global.Game = classes.Game;

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.store = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});
