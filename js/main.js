class UIManager {
    constructor() {
        this.game = new Game();
        this.characterLibrary = new CharacterLibrary();
        this.currentTab = 'characters';
        this.currentCharacterType = 'player';
        this.editingCharacter = null;
        this.setupEventListeners();
        this.setupGameEventHandlers();
        this.updateUI();
    }

    setupEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Character Type Tabs
        document.querySelectorAll('.character-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchCharacterType(e.target.dataset.type);
            });
        });

        // Character Management
        document.getElementById('add-character-btn').addEventListener('click', () => {
            this.showCharacterModal();
        });

        document.getElementById('character-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCharacter();
        });

        // Modal Controls
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Encounter Management
        document.getElementById('load-players-btn').addEventListener('click', () => {
            this.loadAllPlayers();
        });

        document.getElementById('add-from-library-btn').addEventListener('click', () => {
            this.showLibraryModal();
        });

        // Library Modal
        document.querySelectorAll('.library-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchLibraryTab(e.target.dataset.type);
            });
        });

        // Encounter Controls
        document.getElementById('manual-initiative-btn').addEventListener('click', () => {
            this.showInitiativeInputs();
        });

        document.getElementById('start-encounter-btn').addEventListener('click', () => {
            this.startEncounter();
        });

        document.getElementById('end-encounter-btn').addEventListener('click', () => {
            this.endEncounter();
        });

        document.getElementById('reset-encounter-btn').addEventListener('click', () => {
            this.resetEncounter();
        });

        // Initiative System
        document.getElementById('next-turn-btn').addEventListener('click', () => {
            this.nextTurn();
        });

        document.getElementById('prev-turn-btn').addEventListener('click', () => {
            this.previousTurn();
        });

        // Action Buttons
        document.getElementById('add-condition-btn').addEventListener('click', () => {
            this.showAddConditionModal();
        });

        document.getElementById('deal-damage-btn').addEventListener('click', () => {
            this.showDealDamageModal();
        });

        document.getElementById('heal-btn').addEventListener('click', () => {
            this.showHealModal();
        });

        // Header Actions
        document.getElementById('new-encounter-btn').addEventListener('click', () => {
            this.newEncounter();
        });

        document.getElementById('save-encounter-btn').addEventListener('click', () => {
            this.saveEncounter();
        });

        document.getElementById('load-encounter-btn').addEventListener('click', () => {
            this.loadEncounter();
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Modal close on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    setupGameEventHandlers() {
        this.game.on('encounterStarted', () => this.updateEncounterControls());
        this.game.on('encounterEnded', () => this.updateEncounterControls());
        this.game.on('turnChanged', () => this.updateInitiativeList());
        this.game.on('playerInitiativeSet', () => this.updateEncounterParticipants());
        this.game.on('damageDealt', () => this.updateInitiativeList());
        this.game.on('playerHealed', () => this.updateInitiativeList());
        this.game.on('conditionAdded', () => this.updateConditionsList());
        this.game.on('conditionRemoved', () => this.updateConditionsList());
    }

    // Tab Management
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.updateUI();
    }

    switchCharacterType(type) {
        this.currentCharacterType = type;
        
        // Update character type buttons
        document.querySelectorAll('.character-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        this.updateCharacterList();
    }

    switchLibraryTab(type) {
        // Update library tab buttons
        document.querySelectorAll('.library-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        this.updateLibraryList(type);
    }

    // Character Management
    showCharacterModal(character = null) {
        this.editingCharacter = character;
        const modal = document.getElementById('character-modal');
        const form = document.getElementById('character-form');
        const title = document.getElementById('modal-title');
        
        title.textContent = character ? 'Edit Character' : `Add New ${this.currentCharacterType}`;
        
        if (character) {
            this.populateCharacterForm(character);
        } else {
            form.reset();
            // Set default values based on character type
            this.setDefaultCharacterValues();
        }
        
        modal.style.display = 'block';
    }

    populateCharacterForm(character) {
        document.getElementById('char-name').value = character.name;
        document.getElementById('char-class').value = character.class;
        document.getElementById('char-race').value = character.race;
        document.getElementById('char-level').value = character.level;
        document.getElementById('char-hp').value = character.maxHp;
        document.getElementById('char-ac').value = character.ac;
        document.getElementById('char-speed').value = character.speed;
        document.getElementById('char-proficiency').value = character.proficiencyBonus;
        document.getElementById('char-str').value = character.abilities.strength;
        document.getElementById('char-dex').value = character.abilities.dexterity;
        document.getElementById('char-con').value = character.abilities.constitution;
        document.getElementById('char-int').value = character.abilities.intelligence;
        document.getElementById('char-wis').value = character.abilities.wisdom;
        document.getElementById('char-cha').value = character.abilities.charisma;
        document.getElementById('char-attacks').value = character.attacks;
        document.getElementById('char-notes').value = character.notes;
    }

    setDefaultCharacterValues() {
        const level = parseInt(document.getElementById('char-level').value) || 1;
        const proficiencyBonus = Math.ceil(level / 4) + 1;
        document.getElementById('char-proficiency').value = proficiencyBonus;
        
        // Set different defaults based on character type
        if (this.currentCharacterType === 'monster') {
            document.getElementById('char-class').placeholder = 'e.g., Goblin, Dragon';
            document.getElementById('char-race').placeholder = 'e.g., Beast, Humanoid';
        } else if (this.currentCharacterType === 'npc') {
            document.getElementById('char-class').placeholder = 'e.g., Shopkeeper, Guard';
            document.getElementById('char-race').placeholder = 'e.g., Human, Elf';
        }
    }

    saveCharacter() {
        const formData = new FormData(document.getElementById('character-form'));
        
        const characterData = {
            name: formData.get('name'),
            type: this.currentCharacterType,
            class: formData.get('class'),
            race: formData.get('race'),
            level: parseInt(formData.get('level')),
            maxHp: parseInt(formData.get('hp')),
            ac: parseInt(formData.get('ac')),
            speed: parseInt(formData.get('speed')),
            proficiencyBonus: parseInt(formData.get('proficiencyBonus')),
            abilities: {
                strength: parseInt(formData.get('strength')),
                dexterity: parseInt(formData.get('dexterity')),
                constitution: parseInt(formData.get('constitution')),
                intelligence: parseInt(formData.get('intelligence')),
                wisdom: parseInt(formData.get('wisdom')),
                charisma: parseInt(formData.get('charisma'))
            },
            attacks: formData.get('attacks'),
            notes: formData.get('notes')
        };

        if (this.editingCharacter) {
            // Update existing character
            this.characterLibrary.updateCharacter(this.editingCharacter.id, characterData);
            this.showNotification('Character updated successfully', 'success');
        } else {
            // Create new character
            const character = new Character(characterData.name, characterData.type);
            character.updateStats(characterData);
            character.updateAbilities(characterData.abilities);
            character.currentHp = characterData.maxHp;
            
            this.characterLibrary.addCharacter(character);
            this.showNotification('Character created successfully', 'success');
        }

        this.closeModal(document.getElementById('character-modal'));
        this.updateCharacterList();
    }

    deleteCharacter(characterId) {
        if (confirm('Are you sure you want to delete this character?')) {
            this.characterLibrary.removeCharacter(characterId);
            this.updateCharacterList();
            this.showNotification('Character deleted successfully', 'success');
        }
    }

    duplicateCharacter(characterId) {
        const duplicate = this.characterLibrary.duplicateCharacter(characterId);
        if (duplicate) {
            this.updateCharacterList();
            this.showNotification('Character duplicated successfully', 'success');
        }
    }

    // Library Management
    showLibraryModal() {
        const modal = document.getElementById('library-modal');
        modal.style.display = 'block';
        this.updateLibraryList('player');
    }

    updateLibraryList(type) {
        const libraryList = document.getElementById('library-character-list');
        const characters = this.characterLibrary.getCharactersByType(type);
        
        libraryList.innerHTML = '';
        
        if (characters.length === 0) {
            libraryList.innerHTML = '<p style="text-align: center; color: #b0b0b0;">No characters found</p>';
            return;
        }

        characters.forEach(character => {
            const item = document.createElement('div');
            item.className = `library-character-item ${character.type}`;
            item.innerHTML = `
                <div class="character-header">
                    <div>
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-details">Level ${character.level} | HP: ${character.maxHp} | AC: ${character.ac}</div>
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.addCharacterToEncounter(character);
            });
            
            libraryList.appendChild(item);
        });
    }

    addCharacterToEncounter(character) {
        // Create a copy of the character for the encounter
        const encounterCharacter = character.clone();
        
        // Convert to Player for encounter system
        const player = new Player(encounterCharacter.name, encounterCharacter.maxHp, 
                                encounterCharacter.ac, encounterCharacter.initiativeModifier, 
                                encounterCharacter.type);
        
        // Copy additional character data
        player.class = encounterCharacter.class;
        player.race = encounterCharacter.race;
        player.level = encounterCharacter.level;
        player.abilities = encounterCharacter.abilities;
        player.attacks = encounterCharacter.attacks;
        player.notes = encounterCharacter.notes;
        
        const result = this.game.addPlayer(player.name, player.maxHp, player.ac, 
                                         player.initiativeModifier, player.type);
        
        if (result.success) {
            this.closeModal(document.getElementById('library-modal'));
            this.updateEncounterParticipants();
            this.showNotification(`${character.name} added to encounter`, 'success');
        }
    }

    // Encounter Management
    loadAllPlayers() {
        const players = this.characterLibrary.getPlayers();
        let addedCount = 0;
        
        players.forEach(character => {
            const player = new Player(character.name, character.maxHp, character.ac, 
                                    character.initiativeModifier, character.type);
            
            const result = this.game.addPlayer(player.name, player.maxHp, player.ac, 
                                             player.initiativeModifier, player.type);
            if (result.success) {
                addedCount++;
            }
        });

        this.updateEncounterParticipants();
        this.showNotification(`${addedCount} players loaded into encounter`, 'success');
    }

    showInitiativeInputs() {
        const participants = this.game.getCurrentEncounter().getAllPlayers();
        if (participants.length === 0) {
            this.showNotification('No participants in encounter', 'error');
            return;
        }

        // Set all initiatives to 0 first
        participants.forEach(player => {
            player.initiative = 0;
        });

        this.updateEncounterParticipants();
        this.showNotification('Set initiative for each participant', 'info');
    }

    setParticipantInitiative(playerId, initiative) {
        const result = this.game.setPlayerInitiative(playerId, parseInt(initiative));
        if (result.success) {
            this.updateEncounterParticipants();
            
            // Check if all participants have initiative set
            const participants = this.game.getCurrentEncounter().getAllPlayers();
            const allSet = participants.every(p => p.initiative > 0);
            
            if (allSet) {
                document.getElementById('start-encounter-btn').disabled = false;
                this.showNotification('All initiatives set! Ready to start encounter.', 'success');
            }
        }
    }

    removeParticipant(playerId) {
        const result = this.game.removePlayer(playerId);
        if (result.success) {
            this.updateEncounterParticipants();
            this.showNotification('Participant removed from encounter', 'success');
        }
    }

    startEncounter() {
        const participants = this.game.getCurrentEncounter().getAllPlayers();
        if (participants.length === 0) {
            this.showNotification('Add participants before starting encounter', 'error');
            return;
        }
        
        const hasInitiatives = participants.some(p => p.initiative > 0);
        if (!hasInitiatives) {
            this.showNotification('Set initiative before starting encounter', 'error');
            return;
        }
        
        const result = this.game.startEncounter();
        if (result.success) {
            this.showNotification('Encounter started! Combat begins!', 'success');
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    endEncounter() {
        if (!this.game.getCurrentEncounter().isActive) {
            this.showNotification('No active encounter to end', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to end the encounter? This will stop combat and reset turn order.')) {
            const result = this.game.endEncounter();
            if (result.success) {
                this.showNotification('Encounter ended successfully', 'info');
            } else {
                this.showNotification('Failed to end encounter', 'error');
            }
        }
    }

    resetEncounter() {
        if (confirm('Are you sure you want to reset the encounter? This will restore all participants to full HP and clear all conditions.')) {
            const result = this.game.resetEncounter();
            if (result.success) {
                this.showNotification('Encounter reset successfully', 'success');
            } else {
                this.showNotification('Failed to reset encounter', 'error');
            }
        }
    }

    newEncounter() {
        if (confirm('Create a new encounter? This will clear all current participants.')) {
            const name = prompt('Enter encounter name:', 'New Encounter');
            if (name) {
                this.game.createNewEncounter(name);
                this.updateUI();
                this.showNotification('New encounter created', 'success');
            }
        }
    }

    saveEncounter() {
        const name = prompt('Enter encounter name:', this.game.getCurrentEncounter().name);
        if (name) {
            const result = this.game.saveEncounter(name);
            if (result.success) {
                this.showNotification('Encounter saved successfully', 'success');
            } else {
                this.showNotification('Failed to save encounter', 'error');
            }
        }
    }

    loadEncounter() {
        const encounters = this.game.getSavedEncounters();
        if (encounters.length === 0) {
            this.showNotification('No saved encounters found', 'info');
            return;
        }

        const encounterList = encounters.map(e => `${e.name} (${e.players.length} participants)`).join('\n');
        const selectedName = prompt(`Select encounter to load:\n${encounterList}\n\nEnter exact name:`);
        
        if (selectedName) {
            const encounter = encounters.find(e => e.name === selectedName);
            if (encounter) {
                const result = this.game.loadEncounter(encounter.id);
                if (result.success) {
                    this.updateUI();
                    this.showNotification('Encounter loaded successfully', 'success');
                } else {
                    this.showNotification('Failed to load encounter', 'error');
                }
            } else {
                this.showNotification('Encounter not found', 'error');
            }
        }
    }

    // Combat Management
    nextTurn() {
        const result = this.game.nextTurn();
        if (result.success) {
            this.showNotification(`${result.currentPlayer.name}'s turn (Round ${result.round})`, 'info');
        }
    }

    previousTurn() {
        const result = this.game.previousTurn();
        if (result.success) {
            this.showNotification(`${result.currentPlayer.name}'s turn (Round ${result.round})`, 'info');
        }
    }

    showAddConditionModal() {
        const currentPlayer = this.game.getCurrentEncounter().getCurrentPlayer();
        if (!currentPlayer) {
            this.showNotification('No active participant selected', 'error');
            return;
        }

        const conditionName = prompt('Enter condition name:');
        if (conditionName) {
            const duration = prompt('Enter duration (rounds, -1 for permanent):', '-1');
            const description = prompt('Enter description (optional):') || '';
            
            const result = this.game.addCondition(currentPlayer.id, conditionName, parseInt(duration), description);
            if (result.success) {
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    showDealDamageModal() {
        const currentPlayer = this.game.getCurrentEncounter().getCurrentPlayer();
        if (!currentPlayer) {
            this.showNotification('No active participant selected', 'error');
            return;
        }

        const damage = prompt(`Deal damage to ${currentPlayer.name}:`);
        if (damage && !isNaN(damage)) {
            const result = this.game.dealDamage(currentPlayer.id, parseInt(damage));
            if (result.success) {
                this.showNotification(result.message, 'info');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    showHealModal() {
        const currentPlayer = this.game.getCurrentEncounter().getCurrentPlayer();
        if (!currentPlayer) {
            this.showNotification('No active participant selected', 'error');
            return;
        }

        const healing = prompt(`Heal ${currentPlayer.name}:`);
        if (healing && !isNaN(healing)) {
            const result = this.game.healPlayer(currentPlayer.id, parseInt(healing));
            if (result.success) {
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    // Quick action methods for initiative list
    quickDamageParticipant(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const damage = prompt(`Deal damage to ${participant.name}:`);
        if (damage && !isNaN(damage)) {
            const result = this.game.dealDamage(participantId, parseInt(damage));
            if (result.success) {
                this.showNotification(`${participant.name} takes ${damage} damage`, 'info');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    quickHealParticipant(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const healing = prompt(`Heal ${participant.name}:`);
        if (healing && !isNaN(healing)) {
            const result = this.game.healPlayer(participantId, parseInt(healing));
            if (result.success) {
                this.showNotification(`${participant.name} heals ${healing} HP`, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    quickAddCondition(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const conditionName = prompt(`Add condition to ${participant.name}:`);
        if (conditionName) {
            const duration = prompt('Enter duration (rounds, -1 for permanent):', '-1');
            const description = prompt('Enter description (optional):') || '';
            
            const result = this.game.addCondition(participantId, conditionName, parseInt(duration), description);
            if (result.success) {
                this.showNotification(`${conditionName} applied to ${participant.name}`, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    showParticipantActions(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const actions = [
            'Deal Damage',
            'Heal',
            'Add Condition',
            'Remove Condition',
            'Set HP',
            'View Details',
            'Cancel'
        ];

        const action = prompt(`Actions for ${participant.name}:\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nEnter number (1-${actions.length}):`);
        
        if (action && !isNaN(action)) {
            const actionIndex = parseInt(action) - 1;
            
            switch (actionIndex) {
                case 0: // Deal Damage
                    this.quickDamageParticipant(participantId);
                    break;
                case 1: // Heal
                    this.quickHealParticipant(participantId);
                    break;
                case 2: // Add Condition
                    this.quickAddCondition(participantId);
                    break;
                case 3: // Remove Condition
                    this.showRemoveConditionForParticipant(participantId);
                    break;
                case 4: // Set HP
                    this.setParticipantHP(participantId);
                    break;
                case 5: // View Details
                    this.showParticipantDetails(participantId);
                    break;
                case 6: // Cancel
                    return;
                default:
                    this.showNotification('Invalid action selected', 'error');
            }
        }
    }

    showRemoveConditionForParticipant(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        if (participant.conditions.length === 0) {
            this.showNotification(`${participant.name} has no conditions`, 'info');
            return;
        }

        const conditionsList = participant.conditions.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
        const selection = prompt(`Remove condition from ${participant.name}:\n${conditionsList}\n\nEnter number:`);
        
        if (selection && !isNaN(selection)) {
            const conditionIndex = parseInt(selection) - 1;
            if (conditionIndex >= 0 && conditionIndex < participant.conditions.length) {
                const conditionName = participant.conditions[conditionIndex].name;
                const result = this.game.removeCondition(participantId, conditionName);
                if (result.success) {
                    this.showNotification(`${conditionName} removed from ${participant.name}`, 'success');
                } else {
                    this.showNotification(result.message, 'error');
                }
            } else {
                this.showNotification('Invalid selection', 'error');
            }
        }
    }

    setParticipantHP(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const newHP = prompt(`Set HP for ${participant.name} (current: ${participant.currentHp}/${participant.maxHp}):`);
        if (newHP && !isNaN(newHP)) {
            const hp = Math.max(0, Math.min(participant.maxHp, parseInt(newHP)));
            const difference = hp - participant.currentHp;
            
            if (difference > 0) {
                this.game.healPlayer(participantId, difference);
                this.showNotification(`${participant.name} HP set to ${hp}`, 'success');
            } else if (difference < 0) {
                this.game.dealDamage(participantId, Math.abs(difference));
                this.showNotification(`${participant.name} HP set to ${hp}`, 'info');
            } else {
                this.showNotification('HP unchanged', 'info');
            }
        }
    }

    showParticipantDetails(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const details = [
            `Name: ${participant.name}`,
            `Type: ${participant.type}`,
            `HP: ${participant.currentHp}/${participant.maxHp}`,
            `AC: ${participant.ac}`,
            `Initiative: ${participant.initiative}`,
            `Status: ${participant.isAlive ? 'Alive' : 'Dead'}`,
            participant.class ? `Class: ${participant.class}` : '',
            participant.race ? `Race: ${participant.race}` : '',
            participant.level ? `Level: ${participant.level}` : '',
            participant.conditions.length > 0 ? `Conditions: ${participant.conditions.map(c => c.name).join(', ')}` : '',
            participant.attacks ? `Attacks: ${participant.attacks}` : '',
            participant.notes ? `Notes: ${participant.notes}` : ''
        ].filter(detail => detail).join('\n');

        alert(`${participant.name} Details:\n\n${details}`);
    }

    // UI Updates
    updateUI() {
        if (this.currentTab === 'characters') {
            this.updateCharacterList();
        } else if (this.currentTab === 'encounter') {
            this.updateEncounterParticipants();
            this.updateEncounterControls();
        }
        
        this.updateInitiativeList();
        this.updateConditionsList();
    }

    updateCharacterList() {
        const characterList = document.getElementById('character-list');
        const characters = this.characterLibrary.getCharactersByType(this.currentCharacterType);
        
        characterList.innerHTML = '';
        
        if (characters.length === 0) {
            characterList.innerHTML = '<p style="text-align: center; color: #b0b0b0; margin-top: 20px;">No characters found. Click "Add New Character" to create one.</p>';
            return;
        }

        characters.forEach(character => {
            const item = document.createElement('div');
            item.className = `character-item ${character.type}`;
            item.innerHTML = `
                <div class="character-header">
                    <div>
                        <div class="character-name">${character.getDisplayName()}</div>
                        <div class="character-details">Level ${character.level} | HP: ${character.maxHp} | AC: ${character.ac}</div>
                        <div class="character-details">Init: ${character.initiativeModifier >= 0 ? '+' : ''}${character.initiativeModifier} | Status: ${character.getStatusText()}</div>
                    </div>
                    <div class="character-actions">
                        <button class="btn btn-primary btn-sm" onclick="uiManager.showCharacterModal(uiManager.characterLibrary.getCharacter('${character.id}'))">Edit</button>
                        <button class="btn btn-secondary btn-sm" onclick="uiManager.duplicateCharacter('${character.id}')">Duplicate</button>
                        <button class="btn btn-danger btn-sm" onclick="uiManager.deleteCharacter('${character.id}')">Delete</button>
                    </div>
                </div>
                <div class="character-stats-grid">
                    <div class="stat">
                        <span class="stat-label">STR</span>
                        <span class="stat-value">${character.abilities.strength} (${character.getStrengthModifier() >= 0 ? '+' : ''}${character.getStrengthModifier()})</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">DEX</span>
                        <span class="stat-value">${character.abilities.dexterity} (${character.getDexterityModifier() >= 0 ? '+' : ''}${character.getDexterityModifier()})</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">CON</span>
                        <span class="stat-value">${character.abilities.constitution} (${character.getConstitutionModifier() >= 0 ? '+' : ''}${character.getConstitutionModifier()})</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Speed</span>
                        <span class="stat-value">${character.speed} ft</span>
                    </div>
                </div>
                ${character.attacks ? `<div class="character-details"><strong>Attacks:</strong> ${character.attacks}</div>` : ''}
                ${character.notes ? `<div class="character-details"><strong>Notes:</strong> ${character.notes}</div>` : ''}
            `;
            
            characterList.appendChild(item);
        });
    }

    updateEncounterParticipants() {
        const participantList = document.getElementById('encounter-participant-list');
        const participants = this.game.getCurrentEncounter().getAllPlayers();
        
        participantList.innerHTML = '';
        
        if (participants.length === 0) {
            participantList.innerHTML = '<p style="text-align: center; color: #b0b0b0; margin-top: 20px;">No participants in encounter. Use "Load All Players" or "Add from Library" to add participants.</p>';
            return;
        }

        participants.forEach(participant => {
            const item = document.createElement('div');
            item.className = `encounter-participant-item ${participant.type}`;
            item.innerHTML = `
                <div class="participant-info">
                    <div class="participant-name">${participant.name}</div>
                    <div class="participant-details">HP: ${participant.currentHp}/${participant.maxHp} | AC: ${participant.ac} | Type: ${participant.type}</div>
                </div>
                <div class="participant-actions">
                    <input type="number" class="initiative-input" value="${participant.initiative}" 
                           placeholder="Init" onchange="uiManager.setParticipantInitiative('${participant.id}', this.value)">
                    <button class="btn btn-danger btn-sm" onclick="uiManager.removeParticipant('${participant.id}')">Remove</button>
                </div>
            `;
            
            participantList.appendChild(item);
        });
    }

    updateEncounterControls() {
        const encounter = this.game.getCurrentEncounter();
        const startBtn = document.getElementById('start-encounter-btn');
        const endBtn = document.getElementById('end-encounter-btn');
        const nextBtn = document.getElementById('next-turn-btn');
        const prevBtn = document.getElementById('prev-turn-btn');
        const currentTurnInfo = document.getElementById('current-turn-info');
        
        const hasParticipants = encounter.getAllPlayers().length > 0;
        const hasInitiatives = encounter.getAllPlayers().some(p => p.initiative > 0);
        
        startBtn.disabled = !hasInitiatives || encounter.isActive;
        endBtn.disabled = !encounter.isActive;
        nextBtn.disabled = !encounter.isActive;
        prevBtn.disabled = !encounter.isActive;
        
        if (encounter.isActive) {
            const currentPlayer = encounter.getCurrentPlayer();
            const round = encounter.getCurrentRound();
            currentTurnInfo.textContent = currentPlayer ? 
                `${currentPlayer.name} (Round ${round})` : 
                'No active participant';
        } else {
            currentTurnInfo.textContent = 'Not started';
        }
    }

    updateInitiativeList() {
        const initiativeList = document.getElementById('initiative-list');
        const encounter = this.game.getCurrentEncounter();
        const participants = encounter.getInitiativeOrder();
        const currentPlayer = encounter.getCurrentPlayer();
        
        initiativeList.innerHTML = '';
        
        if (participants.length === 0) {
            initiativeList.innerHTML = '<p style="text-align: center; color: #b0b0b0; margin-top: 20px;">No participants in initiative order</p>';
            return;
        }
        
        participants.forEach((participant, index) => {
            const initiativeItem = document.createElement('div');
            initiativeItem.className = `initiative-item ${currentPlayer && currentPlayer.id === participant.id ? 'current-turn' : ''}`;
            
            const hpPercentage = participant.getHpPercentage();
            const conditions = participant.conditions.map(c => c.name).join(', ');
            
            initiativeItem.innerHTML = `
                <div class="initiative-header">
                    <span class="initiative-name">${participant.name}</span>
                    <div class="initiative-actions">
                        <span class="initiative-value">${participant.initiative}</span>
                        <div class="participant-quick-actions">
                            <button class="btn btn-sm btn-danger" onclick="uiManager.quickDamageParticipant('${participant.id}')" title="Deal Damage">-HP</button>
                            <button class="btn btn-sm btn-success" onclick="uiManager.quickHealParticipant('${participant.id}')" title="Heal">+HP</button>
                            <button class="btn btn-sm btn-warning" onclick="uiManager.quickAddCondition('${participant.id}')" title="Add Condition">+Cond</button>
                        </div>
                    </div>
                </div>
                <div class="initiative-stats">
                    <div class="stat">
                        <span class="stat-label">HP</span>
                        <span class="stat-value">${participant.currentHp}/${participant.maxHp}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">AC</span>
                        <span class="stat-value">${participant.ac}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Status</span>
                        <span class="stat-value">${participant.isAlive ? 'Alive' : 'Dead'}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Type</span>
                        <span class="stat-value">${participant.type}</span>
                    </div>
                </div>
                <div class="hp-bar" onclick="uiManager.showParticipantActions('${participant.id}')" title="Click for more actions">
                    <div class="hp-fill" style="width: ${hpPercentage}%; background-color: ${participant.getStatusColor()}"></div>
                </div>
                ${conditions ? `<div class="conditions">Conditions: ${conditions}</div>` : ''}
            `;
            
            initiativeList.appendChild(initiativeItem);
        });
    }

    updateConditionsList() {
        const conditionsList = document.getElementById('active-conditions');
        const conditions = this.game.getCurrentEncounter().getAllConditions();
        
        conditionsList.innerHTML = '';
        
        if (conditions.length === 0) {
            conditionsList.innerHTML = '<p style="text-align: center; color: #b0b0b0; margin-top: 10px;">No active conditions</p>';
            return;
        }
        
        conditions.forEach(condition => {
            const conditionItem = document.createElement('div');
            conditionItem.className = 'condition-item';
            conditionItem.innerHTML = `
                <div class="condition-info">
                    <div class="condition-name">${condition.name}</div>
                    <div class="condition-target">Target: ${condition.playerName}</div>
                    <div class="condition-duration">Duration: ${condition.duration === -1 ? 'Permanent' : condition.duration + ' rounds'}</div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="uiManager.removeCondition('${condition.playerId}', '${condition.name}')">Remove</button>
            `;
            conditionsList.appendChild(conditionItem);
        });
    }

    removeCondition(playerId, conditionName) {
        const result = this.game.removeCondition(playerId, conditionName);
        if (result.success) {
            this.showNotification(result.message, 'success');
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Utility Methods
    closeModal(modal) {
        modal.style.display = 'none';
        this.editingCharacter = null;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    this.newEncounter();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveEncounter();
                    break;
            }
        } else {
            switch (e.key) {
                case 'n':
                    if (document.activeElement.tagName !== 'INPUT' && this.game.getCurrentEncounter().isActive) {
                        this.nextTurn();
                    }
                    break;
                case 'p':
                    if (document.activeElement.tagName !== 'INPUT' && this.game.getCurrentEncounter().isActive) {
                        this.previousTurn();
                    }
                    break;
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add notification animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .btn-sm {
        padding: 5px 10px;
        font-size: 12px;
    }
    
    .conditions {
        margin-top: 10px;
        padding: 5px;
        background: #4a4a4a;
        border-radius: 4px;
        font-size: 12px;
        color: #ffc107;
    }
`;
document.head.appendChild(style);

// Initialize the UI Manager
const uiManager = new UIManager();

document.addEventListener('DOMContentLoaded', () => {
    uiManager.updateUI();
});