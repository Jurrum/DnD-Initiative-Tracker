/**
 * Initiative - Manages turn order, rounds, and combat flow
 */
class Initiative {
    constructor() {
        this.players = [];
        this.currentTurn = 0;
        this.round = 1;
        this.isActive = false;
        this.turnHistory = [];
    }

    // ==================== Player Management ====================

    /**
     * Add a player to the initiative order
     * @param {Player} player - Player to add
     * @returns {boolean} True if player was added
     */
    addPlayer(player) {
        if (!player || !player.id) {
            return false;
        }

        if (!this.players.find(p => p.id === player.id)) {
            this.players.push(player);
            return true;
        }
        return false;
    }

    /**
     * Remove a player from the initiative order
     * Properly handles currentTurn index adjustment
     * @param {string} playerId - ID of player to remove
     * @returns {boolean} True if player was removed
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index === -1) {
            return false;
        }

        this.players.splice(index, 1);

        // Handle empty player list
        if (this.players.length === 0) {
            this.currentTurn = 0;
            return true;
        }

        // Adjust currentTurn if needed
        if (index < this.currentTurn) {
            // Removed player was before current turn, shift back
            this.currentTurn--;
        } else if (index === this.currentTurn) {
            // Removed the current player
            // If we're at the end, wrap to beginning
            if (this.currentTurn >= this.players.length) {
                this.currentTurn = 0;
            }
            // Otherwise, currentTurn stays the same (next player slides into this slot)
        }

        // Safety bounds check
        this.currentTurn = Math.max(0, Math.min(this.currentTurn, this.players.length - 1));

        return true;
    }

    /**
     * Get a player by ID
     * @param {string} playerId - ID of player to find
     * @returns {Player|null} The player or null if not found
     */
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId) || null;
    }

    // ==================== Initiative Rolling ====================

    /**
     * Roll initiative for all players
     */
    rollInitiativeForAll() {
        this.players.forEach(player => {
            player.rollInitiative();
        });
        this.sortByInitiative();
    }

    /**
     * Roll initiative for a specific player
     * @param {string} playerId - ID of player
     * @returns {number|null} The initiative value or null if player not found
     */
    rollInitiativeForPlayer(playerId) {
        const player = this.getPlayer(playerId);
        if (player) {
            player.rollInitiative();
            this.sortByInitiative();
            return player.initiative;
        }
        return null;
    }

    /**
     * Set initiative value for a specific player
     * @param {string} playerId - ID of player
     * @param {number} initiativeValue - Initiative value to set
     * @returns {boolean} True if successful
     */
    setPlayerInitiative(playerId, initiativeValue) {
        const player = this.getPlayer(playerId);
        if (player) {
            const numValue = parseInt(initiativeValue, 10);
            if (isNaN(numValue)) {
                return false;
            }
            player.initiative = numValue;
            this.sortByInitiative();
            return true;
        }
        return false;
    }

    /**
     * Reset all initiative values to 0 for manual entry
     * @returns {Array} The players array
     */
    rollInitiativeManually() {
        this.players.forEach(player => {
            player.initiative = 0;
        });
        return this.players;
    }

    /**
     * Sort players by initiative (highest first)
     * Ties broken by initiative modifier
     */
    sortByInitiative() {
        // Remember current player before sorting
        const currentPlayer = this.getCurrentPlayer();

        this.players.sort((a, b) => {
            if (b.initiative !== a.initiative) {
                return b.initiative - a.initiative;
            }
            return b.initiativeModifier - a.initiativeModifier;
        });

        // If encounter is active, find where the current player ended up
        if (this.isActive && currentPlayer) {
            const newIndex = this.players.findIndex(p => p.id === currentPlayer.id);
            if (newIndex !== -1) {
                this.currentTurn = newIndex;
            }
        } else {
            this.currentTurn = 0;
        }
    }

    // ==================== Encounter Control ====================

    /**
     * Start the encounter
     * @returns {boolean} True if encounter started successfully
     */
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

    /**
     * End the encounter
     */
    endEncounter() {
        this.isActive = false;
        this.currentTurn = 0;
        this.round = 1;
        this.turnHistory = [];
    }

    /**
     * Reset the encounter (keep players but reset state)
     */
    reset() {
        this.currentTurn = 0;
        this.round = 1;
        this.isActive = false;
        this.turnHistory = [];
        this.players.forEach(player => {
            player.initiative = 0;
        });
    }

    // ==================== Turn Management ====================

    /**
     * Advance to next turn
     * @returns {Player|null} The new current player
     */
    nextTurn() {
        if (!this.isActive || this.players.length === 0) return null;

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

    /**
     * Go back to previous turn
     * @returns {Player|null} The new current player
     */
    previousTurn() {
        if (!this.isActive || this.players.length === 0) return null;

        this.currentTurn--;
        if (this.currentTurn < 0) {
            this.currentTurn = this.players.length - 1;
            // Only decrement round if we're past round 1
            if (this.round > 1) {
                this.round--;
            }
        }

        return this.getCurrentPlayer();
    }

    /**
     * Get the current player
     * @returns {Player|null} Current player or null
     */
    getCurrentPlayer() {
        if (!this.isActive || this.players.length === 0) {
            return null;
        }

        // Safety bounds check
        if (this.currentTurn < 0 || this.currentTurn >= this.players.length) {
            this.currentTurn = 0;
        }

        return this.players[this.currentTurn];
    }

    /**
     * Get turn order as array
     * @returns {Array} Copy of players array
     */
    getTurnOrder() {
        return [...this.players];
    }

    /**
     * Record the current turn to history
     */
    recordTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            this.turnHistory.push({
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                turn: this.currentTurn,
                round: this.round,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Process start of turn effects
     */
    processStartOfTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            currentPlayer.updateConditions();
        }
    }

    /**
     * Process end of turn effects
     */
    processEndOfTurn() {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
            // Clear actions at end of turn
            currentPlayer.actions = [];
        }
    }

    /**
     * Process end of round effects
     */
    processEndOfRound() {
        // Note: We don't update conditions here anymore since processStartOfTurn
        // handles it for each player as their turn comes up
    }

    // ==================== Initiative Order Management ====================

    /**
     * Set custom initiative order
     * @param {Array<string>} playerIds - Array of player IDs in desired order
     */
    setInitiativeOrder(playerIds) {
        const reorderedPlayers = [];
        playerIds.forEach(id => {
            const player = this.getPlayer(id);
            if (player) {
                reorderedPlayers.push(player);
            }
        });

        // Only update if we found all players
        if (reorderedPlayers.length === this.players.length) {
            this.players = reorderedPlayers;
            this.currentTurn = 0;
        }
    }

    /**
     * Get a player's position in initiative order
     * @param {string} playerId - ID of player
     * @returns {number} Position (0-based) or -1 if not found
     */
    getInitiativePosition(playerId) {
        return this.players.findIndex(p => p.id === playerId);
    }

    /**
     * Move a player from one position to another
     * @param {number} fromIndex - Current position
     * @param {number} toIndex - Target position
     * @returns {boolean} True if move was successful
     */
    movePlayer(fromIndex, toIndex) {
        // Validate indices
        if (fromIndex < 0 || fromIndex >= this.players.length ||
            toIndex < 0 || toIndex >= this.players.length) {
            return false;
        }

        // Nothing to do if same position
        if (fromIndex === toIndex) {
            return true;
        }

        const player = this.players.splice(fromIndex, 1)[0];
        this.players.splice(toIndex, 0, player);

        // Adjust currentTurn based on the move
        if (this.currentTurn === fromIndex) {
            // Moving the current player
            this.currentTurn = toIndex;
        } else if (fromIndex < this.currentTurn && toIndex >= this.currentTurn) {
            // Moved a player from before current to after current
            this.currentTurn--;
        } else if (fromIndex > this.currentTurn && toIndex <= this.currentTurn) {
            // Moved a player from after current to before current
            this.currentTurn++;
        }

        // Safety bounds check
        this.currentTurn = Math.max(0, Math.min(this.currentTurn, this.players.length - 1));

        return true;
    }

    // ==================== Query Methods ====================

    /**
     * Count alive players
     * @returns {number} Number of alive players
     */
    getAlivePlayersCount() {
        return this.players.filter(p => p.isAlive).length;
    }

    /**
     * Get players with a specific condition
     * @param {string} conditionName - Name of condition
     * @returns {Array} Players with the condition
     */
    getPlayersWithCondition(conditionName) {
        return this.players.filter(p => p.hasCondition(conditionName));
    }

    /**
     * Check if there are any players
     * @returns {boolean} True if there are players
     */
    hasPlayers() {
        return this.players.length > 0;
    }

    /**
     * Get number of players
     * @returns {number} Player count
     */
    getPlayerCount() {
        return this.players.length;
    }

    // ==================== Serialization ====================

    /**
     * Serialize to JSON
     * @returns {Object} JSON-serializable object
     */
    toJSON() {
        return {
            players: this.players.map(p => p.toJSON()),
            currentTurn: this.currentTurn,
            round: this.round,
            isActive: this.isActive,
            turnHistory: this.turnHistory
        };
    }

    /**
     * Create Initiative from JSON data
     * @param {Object} data - JSON data
     * @returns {Initiative} New Initiative instance
     */
    static fromJSON(data) {
        if (!data) {
            throw new Error('Cannot create Initiative from null/undefined data');
        }

        const initiative = new Initiative();
        initiative.players = Array.isArray(data.players)
            ? data.players.map(p => Player.fromJSON(p))
            : [];
        initiative.currentTurn = data.currentTurn || 0;
        initiative.round = data.round || 1;
        initiative.isActive = data.isActive || false;
        initiative.turnHistory = Array.isArray(data.turnHistory) ? data.turnHistory : [];

        // Validate currentTurn is in bounds
        if (initiative.players.length > 0) {
            initiative.currentTurn = Math.max(0, Math.min(initiative.currentTurn, initiative.players.length - 1));
        } else {
            initiative.currentTurn = 0;
        }

        return initiative;
    }
}

// Export for use in other modules (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Initiative;
}
