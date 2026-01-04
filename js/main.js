/**
 * UIManager - Main UI controller for D&D Initiative Tracker
 * Refactored to use safe DOM methods and custom modals
 */
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

        // Event delegation for character list
        document.getElementById('character-list').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (btn) {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                this.handleCharacterAction(action, id);
            }
        });

        // Event delegation for encounter participants
        document.getElementById('encounter-participant-list').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (btn) {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                this.handleParticipantAction(action, id);
            }
        });

        // Event delegation for encounter participants initiative input
        document.getElementById('encounter-participant-list').addEventListener('change', (e) => {
            if (e.target.classList.contains('initiative-input')) {
                const id = e.target.dataset.id;
                this.setParticipantInitiative(id, e.target.value);
            }
        });

        // Event delegation for initiative list
        document.getElementById('initiative-list').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (btn) {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                this.handleInitiativeAction(action, id);
            }

            // HP bar click for more actions
            const hpBar = e.target.closest('.hp-bar[data-id]');
            if (hpBar) {
                this.showParticipantActions(hpBar.dataset.id);
            }
        });

        // Event delegation for conditions list
        document.getElementById('active-conditions').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (btn) {
                const playerId = btn.dataset.playerId;
                const conditionName = btn.dataset.conditionName;
                this.removeCondition(playerId, conditionName);
            }
        });
    }

    // Handle character list button actions
    handleCharacterAction(action, id) {
        switch (action) {
            case 'edit':
                this.showCharacterModal(this.characterLibrary.getCharacter(id));
                break;
            case 'duplicate':
                this.duplicateCharacter(id);
                break;
            case 'delete':
                this.deleteCharacter(id);
                break;
        }
    }

    // Handle participant list button actions
    handleParticipantAction(action, id) {
        switch (action) {
            case 'remove':
                this.removeParticipant(id);
                break;
        }
    }

    // Handle initiative list button actions
    handleInitiativeAction(action, id) {
        switch (action) {
            case 'damage':
                this.quickDamageParticipant(id);
                break;
            case 'heal':
                this.quickHealParticipant(id);
                break;
            case 'condition':
                this.quickAddCondition(id);
                break;
        }
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

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        this.updateUI();
    }

    switchCharacterType(type) {
        this.currentCharacterType = type;

        document.querySelectorAll('.character-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        this.updateCharacterList();
    }

    switchLibraryTab(type) {
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
        const title = document.getElementById('character-modal-title');

        title.textContent = character ? 'Edit Character' : `Add New ${this.currentCharacterType}`;

        if (character) {
            this.populateCharacterForm(character);
        } else {
            form.reset();
            this.setDefaultCharacterValues();
        }

        modal.showModal();
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
    }

    saveCharacter() {
        const formData = new FormData(document.getElementById('character-form'));

        const characterData = {
            name: formData.get('name'),
            type: this.currentCharacterType,
            class: formData.get('class'),
            race: formData.get('race'),
            level: parseInt(formData.get('level')) || 1,
            maxHp: parseInt(formData.get('hp')) || 10,
            ac: parseInt(formData.get('ac')) || 10,
            speed: parseInt(formData.get('speed')) || 30,
            proficiencyBonus: parseInt(formData.get('proficiencyBonus')) || 2,
            abilities: {
                strength: parseInt(formData.get('strength')) || 10,
                dexterity: parseInt(formData.get('dexterity')) || 10,
                constitution: parseInt(formData.get('constitution')) || 10,
                intelligence: parseInt(formData.get('intelligence')) || 10,
                wisdom: parseInt(formData.get('wisdom')) || 10,
                charisma: parseInt(formData.get('charisma')) || 10
            },
            attacks: formData.get('attacks'),
            notes: formData.get('notes')
        };

        // Validate
        if (!characterData.name || characterData.name.trim() === '') {
            this.showNotification('Character name is required', 'error');
            return;
        }

        if (this.editingCharacter) {
            this.characterLibrary.updateCharacter(this.editingCharacter.id, characterData);
            this.showNotification('Character updated successfully', 'success');
        } else {
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

    async deleteCharacter(characterId) {
        const confirmed = await modalManager.confirm({
            title: 'Delete Character',
            message: 'Are you sure you want to delete this character?',
            confirmText: 'Delete',
            dangerous: true
        });

        if (confirmed) {
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
        modal.showModal();
        this.updateLibraryList('player');
    }

    updateLibraryList(type) {
        const libraryList = document.getElementById('library-character-list');
        const characters = this.characterLibrary.getCharactersByType(type);

        DOMHelpers.clearChildren(libraryList);

        if (characters.length === 0) {
            const emptyMsg = DOMHelpers.createElement('p', {
                className: 'empty-message',
                text: 'No characters found',
                style: { textAlign: 'center', color: '#b0b0b0' }
            });
            libraryList.appendChild(emptyMsg);
            return;
        }

        characters.forEach(character => {
            const item = DOMHelpers.createElement('div', {
                className: `library-character-item ${character.type}`,
                events: {
                    click: () => this.addCharacterToEncounter(character)
                },
                children: [
                    DOMHelpers.createElement('div', {
                        className: 'character-header',
                        children: [
                            DOMHelpers.createElement('div', {
                                children: [
                                    DOMHelpers.createElement('div', {
                                        className: 'character-name',
                                        text: character.getDisplayName()
                                    }),
                                    DOMHelpers.createElement('div', {
                                        className: 'character-details',
                                        text: `Level ${character.level} | HP: ${character.maxHp} | AC: ${character.ac}`
                                    })
                                ]
                            })
                        ]
                    })
                ]
            });

            libraryList.appendChild(item);
        });
    }

    addCharacterToEncounter(character) {
        const encounterCharacter = character.clone();

        const result = this.game.addPlayer(
            encounterCharacter.name,
            encounterCharacter.maxHp,
            encounterCharacter.ac,
            encounterCharacter.initiativeModifier,
            encounterCharacter.type
        );

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
            const result = this.game.addPlayer(
                character.name,
                character.maxHp,
                character.ac,
                character.initiativeModifier,
                character.type
            );
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

    async endEncounter() {
        if (!this.game.getCurrentEncounter().isActive) {
            this.showNotification('No active encounter to end', 'info');
            return;
        }

        const confirmed = await modalManager.confirm({
            title: 'End Encounter',
            message: 'Are you sure you want to end the encounter? This will stop combat and reset turn order.',
            confirmText: 'End Encounter',
            dangerous: true
        });

        if (confirmed) {
            const result = this.game.endEncounter();
            if (result.success) {
                this.showNotification('Encounter ended successfully', 'info');
            }
        }
    }

    async resetEncounter() {
        const confirmed = await modalManager.confirm({
            title: 'Reset Encounter',
            message: 'Are you sure you want to reset the encounter? This will restore all participants to full HP and clear all conditions.',
            confirmText: 'Reset',
            dangerous: true
        });

        if (confirmed) {
            const result = this.game.resetEncounter();
            if (result.success) {
                this.showNotification('Encounter reset successfully', 'success');
            }
        }
    }

    async newEncounter() {
        const confirmed = await modalManager.confirm({
            title: 'New Encounter',
            message: 'Create a new encounter? This will clear all current participants.',
            confirmText: 'Create New'
        });

        if (confirmed) {
            const name = await modalManager.prompt({
                title: 'Encounter Name',
                message: 'Enter a name for the new encounter:',
                placeholder: 'New Encounter',
                defaultValue: 'New Encounter'
            });

            if (name) {
                this.game.createNewEncounter(name);
                this.updateUI();
                this.showNotification('New encounter created', 'success');
            }
        }
    }

    async saveEncounter() {
        const name = await modalManager.prompt({
            title: 'Save Encounter',
            message: 'Enter encounter name:',
            placeholder: 'Encounter name',
            defaultValue: this.game.getCurrentEncounter().name
        });

        if (name) {
            const result = this.game.saveEncounter(name);
            if (result.success) {
                this.showNotification('Encounter saved successfully', 'success');
            } else {
                this.showNotification('Failed to save encounter', 'error');
            }
        }
    }

    async loadEncounter() {
        const encounters = this.game.getSavedEncounters();
        if (encounters.length === 0) {
            this.showNotification('No saved encounters found', 'info');
            return;
        }

        const choices = encounters.map(e => ({
            value: e.id,
            text: `${e.name} (${e.players.length} participants)`
        }));

        const encounterId = await modalManager.select({
            title: 'Load Encounter',
            message: 'Select an encounter to load:',
            choices
        });

        if (encounterId) {
            const result = this.game.loadEncounter(encounterId);
            if (result.success) {
                this.updateUI();
                this.showNotification('Encounter loaded successfully', 'success');
            } else {
                this.showNotification('Failed to load encounter', 'error');
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

    async showAddConditionModal() {
        const currentPlayer = this.game.getCurrentEncounter().getCurrentPlayer();
        if (!currentPlayer) {
            this.showNotification('No active participant selected', 'error');
            return;
        }

        const data = await modalManager.form({
            title: `Add Condition to ${currentPlayer.name}`,
            fields: [
                { name: 'conditionName', label: 'Condition Name', type: 'text', required: true, placeholder: 'e.g., Poisoned' },
                { name: 'duration', label: 'Duration (rounds, -1 for permanent)', type: 'number', value: '-1' },
                { name: 'description', label: 'Description (optional)', type: 'textarea' }
            ],
            submitText: 'Add Condition'
        });

        if (data) {
            const result = this.game.addCondition(
                currentPlayer.id,
                data.conditionName,
                parseInt(data.duration),
                data.description
            );
            if (result.success) {
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    async showDealDamageModal() {
        const currentPlayer = this.game.getCurrentEncounter().getCurrentPlayer();
        if (!currentPlayer) {
            this.showNotification('No active participant selected', 'error');
            return;
        }

        const damage = await modalManager.prompt({
            title: 'Deal Damage',
            message: `Deal damage to ${currentPlayer.name}:`,
            placeholder: 'Enter damage amount',
            type: 'number',
            min: 0
        });

        if (damage && !isNaN(damage)) {
            const result = this.game.dealDamage(currentPlayer.id, parseInt(damage));
            if (result.success) {
                this.showNotification(result.message, 'info');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    async showHealModal() {
        const currentPlayer = this.game.getCurrentEncounter().getCurrentPlayer();
        if (!currentPlayer) {
            this.showNotification('No active participant selected', 'error');
            return;
        }

        const healing = await modalManager.prompt({
            title: 'Heal',
            message: `Heal ${currentPlayer.name}:`,
            placeholder: 'Enter healing amount',
            type: 'number',
            min: 0
        });

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
    async quickDamageParticipant(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const damage = await modalManager.prompt({
            title: 'Deal Damage',
            message: `Deal damage to ${participant.name}:`,
            placeholder: 'Enter damage amount',
            type: 'number',
            min: 0
        });

        if (damage && !isNaN(damage)) {
            const result = this.game.dealDamage(participantId, parseInt(damage));
            if (result.success) {
                this.showNotification(`${participant.name} takes ${damage} damage`, 'info');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    async quickHealParticipant(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const healing = await modalManager.prompt({
            title: 'Heal',
            message: `Heal ${participant.name}:`,
            placeholder: 'Enter healing amount',
            type: 'number',
            min: 0
        });

        if (healing && !isNaN(healing)) {
            const result = this.game.healPlayer(participantId, parseInt(healing));
            if (result.success) {
                this.showNotification(`${participant.name} heals ${healing} HP`, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    async quickAddCondition(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const data = await modalManager.form({
            title: `Add Condition to ${participant.name}`,
            fields: [
                { name: 'conditionName', label: 'Condition Name', type: 'text', required: true, placeholder: 'e.g., Poisoned' },
                { name: 'duration', label: 'Duration (rounds, -1 for permanent)', type: 'number', value: '-1' }
            ],
            submitText: 'Add Condition'
        });

        if (data) {
            const result = this.game.addCondition(participantId, data.conditionName, parseInt(data.duration), '');
            if (result.success) {
                this.showNotification(`${data.conditionName} applied to ${participant.name}`, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    async showParticipantActions(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const action = await modalManager.select({
            title: `Actions for ${participant.name}`,
            message: 'Select an action:',
            choices: [
                { value: 'damage', text: 'Deal Damage' },
                { value: 'heal', text: 'Heal' },
                { value: 'condition', text: 'Add Condition' },
                { value: 'removeCondition', text: 'Remove Condition' },
                { value: 'setHP', text: 'Set HP' },
                { value: 'details', text: 'View Details' }
            ]
        });

        if (action) {
            switch (action) {
                case 'damage':
                    await this.quickDamageParticipant(participantId);
                    break;
                case 'heal':
                    await this.quickHealParticipant(participantId);
                    break;
                case 'condition':
                    await this.quickAddCondition(participantId);
                    break;
                case 'removeCondition':
                    await this.showRemoveConditionForParticipant(participantId);
                    break;
                case 'setHP':
                    await this.setParticipantHP(participantId);
                    break;
                case 'details':
                    await this.showParticipantDetails(participantId);
                    break;
            }
        }
    }

    async showRemoveConditionForParticipant(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        if (participant.conditions.length === 0) {
            this.showNotification(`${participant.name} has no conditions`, 'info');
            return;
        }

        const conditionName = await modalManager.select({
            title: `Remove Condition from ${participant.name}`,
            message: 'Select a condition to remove:',
            choices: participant.conditions.map(c => ({
                value: c.name,
                text: `${c.name} (${c.duration === -1 ? 'Permanent' : c.duration + ' rounds'})`
            }))
        });

        if (conditionName) {
            const result = this.game.removeCondition(participantId, conditionName);
            if (result.success) {
                this.showNotification(`${conditionName} removed from ${participant.name}`, 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        }
    }

    async setParticipantHP(participantId) {
        const participant = this.game.getCurrentEncounter().getPlayer(participantId);
        if (!participant) {
            this.showNotification('Participant not found', 'error');
            return;
        }

        const newHP = await modalManager.prompt({
            title: 'Set HP',
            message: `Set HP for ${participant.name} (current: ${participant.currentHp}/${participant.maxHp}):`,
            placeholder: 'Enter new HP value',
            type: 'number',
            min: 0,
            max: participant.maxHp,
            defaultValue: String(participant.currentHp)
        });

        if (newHP !== null && !isNaN(newHP)) {
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

    async showParticipantDetails(participantId) {
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
            participant.conditions.length > 0 ? `Conditions: ${participant.conditions.map(c => c.name).join(', ')}` : '',
            participant.notes ? `Notes: ${participant.notes}` : ''
        ].filter(detail => detail).join('\n');

        await modalManager.alert({
            title: `${participant.name} Details`,
            message: details,
            type: 'info'
        });
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

        DOMHelpers.clearChildren(characterList);

        if (characters.length === 0) {
            const emptyMsg = DOMHelpers.createElement('p', {
                className: 'empty-message',
                text: 'No characters found. Click "Add New Character" to create one.',
                style: { textAlign: 'center', color: '#b0b0b0', marginTop: '20px' }
            });
            characterList.appendChild(emptyMsg);
            return;
        }

        characters.forEach(character => {
            const item = this.createCharacterItem(character);
            characterList.appendChild(item);
        });
    }

    createCharacterItem(character) {
        const item = DOMHelpers.createElement('div', {
            className: `character-item ${character.type}`
        });

        // Header section
        const header = DOMHelpers.createElement('div', { className: 'character-header' });

        const info = DOMHelpers.createElement('div');
        info.appendChild(DOMHelpers.createElement('div', {
            className: 'character-name',
            text: character.getDisplayName()
        }));
        info.appendChild(DOMHelpers.createElement('div', {
            className: 'character-details',
            text: `Level ${character.level} | HP: ${character.maxHp} | AC: ${character.ac}`
        }));

        const initMod = character.initiativeModifier >= 0 ? '+' : '';
        info.appendChild(DOMHelpers.createElement('div', {
            className: 'character-details',
            text: `Init: ${initMod}${character.initiativeModifier} | Status: ${character.getStatusText()}`
        }));

        // Actions
        const actions = DOMHelpers.createElement('div', { className: 'character-actions' });
        actions.appendChild(DOMHelpers.createButton('Edit', 'btn btn-primary btn-sm', null, { action: 'edit', id: character.id }));
        actions.appendChild(DOMHelpers.createButton('Duplicate', 'btn btn-secondary btn-sm', null, { action: 'duplicate', id: character.id }));
        actions.appendChild(DOMHelpers.createButton('Delete', 'btn btn-danger btn-sm', null, { action: 'delete', id: character.id }));

        header.appendChild(info);
        header.appendChild(actions);
        item.appendChild(header);

        // Stats grid
        const statsGrid = DOMHelpers.createElement('div', { className: 'character-stats-grid' });
        const abilities = [
            { label: 'STR', value: character.abilities.strength, mod: character.getStrengthModifier() },
            { label: 'DEX', value: character.abilities.dexterity, mod: character.getDexterityModifier() },
            { label: 'CON', value: character.abilities.constitution, mod: character.getConstitutionModifier() },
            { label: 'Speed', value: character.speed, suffix: ' ft' }
        ];

        abilities.forEach(stat => {
            const statDiv = DOMHelpers.createElement('div', { className: 'stat' });
            statDiv.appendChild(DOMHelpers.createElement('span', { className: 'stat-label', text: stat.label }));

            let valueText;
            if (stat.mod !== undefined) {
                const modSign = stat.mod >= 0 ? '+' : '';
                valueText = `${stat.value} (${modSign}${stat.mod})`;
            } else {
                valueText = `${stat.value}${stat.suffix || ''}`;
            }
            statDiv.appendChild(DOMHelpers.createElement('span', { className: 'stat-value', text: valueText }));
            statsGrid.appendChild(statDiv);
        });

        item.appendChild(statsGrid);

        // Attacks and notes
        if (character.attacks) {
            const attacksDiv = DOMHelpers.createElement('div', { className: 'character-details' });
            attacksDiv.appendChild(DOMHelpers.createElement('strong', { text: 'Attacks: ' }));
            attacksDiv.appendChild(DOMHelpers.text(character.attacks));
            item.appendChild(attacksDiv);
        }

        if (character.notes) {
            const notesDiv = DOMHelpers.createElement('div', { className: 'character-details' });
            notesDiv.appendChild(DOMHelpers.createElement('strong', { text: 'Notes: ' }));
            notesDiv.appendChild(DOMHelpers.text(character.notes));
            item.appendChild(notesDiv);
        }

        return item;
    }

    updateEncounterParticipants() {
        const participantList = document.getElementById('encounter-participant-list');
        const participants = this.game.getCurrentEncounter().getAllPlayers();

        DOMHelpers.clearChildren(participantList);

        if (participants.length === 0) {
            const emptyMsg = DOMHelpers.createElement('p', {
                className: 'empty-message',
                text: 'No participants in encounter. Use "Load All Players" or "Add from Library" to add participants.',
                style: { textAlign: 'center', color: '#b0b0b0', marginTop: '20px' }
            });
            participantList.appendChild(emptyMsg);
            return;
        }

        participants.forEach(participant => {
            const item = this.createParticipantItem(participant);
            participantList.appendChild(item);
        });
    }

    createParticipantItem(participant) {
        const item = DOMHelpers.createElement('div', {
            className: `encounter-participant-item ${participant.type}`
        });

        const info = DOMHelpers.createElement('div', { className: 'participant-info' });
        info.appendChild(DOMHelpers.createElement('div', {
            className: 'participant-name',
            text: participant.name
        }));
        info.appendChild(DOMHelpers.createElement('div', {
            className: 'participant-details',
            text: `HP: ${participant.currentHp}/${participant.maxHp} | AC: ${participant.ac} | Type: ${participant.type}`
        }));

        const actions = DOMHelpers.createElement('div', { className: 'participant-actions' });

        const initInput = DOMHelpers.createInput('number', {
            className: 'initiative-input',
            value: participant.initiative,
            placeholder: 'Init'
        });
        initInput.dataset.id = participant.id;

        actions.appendChild(initInput);
        actions.appendChild(DOMHelpers.createButton('Remove', 'btn btn-danger btn-sm', null, {
            action: 'remove',
            id: participant.id
        }));

        item.appendChild(info);
        item.appendChild(actions);

        return item;
    }

    updateEncounterControls() {
        const encounter = this.game.getCurrentEncounter();
        const startBtn = document.getElementById('start-encounter-btn');
        const endBtn = document.getElementById('end-encounter-btn');
        const nextBtn = document.getElementById('next-turn-btn');
        const prevBtn = document.getElementById('prev-turn-btn');
        const currentTurnInfo = document.getElementById('current-turn-info');

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

        DOMHelpers.clearChildren(initiativeList);

        if (participants.length === 0) {
            const emptyMsg = DOMHelpers.createElement('p', {
                className: 'empty-message',
                text: 'No participants in initiative order',
                style: { textAlign: 'center', color: '#b0b0b0', marginTop: '20px' }
            });
            initiativeList.appendChild(emptyMsg);
            return;
        }

        participants.forEach(participant => {
            const item = this.createInitiativeItem(participant, currentPlayer);
            initiativeList.appendChild(item);
        });
    }

    createInitiativeItem(participant, currentPlayer) {
        const isCurrent = currentPlayer && currentPlayer.id === participant.id;
        const item = DOMHelpers.createElement('div', {
            className: `initiative-item ${isCurrent ? 'current-turn' : ''}`
        });

        // Header with name and actions
        const header = DOMHelpers.createElement('div', { className: 'initiative-header' });
        header.appendChild(DOMHelpers.createElement('span', {
            className: 'initiative-name',
            text: participant.name
        }));

        const actionsDiv = DOMHelpers.createElement('div', { className: 'initiative-actions' });
        actionsDiv.appendChild(DOMHelpers.createElement('span', {
            className: 'initiative-value',
            text: String(participant.initiative)
        }));

        const quickActions = DOMHelpers.createElement('div', { className: 'participant-quick-actions' });
        quickActions.appendChild(DOMHelpers.createButton('-HP', 'btn btn-sm btn-danger', null, { action: 'damage', id: participant.id }));
        quickActions.appendChild(DOMHelpers.createButton('+HP', 'btn btn-sm btn-success', null, { action: 'heal', id: participant.id }));
        quickActions.appendChild(DOMHelpers.createButton('+Cond', 'btn btn-sm btn-warning', null, { action: 'condition', id: participant.id }));

        actionsDiv.appendChild(quickActions);
        header.appendChild(actionsDiv);
        item.appendChild(header);

        // Stats
        const stats = DOMHelpers.createElement('div', { className: 'initiative-stats' });
        const statItems = [
            { label: 'HP', value: `${participant.currentHp}/${participant.maxHp}` },
            { label: 'AC', value: participant.ac },
            { label: 'Status', value: participant.isAlive ? 'Alive' : 'Dead' },
            { label: 'Type', value: participant.type }
        ];

        statItems.forEach(stat => {
            const statDiv = DOMHelpers.createElement('div', { className: 'stat' });
            statDiv.appendChild(DOMHelpers.createElement('span', { className: 'stat-label', text: stat.label }));
            statDiv.appendChild(DOMHelpers.createElement('span', { className: 'stat-value', text: String(stat.value) }));
            stats.appendChild(statDiv);
        });
        item.appendChild(stats);

        // HP Bar
        const hpPercentage = participant.getHpPercentage();
        const hpBar = DOMHelpers.createElement('div', {
            className: 'hp-bar',
            data: { id: participant.id },
            attrs: { title: 'Click for more actions' }
        });
        const hpFill = DOMHelpers.createElement('div', {
            className: 'hp-fill',
            style: {
                width: `${hpPercentage}%`,
                backgroundColor: participant.getStatusColor()
            }
        });
        hpBar.appendChild(hpFill);
        item.appendChild(hpBar);

        // Conditions
        if (participant.conditions.length > 0) {
            const conditionsDiv = DOMHelpers.createElement('div', {
                className: 'conditions',
                text: `Conditions: ${participant.conditions.map(c => c.name).join(', ')}`
            });
            item.appendChild(conditionsDiv);
        }

        return item;
    }

    updateConditionsList() {
        const conditionsList = document.getElementById('active-conditions');
        const conditions = this.game.getCurrentEncounter().getAllConditions();

        DOMHelpers.clearChildren(conditionsList);

        if (conditions.length === 0) {
            const emptyMsg = DOMHelpers.createElement('p', {
                className: 'empty-message',
                text: 'No active conditions',
                style: { textAlign: 'center', color: '#b0b0b0', marginTop: '10px' }
            });
            conditionsList.appendChild(emptyMsg);
            return;
        }

        conditions.forEach(condition => {
            const item = this.createConditionItem(condition);
            conditionsList.appendChild(item);
        });
    }

    createConditionItem(condition) {
        const item = DOMHelpers.createElement('div', { className: 'condition-item' });

        const info = DOMHelpers.createElement('div', { className: 'condition-info' });
        info.appendChild(DOMHelpers.createElement('div', { className: 'condition-name', text: condition.name }));
        info.appendChild(DOMHelpers.createElement('div', { className: 'condition-target', text: `Target: ${condition.playerName}` }));
        info.appendChild(DOMHelpers.createElement('div', {
            className: 'condition-duration',
            text: `Duration: ${condition.duration === -1 ? 'Permanent' : condition.duration + ' rounds'}`
        }));

        const removeBtn = DOMHelpers.createButton('Remove', 'btn btn-danger btn-sm', null, {
            action: 'remove',
            playerId: condition.playerId,
            conditionName: condition.name
        });

        item.appendChild(info);
        item.appendChild(removeBtn);

        return item;
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
        if (modal && typeof modal.close === 'function') {
            modal.close();
        }
        this.editingCharacter = null;
    }

    handleKeyboardShortcuts(e) {
        // Don't trigger shortcuts when typing in inputs or when a modal is open
        if (modalManager.activeModal) return;

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
                    if (document.activeElement.tagName !== 'INPUT' &&
                        document.activeElement.tagName !== 'TEXTAREA' &&
                        this.game.getCurrentEncounter().isActive) {
                        this.nextTurn();
                    }
                    break;
                case 'p':
                    if (document.activeElement.tagName !== 'INPUT' &&
                        document.activeElement.tagName !== 'TEXTAREA' &&
                        this.game.getCurrentEncounter().isActive) {
                        this.previousTurn();
                    }
                    break;
            }
        }
    }

    showNotification(message, type = 'info') {
        DOMHelpers.showNotification(message, type);
    }
}


// Initialize the UI Manager
const uiManager = new UIManager();

document.addEventListener('DOMContentLoaded', () => {
    uiManager.updateUI();
});
