class Encounter {
    constructor(name = 'New Encounter') {
        this.id = this.generateId();
        this.name = name;
        this.players = [];
        this.initiative = new Initiative();
        this.isActive = false;
        this.createdAt = new Date().toISOString();
        this.lastModified = new Date().toISOString();
        this.description = '';
        this.difficulty = 'medium';
        this.environment = '';
        this.notes = '';
    }

    generateId() {
        return 'encounter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addPlayer(name, hp, ac, initiativeModifier = 0, type = 'player') {
        const player = new Player(name, hp, ac, initiativeModifier, type);
        this.players.push(player);
        this.initiative.addPlayer(player);
        this.updateLastModified();
        return player;
    }

    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.initiative.removePlayer(playerId);
            this.updateLastModified();
            return true;
        }
        return false;
    }

    updatePlayer(playerId, updates) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            Object.assign(player, updates);
            this.updateLastModified();
            return player;
        }
        return null;
    }

    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    getAllPlayers() {
        return [...this.players];
    }

    getPlayersByType(type) {
        return this.players.filter(p => p.type === type);
    }

    startEncounter() {
        if (this.players.length === 0) {
            return { success: false, message: 'No players in encounter' };
        }

        this.initiative.rollInitiativeForAll();
        const started = this.initiative.startEncounter();
        
        if (started) {
            this.isActive = true;
            this.updateLastModified();
            return { success: true, message: 'Encounter started successfully' };
        }
        
        return { success: false, message: 'Failed to start encounter' };
    }

    endEncounter() {
        this.initiative.endEncounter();
        this.isActive = false;
        this.updateLastModified();
        return { success: true, message: 'Encounter ended successfully' };
    }

    nextTurn() {
        if (!this.isActive) {
            return { success: false, message: 'Encounter not active' };
        }

        const currentPlayer = this.initiative.nextTurn();
        this.updateLastModified();
        
        return { 
            success: true, 
            currentPlayer: currentPlayer,
            round: this.initiative.round,
            message: `${currentPlayer?.name || 'Unknown'}'s turn` 
        };
    }

    previousTurn() {
        if (!this.isActive) {
            return { success: false, message: 'Encounter not active' };
        }

        const currentPlayer = this.initiative.previousTurn();
        this.updateLastModified();
        
        return { 
            success: true, 
            currentPlayer: currentPlayer,
            round: this.initiative.round,
            message: `${currentPlayer?.name || 'Unknown'}'s turn` 
        };
    }

    getCurrentPlayer() {
        return this.initiative.getCurrentPlayer();
    }

    getCurrentRound() {
        return this.initiative.round;
    }

    getInitiativeOrder() {
        return this.initiative.getTurnOrder();
    }

    dealDamage(playerId, amount) {
        const player = this.getPlayer(playerId);
        if (player) {
            const newHp = player.takeDamage(amount);
            this.updateLastModified();
            return { 
                success: true, 
                newHp: newHp,
                isAlive: player.isAlive,
                message: `${player.name} takes ${amount} damage` 
            };
        }
        return { success: false, message: 'Player not found' };
    }

    healPlayer(playerId, amount) {
        const player = this.getPlayer(playerId);
        if (player) {
            const newHp = player.heal(amount);
            this.updateLastModified();
            return { 
                success: true, 
                newHp: newHp,
                isAlive: player.isAlive,
                message: `${player.name} heals ${amount} HP` 
            };
        }
        return { success: false, message: 'Player not found' };
    }

    addCondition(playerId, conditionName, duration = -1, description = '') {
        const player = this.getPlayer(playerId);
        if (player) {
            const condition = player.addCondition(conditionName, duration, description);
            this.updateLastModified();
            return { 
                success: true, 
                condition: condition,
                message: `${conditionName} applied to ${player.name}` 
            };
        }
        return { success: false, message: 'Player not found' };
    }

    removeCondition(playerId, conditionName) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.removeCondition(conditionName);
            this.updateLastModified();
            return { 
                success: true, 
                message: `${conditionName} removed from ${player.name}` 
            };
        }
        return { success: false, message: 'Player not found' };
    }

    getAllConditions() {
        const conditions = [];
        this.players.forEach(player => {
            player.conditions.forEach(condition => {
                conditions.push({
                    ...condition,
                    playerName: player.name,
                    playerId: player.id
                });
            });
        });
        return conditions;
    }

    getEncounterStats() {
        const stats = {
            totalPlayers: this.players.length,
            alivePlayers: this.players.filter(p => p.isAlive).length,
            deadPlayers: this.players.filter(p => !p.isAlive).length,
            playerTypes: {
                player: this.players.filter(p => p.type === 'player').length,
                npc: this.players.filter(p => p.type === 'npc').length,
                monster: this.players.filter(p => p.type === 'monster').length
            },
            totalConditions: this.getAllConditions().length,
            currentRound: this.getCurrentRound(),
            isActive: this.isActive
        };
        return stats;
    }

    reset() {
        this.players.forEach(player => {
            player.currentHp = player.maxHp;
            player.isAlive = true;
            player.conditions = [];
            player.actions = [];
            player.initiative = 0;
        });
        this.initiative = new Initiative();
        this.players.forEach(player => this.initiative.addPlayer(player));
        this.isActive = false;
        this.updateLastModified();
    }

    clone() {
        const clone = new Encounter(this.name + ' (Copy)');
        clone.description = this.description;
        clone.difficulty = this.difficulty;
        clone.environment = this.environment;
        clone.notes = this.notes;
        
        this.players.forEach(player => {
            const clonedPlayer = player.clone();
            clone.players.push(clonedPlayer);
            clone.initiative.addPlayer(clonedPlayer);
        });
        
        return clone;
    }

    updateLastModified() {
        this.lastModified = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            players: this.players.map(p => p.toJSON()),
            initiative: this.initiative.toJSON(),
            isActive: this.isActive,
            createdAt: this.createdAt,
            lastModified: this.lastModified,
            description: this.description,
            difficulty: this.difficulty,
            environment: this.environment,
            notes: this.notes
        };
    }

    static fromJSON(data) {
        const encounter = new Encounter(data.name);
        encounter.id = data.id;
        encounter.players = data.players.map(p => Player.fromJSON(p));
        encounter.initiative = Initiative.fromJSON(data.initiative);
        encounter.isActive = data.isActive;
        encounter.createdAt = data.createdAt;
        encounter.lastModified = data.lastModified;
        encounter.description = data.description || '';
        encounter.difficulty = data.difficulty || 'medium';
        encounter.environment = data.environment || '';
        encounter.notes = data.notes || '';
        return encounter;
    }
}