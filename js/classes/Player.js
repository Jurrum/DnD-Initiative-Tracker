/**
 * Player - Lightweight character representation for use in encounters
 * Extends BaseCharacter with encounter-specific functionality
 */
class Player extends BaseCharacter {
    constructor(name, hp, ac, initiativeModifier = 0, type = 'player') {
        super(name, type);

        // Override defaults with provided values
        const validHp = parseInt(hp, 10);
        const validAc = parseInt(ac, 10);
        const validInitMod = parseInt(initiativeModifier, 10);

        this.maxHp = isNaN(validHp) || validHp < 1 ? 1 : validHp;
        this.currentHp = this.maxHp;
        this.ac = isNaN(validAc) || validAc < 0 ? 10 : validAc;
        this.initiativeModifier = isNaN(validInitMod) ? 0 : validInitMod;

        // Generate player-specific ID
        this.id = this.generateId('player');
    }

    /**
     * Create a clone of this player
     * @returns {Player} A new Player instance with copied data
     */
    clone() {
        const clone = new Player(
            this.name,
            this.maxHp,
            this.ac,
            this.initiativeModifier,
            this.type
        );

        // Copy state
        clone.currentHp = this.currentHp;
        clone.initiative = this.initiative;
        clone.isAlive = this.isAlive;
        clone.notes = this.notes;

        // Deep copy arrays (fixed: was shallow copy before)
        clone.conditions = this._cloneConditions();
        clone.actions = this._cloneActions();

        return clone;
    }

    /**
     * Serialize player to JSON
     * @returns {Object} JSON-serializable object
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            maxHp: this.maxHp,
            currentHp: this.currentHp,
            ac: this.ac,
            initiativeModifier: this.initiativeModifier,
            type: this.type,
            initiative: this.initiative,
            conditions: this.conditions,
            actions: this.actions,
            isAlive: this.isAlive,
            notes: this.notes
        };
    }

    /**
     * Create a Player instance from JSON data
     * @param {Object} data - JSON data
     * @returns {Player} New Player instance
     */
    static fromJSON(data) {
        if (!data) {
            throw new Error('Cannot create Player from null/undefined data');
        }

        const player = new Player(
            data.name || 'Unknown',
            data.maxHp || 10,
            data.ac || 10,
            data.initiativeModifier || 0,
            data.type || 'player'
        );

        // Restore state
        player.id = data.id || player.id;
        player.currentHp = data.currentHp !== undefined ? data.currentHp : player.maxHp;
        player.initiative = data.initiative || 0;
        player.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        player.notes = data.notes || '';

        // Restore arrays with validation
        player.conditions = Array.isArray(data.conditions) ? data.conditions : [];
        player.actions = Array.isArray(data.actions) ? data.actions : [];

        return player;
    }
}

// Export for use in other modules (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
