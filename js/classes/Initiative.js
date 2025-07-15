class Initiative {
    constructor() {
        this.players = [];
        this.currentTurn = 0;
        this.round = 1;
        this.isActive = false;
        this.turnHistory = [];
    }

    addPlayer(player) {
        if (!this.players.find(p => p.id === player.id)) {
            this.players.push(player);
            return true;
        }
        return false;
    }

    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            if (this.currentTurn >= index && this.currentTurn > 0) {
                this.currentTurn--;
            }
            if (this.currentTurn >= this.players.length) {
                this.currentTurn = 0;
            }
            return true;
        }
        return false;
    }

    rollInitiativeForAll() {
        this.players.forEach(player => {
            player.rollInitiative();
        });
        this.sortByInitiative();
    }

    rollInitiativeForPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.rollInitiative();
            this.sortByInitiative();
            return player.initiative;
        }
        return null;
    }

    setPlayerInitiative(playerId, initiativeValue) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.initiative = initiativeValue;
            this.sortByInitiative();
            return true;
        }
        return false;
    }

    rollInitiativeManually() {
        this.players.forEach(player => {
            player.initiative = 0;
        });
        return this.players;
    }

    sortByInitiative() {
        this.players.sort((a, b) => {
            if (b.initiative !== a.initiative) {
                return b.initiative - a.initiative;
            }
            return b.initiativeModifier - a.initiativeModifier;
        });
        this.currentTurn = 0;
    }

    startEncounter() {
        if (this.players.length === 0) {
            return false;
        }
        this.isActive = true;
        this.currentTurn = 0;
        this.round = 1;
        this.turnHistory = [];
        return true;
    }

    endEncounter() {
        this.isActive = false;
        this.currentTurn = 0;
        this.round = 1;
        this.turnHistory = [];
    }

    nextTurn() {
        if (!this.isActive) return null;

        this.recordTurn();
        this.processEndOfTurn();
        
        this.currentTurn++;
        if (this.currentTurn >= this.players.length) {
            this.currentTurn = 0;
            this.round++;
            this.processEndOfRound();
        }

        this.processStartOfTurn();
        return this.getCurrentPlayer();
    }

    previousTurn() {
        if (!this.isActive) return null;

        this.currentTurn--;
        if (this.currentTurn < 0) {
            this.currentTurn = this.players.length - 1;
            this.round = Math.max(1, this.round - 1);
        }

        return this.getCurrentPlayer();
    }

    getCurrentPlayer() {
        if (!this.isActive || this.players.length === 0) return null;
        return this.players[this.currentTurn];
    }

    getTurnOrder() {
        return [...this.players];
    }

    recordTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            this.turnHistory.push({
                player: currentPlayer.name,
                turn: this.currentTurn,
                round: this.round,
                timestamp: new Date().toISOString()
            });
        }
    }

    processStartOfTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            currentPlayer.updateConditions();
        }
    }

    processEndOfTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            currentPlayer.actions = [];
        }
    }

    processEndOfRound() {
        this.players.forEach(player => {
            player.updateConditions();
        });
    }

    setInitiativeOrder(playerIds) {
        const reorderedPlayers = [];
        playerIds.forEach(id => {
            const player = this.players.find(p => p.id === id);
            if (player) {
                reorderedPlayers.push(player);
            }
        });
        this.players = reorderedPlayers;
        this.currentTurn = 0;
    }

    getInitiativePosition(playerId) {
        return this.players.findIndex(p => p.id === playerId);
    }

    movePlayer(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.players.length || 
            toIndex < 0 || toIndex >= this.players.length) {
            return false;
        }

        const player = this.players.splice(fromIndex, 1)[0];
        this.players.splice(toIndex, 0, player);

        if (this.currentTurn === fromIndex) {
            this.currentTurn = toIndex;
        } else if (fromIndex < this.currentTurn && toIndex >= this.currentTurn) {
            this.currentTurn--;
        } else if (fromIndex > this.currentTurn && toIndex <= this.currentTurn) {
            this.currentTurn++;
        }

        return true;
    }

    getAlivePlayersCount() {
        return this.players.filter(p => p.isAlive).length;
    }

    getPlayersWithCondition(conditionName) {
        return this.players.filter(p => p.hasCondition(conditionName));
    }

    toJSON() {
        return {
            players: this.players.map(p => p.toJSON()),
            currentTurn: this.currentTurn,
            round: this.round,
            isActive: this.isActive,
            turnHistory: this.turnHistory
        };
    }

    static fromJSON(data) {
        const initiative = new Initiative();
        initiative.players = data.players.map(p => Player.fromJSON(p));
        initiative.currentTurn = data.currentTurn;
        initiative.round = data.round;
        initiative.isActive = data.isActive;
        initiative.turnHistory = data.turnHistory || [];
        return initiative;
    }
}