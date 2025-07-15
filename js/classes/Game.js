class Game {
    constructor() {
        this.currentEncounter = new Encounter();
        this.savedEncounters = [];
        this.settings = {
            autoSort: true,
            showPlayerTypes: true,
            showConditions: true,
            confirmActions: true,
            theme: 'dark'
        };
        this.eventHandlers = {};
        this.loadFromStorage();
    }

    createNewEncounter(name = 'New Encounter') {
        this.currentEncounter = new Encounter(name);
        this.saveToStorage();
        this.emit('encounterCreated', this.currentEncounter);
        return this.currentEncounter;
    }

    loadEncounter(encounterId) {
        const encounter = this.savedEncounters.find(e => e.id === encounterId);
        if (encounter) {
            this.currentEncounter = encounter;
            this.saveToStorage();
            this.emit('encounterLoaded', this.currentEncounter);
            return { success: true, encounter: encounter };
        }
        return { success: false, message: 'Encounter not found' };
    }

    saveEncounter(name = null) {
        if (name) {
            this.currentEncounter.name = name;
        }
        
        const existingIndex = this.savedEncounters.findIndex(e => e.id === this.currentEncounter.id);
        if (existingIndex !== -1) {
            this.savedEncounters[existingIndex] = this.currentEncounter;
        } else {
            this.savedEncounters.push(this.currentEncounter);
        }
        
        this.saveToStorage();
        this.emit('encounterSaved', this.currentEncounter);
        return { success: true, message: 'Encounter saved successfully' };
    }

    deleteEncounter(encounterId) {
        const index = this.savedEncounters.findIndex(e => e.id === encounterId);
        if (index !== -1) {
            const deleted = this.savedEncounters.splice(index, 1)[0];
            this.saveToStorage();
            this.emit('encounterDeleted', deleted);
            return { success: true, message: 'Encounter deleted successfully' };
        }
        return { success: false, message: 'Encounter not found' };
    }

    duplicateEncounter(encounterId) {
        const encounter = this.savedEncounters.find(e => e.id === encounterId);
        if (encounter) {
            const duplicate = encounter.clone();
            this.savedEncounters.push(duplicate);
            this.saveToStorage();
            this.emit('encounterDuplicated', duplicate);
            return { success: true, encounter: duplicate };
        }
        return { success: false, message: 'Encounter not found' };
    }

    addPlayer(name, hp, ac, initiativeModifier = 0, type = 'player') {
        const player = this.currentEncounter.addPlayer(name, hp, ac, initiativeModifier, type);
        this.saveToStorage();
        this.emit('playerAdded', player);
        return { success: true, player: player };
    }

    removePlayer(playerId) {
        const success = this.currentEncounter.removePlayer(playerId);
        if (success) {
            this.saveToStorage();
            this.emit('playerRemoved', playerId);
            return { success: true, message: 'Player removed successfully' };
        }
        return { success: false, message: 'Player not found' };
    }

    updatePlayer(playerId, updates) {
        const player = this.currentEncounter.updatePlayer(playerId, updates);
        if (player) {
            this.saveToStorage();
            this.emit('playerUpdated', player);
            return { success: true, player: player };
        }
        return { success: false, message: 'Player not found' };
    }

    startEncounter() {
        const result = this.currentEncounter.startEncounter();
        if (result.success) {
            this.saveToStorage();
            this.emit('encounterStarted', this.currentEncounter);
        }
        return result;
    }

    endEncounter() {
        const result = this.currentEncounter.endEncounter();
        if (result.success) {
            this.saveToStorage();
            this.emit('encounterEnded', this.currentEncounter);
        }
        return result;
    }

    nextTurn() {
        const result = this.currentEncounter.nextTurn();
        if (result.success) {
            this.saveToStorage();
            this.emit('turnChanged', result);
        }
        return result;
    }

    previousTurn() {
        const result = this.currentEncounter.previousTurn();
        if (result.success) {
            this.saveToStorage();
            this.emit('turnChanged', result);
        }
        return result;
    }

    dealDamage(playerId, amount) {
        const result = this.currentEncounter.dealDamage(playerId, amount);
        if (result.success) {
            this.saveToStorage();
            this.emit('damageDealt', { playerId, amount, result });
        }
        return result;
    }

    healPlayer(playerId, amount) {
        const result = this.currentEncounter.healPlayer(playerId, amount);
        if (result.success) {
            this.saveToStorage();
            this.emit('playerHealed', { playerId, amount, result });
        }
        return result;
    }

    addCondition(playerId, conditionName, duration = -1, description = '') {
        const result = this.currentEncounter.addCondition(playerId, conditionName, duration, description);
        if (result.success) {
            this.saveToStorage();
            this.emit('conditionAdded', { playerId, condition: result.condition });
        }
        return result;
    }

    removeCondition(playerId, conditionName) {
        const result = this.currentEncounter.removeCondition(playerId, conditionName);
        if (result.success) {
            this.saveToStorage();
            this.emit('conditionRemoved', { playerId, conditionName });
        }
        return result;
    }

    rollInitiative() {
        this.currentEncounter.initiative.rollInitiativeForAll();
        this.saveToStorage();
        this.emit('initiativeRolled', this.currentEncounter.getInitiativeOrder());
        return { success: true, message: 'Initiative rolled for all players' };
    }

    rollInitiativeForPlayer(playerId) {
        const initiative = this.currentEncounter.initiative.rollInitiativeForPlayer(playerId);
        if (initiative !== null) {
            this.saveToStorage();
            this.emit('playerInitiativeRolled', { playerId, initiative });
            return { success: true, initiative: initiative };
        }
        return { success: false, message: 'Player not found' };
    }

    setPlayerInitiative(playerId, initiativeValue) {
        const success = this.currentEncounter.initiative.setPlayerInitiative(playerId, initiativeValue);
        if (success) {
            this.saveToStorage();
            this.emit('playerInitiativeSet', { playerId, initiative: initiativeValue });
            return { success: true, initiative: initiativeValue };
        }
        return { success: false, message: 'Player not found' };
    }

    rollInitiativeManually() {
        const players = this.currentEncounter.initiative.rollInitiativeManually();
        this.saveToStorage();
        this.emit('manualInitiativeStarted', players);
        return { success: true, players: players };
    }

    resetEncounter() {
        this.currentEncounter.reset();
        this.saveToStorage();
        this.emit('encounterReset', this.currentEncounter);
        return { success: true, message: 'Encounter reset successfully' };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveToStorage();
        this.emit('settingsUpdated', this.settings);
        return { success: true, settings: this.settings };
    }

    getEncounterStats() {
        return this.currentEncounter.getEncounterStats();
    }

    getCurrentEncounter() {
        return this.currentEncounter;
    }

    getSavedEncounters() {
        return [...this.savedEncounters];
    }

    getSettings() {
        return { ...this.settings };
    }

    exportData() {
        const data = {
            currentEncounter: this.currentEncounter.toJSON(),
            savedEncounters: this.savedEncounters.map(e => e.toJSON()),
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.version !== '1.0') {
                return { success: false, message: 'Unsupported data version' };
            }

            this.currentEncounter = Encounter.fromJSON(data.currentEncounter);
            this.savedEncounters = data.savedEncounters.map(e => Encounter.fromJSON(e));
            this.settings = { ...this.settings, ...data.settings };
            
            this.saveToStorage();
            this.emit('dataImported', data);
            
            return { success: true, message: 'Data imported successfully' };
        } catch (error) {
            return { success: false, message: 'Invalid data format' };
        }
    }

    saveToStorage() {
        try {
            const data = {
                currentEncounter: this.currentEncounter.toJSON(),
                savedEncounters: this.savedEncounters.map(e => e.toJSON()),
                settings: this.settings
            };
            localStorage.setItem('dnd-initiative-tracker', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('dnd-initiative-tracker');
            if (data) {
                const parsed = JSON.parse(data);
                this.currentEncounter = Encounter.fromJSON(parsed.currentEncounter);
                this.savedEncounters = parsed.savedEncounters.map(e => Encounter.fromJSON(e));
                this.settings = { ...this.settings, ...parsed.settings };
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }

    clearStorage() {
        localStorage.removeItem('dnd-initiative-tracker');
        this.currentEncounter = new Encounter();
        this.savedEncounters = [];
        this.settings = {
            autoSort: true,
            showPlayerTypes: true,
            showConditions: true,
            confirmActions: true,
            theme: 'dark'
        };
        this.emit('storageCleared');
        return { success: true, message: 'Storage cleared successfully' };
    }

    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }

    emit(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
        }
    }
}