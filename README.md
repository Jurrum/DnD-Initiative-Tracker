# D&D Initiative Tracker

A comprehensive web-based initiative tracker for Dungeons & Dragons campaigns with full Object-Oriented Programming implementation.

## Features

### Core Functionality
- **Player Management**: Add, remove, and edit players with HP, AC, and initiative modifiers
- **Initiative System**: Roll initiative, sort players automatically, track current turn
- **Turn Management**: Next/previous turn with round tracking
- **Combat Tracking**: Deal damage, heal players, manage HP
- **Condition Management**: Add/remove conditions with duration tracking
- **Encounter Management**: Save/load encounters, create templates

### Advanced Features
- **Data Persistence**: Automatic save to localStorage
- **Export/Import**: Backup and restore campaign data
- **Keyboard Shortcuts**: Quick actions for faster gameplay
- **Responsive Design**: Works on tablets and phones
- **Player Types**: Support for players, NPCs, and monsters
- **Visual Feedback**: HP bars, status indicators, animations

## How to Use

### Getting Started
1. Open `index.html` in a web browser
2. Add players using the form in the sidebar
3. Roll initiative for all players
4. Start the encounter

### Adding Players
- Enter player name, HP, AC, and initiative modifier
- Select player type (Player, NPC, Monster)
- Click "Add Player"

### Managing Initiative
- Click "Roll Initiative" to roll for all players
- Players are automatically sorted by initiative
- Click "Start Encounter" to begin combat

### During Combat
- Use "Next Turn" and "Previous Turn" to navigate
- Current player is highlighted in blue
- Deal damage or heal using the action buttons
- Add conditions with duration tracking

### Keyboard Shortcuts
- `Ctrl+N`: New encounter
- `Ctrl+S`: Save encounter
- `R`: Roll initiative
- `N`: Next turn (during combat)
- `P`: Previous turn (during combat)
- `Ctrl+Enter`: Next turn (during combat)

### Encounter Management
- Save encounters with custom names
- Load previously saved encounters
- Create encounter templates for reuse

## Object-Oriented Architecture

### Core Classes

#### Player Class (`js/classes/Player.js`)
- Manages individual player data (HP, AC, initiative, conditions)
- Handles damage, healing, and condition management
- Tracks player actions and status

#### Initiative Class (`js/classes/Initiative.js`)
- Manages turn order and initiative tracking
- Handles turn progression and round management
- Sorts players by initiative automatically

#### Encounter Class (`js/classes/Encounter.js`)
- Manages groups of players and encounter state
- Coordinates between players and initiative system
- Handles encounter lifecycle (start, end, reset)

#### Game Class (`js/classes/Game.js`)
- Main controller coordinating all systems
- Manages data persistence and encounter storage
- Handles event system and UI coordination

#### UIManager Class (`js/main.js`)
- Manages all user interface interactions
- Handles DOM updates and event listeners
- Provides visual feedback and notifications

## Technical Features

### Data Persistence
- Automatic save to browser localStorage
- Export/import functionality for backup
- Preserves encounter state between sessions

### Event System
- Decoupled architecture with event-driven updates
- Real-time UI updates when data changes
- Efficient rendering with minimal DOM manipulation

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

The application uses vanilla JavaScript with Object-Oriented Programming principles:

- **ES6 Classes**: Modern JavaScript class syntax
- **Encapsulation**: Private methods and data management
- **Inheritance**: Shared functionality through class hierarchy
- **Polymorphism**: Common interfaces across different object types
- **Separation of Concerns**: Clear separation between data, logic, and presentation

No external dependencies required - runs entirely in the browser!

## Future Enhancements

- Drag-and-drop initiative reordering
- Spell effect tracking with automatic duration management
- Combat log with action history
- Custom condition templates
- Multi-encounter campaign management
- Enhanced mobile interface with gestures
