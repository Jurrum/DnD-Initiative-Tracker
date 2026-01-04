/**
 * BaseCharacter - Shared base class for Character and Player
 * Contains common combat, health, and condition management logic
 */
class BaseCharacter {
    constructor(name, type = 'player') {
        // Validate type
        const validTypes = ['player', 'monster', 'npc'];
        if (!validTypes.includes(type)) {
            throw new Error(`Invalid character type: ${type}. Must be one of: ${validTypes.join(', ')}`);
        }

        this.id = this.generateId();
        this.name = name || 'Unknown';
        this.type = type;
        this.maxHp = 10;
        this.currentHp = 10;
        this.ac = 10;
        this.initiativeModifier = 0;
        this.initiative = 0;
        this.conditions = [];
        this.actions = [];
        this.isAlive = true;
        this.notes = '';
    }

    /**
     * Generate a unique ID for this entity
     * @param {string} prefix - Prefix for the ID (default: 'entity')
     * @returns {string} Unique identifier
     */
    generateId(prefix = 'entity') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `${prefix}_${timestamp}_${random}`;
    }

    // ==================== Initiative ====================

    /**
     * Roll initiative (d20 + modifier)
     * @returns {number} The initiative result
     */
    rollInitiative() {
        const roll = Math.floor(Math.random() * 20) + 1;
        this.initiative = roll + this.initiativeModifier;
        return this.initiative;
    }

    /**
     * Set initiative to a specific value
     * @param {number} value - The initiative value
     */
    setInitiative(value) {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
            throw new Error('Initiative must be a valid number');
        }
        this.initiative = numValue;
    }

    // ==================== Health Management ====================

    /**
     * Apply damage to this character
     * @param {number} amount - Amount of damage to deal
     * @returns {number} Current HP after damage
     */
    takeDamage(amount) {
        const numAmount = parseInt(amount, 10);
        if (isNaN(numAmount) || numAmount < 0) {
            throw new Error('Damage amount must be a non-negative number');
        }

        this.currentHp = Math.max(0, this.currentHp - numAmount);

        if (this.currentHp === 0 && this.isAlive) {
            this.isAlive = false;
            this.addCondition('unconscious', -1);
        }

        return this.currentHp;
    }

    /**
     * Heal this character
     * @param {number} amount - Amount of healing
     * @returns {number} Current HP after healing
     */
    heal(amount) {
        const numAmount = parseInt(amount, 10);
        if (isNaN(numAmount) || numAmount < 0) {
            throw new Error('Heal amount must be a non-negative number');
        }

        this.currentHp = Math.min(this.maxHp, this.currentHp + numAmount);

        if (this.currentHp > 0 && !this.isAlive) {
            this.isAlive = true;
            this.removeCondition('unconscious');
        }

        return this.currentHp;
    }

    /**
     * Get HP as a percentage of max HP
     * @returns {number} HP percentage (0-100)
     */
    getHpPercentage() {
        if (this.maxHp <= 0) return 0;
        return (this.currentHp / this.maxHp) * 100;
    }

    /**
     * Get a color representing current health status
     * @returns {string} CSS color code
     */
    getStatusColor() {
        const hpPercent = this.getHpPercentage();
        if (hpPercent <= 0) return 'var(--color-danger, #dc3545)';
        if (hpPercent <= 25) return 'var(--color-danger, #dc3545)';
        if (hpPercent <= 50) return 'var(--color-warning, #ffc107)';
        if (hpPercent <= 75) return 'var(--color-warning-light, #fd7e14)';
        return 'var(--color-success, #28a745)';
    }

    /**
     * Get status text based on HP
     * @returns {string} Status description
     */
    getStatusText() {
        if (!this.isAlive) return 'Dead';
        const hpPercent = this.getHpPercentage();
        if (hpPercent <= 25) return 'Critical';
        if (hpPercent <= 50) return 'Wounded';
        if (hpPercent <= 75) return 'Injured';
        return 'Healthy';
    }

    // ==================== Conditions ====================

    /**
     * Add a condition to this character
     * @param {string} name - Name of the condition
     * @param {number} duration - Duration in rounds (-1 for permanent)
     * @param {string} description - Optional description
     * @returns {Object} The created condition object
     */
    addCondition(name, duration = -1, description = '') {
        if (!name || typeof name !== 'string') {
            throw new Error('Condition name is required');
        }

        const numDuration = parseInt(duration, 10);
        if (isNaN(numDuration)) {
            throw new Error('Duration must be a valid number');
        }

        const condition = {
            id: this.generateId('condition'),
            name: name.trim(),
            duration: numDuration,
            description: description || '',
            appliedTurn: 0
        };

        this.conditions.push(condition);
        return condition;
    }

    /**
     * Remove a condition by name
     * @param {string} name - Name of the condition to remove
     * @returns {boolean} True if condition was found and removed
     */
    removeCondition(name) {
        const initialLength = this.conditions.length;
        this.conditions = this.conditions.filter(condition => condition.name !== name);
        return this.conditions.length < initialLength;
    }

    /**
     * Remove a condition by ID
     * @param {string} conditionId - ID of the condition to remove
     * @returns {boolean} True if condition was found and removed
     */
    removeConditionById(conditionId) {
        const initialLength = this.conditions.length;
        this.conditions = this.conditions.filter(condition => condition.id !== conditionId);
        return this.conditions.length < initialLength;
    }

    /**
     * Check if character has a specific condition
     * @param {string} conditionName - Name of condition to check
     * @returns {boolean} True if character has the condition
     */
    hasCondition(conditionName) {
        return this.conditions.some(condition => condition.name === conditionName);
    }

    /**
     * Update condition durations (call at start/end of turn)
     * Removes conditions that have expired
     *
     * FIX: Changed from `duration > 0` to `duration >= 0` to allow
     * conditions to last their full duration before being removed
     */
    updateConditions() {
        this.conditions = this.conditions.filter(condition => {
            // Permanent conditions (duration -1) never expire
            if (condition.duration === -1) return true;

            // Decrement duration
            condition.duration--;

            // Keep condition if it still has duration remaining
            // Fixed: >= 0 instead of > 0 so conditions last their full turn
            return condition.duration >= 0;
        });
    }

    /**
     * Get all active conditions
     * @returns {Array} Array of condition objects
     */
    getConditions() {
        return [...this.conditions];
    }

    // ==================== Actions ====================

    /**
     * Record an action taken by this character
     * @param {string} action - Description of the action
     * @returns {Object} The created action entry
     */
    addAction(action) {
        if (!action || typeof action !== 'string') {
            throw new Error('Action description is required');
        }

        const actionEntry = {
            id: this.generateId('action'),
            action: action.trim(),
            turn: 0,
            timestamp: new Date().toISOString()
        };

        this.actions.push(actionEntry);
        return actionEntry;
    }

    /**
     * Get all recorded actions
     * @returns {Array} Array of action entries
     */
    getActions() {
        return [...this.actions];
    }

    /**
     * Clear all recorded actions
     */
    clearActions() {
        this.actions = [];
    }

    // ==================== Reset ====================

    /**
     * Reset character to starting state (full HP, no conditions)
     */
    reset() {
        this.currentHp = this.maxHp;
        this.isAlive = true;
        this.conditions = [];
        this.actions = [];
        this.initiative = 0;
    }

    // ==================== Utility ====================

    /**
     * Get display icon based on type
     * @returns {string} Emoji icon
     */
    getTypeIcon() {
        switch (this.type) {
            case 'player': return '👤';
            case 'monster': return '👹';
            case 'npc': return '🧑';
            default: return '❓';
        }
    }

    /**
     * Deep copy conditions array (for cloning)
     * @returns {Array} Deep copied conditions
     */
    _cloneConditions() {
        return this.conditions.map(c => ({ ...c }));
    }

    /**
     * Deep copy actions array (for cloning)
     * @returns {Array} Deep copied actions
     */
    _cloneActions() {
        return this.actions.map(a => ({ ...a }));
    }

    // ==================== Validation ====================

    /**
     * Validate a numeric value is within range
     * @param {*} value - Value to validate
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @param {string} fieldName - Name of field for error messages
     * @returns {number} The validated number
     */
    static validateNumber(value, min, max, fieldName) {
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            throw new Error(`${fieldName} must be a valid number`);
        }
        if (num < min || num > max) {
            throw new Error(`${fieldName} must be between ${min} and ${max}`);
        }
        return num;
    }

    /**
     * Validate a string is not empty
     * @param {*} value - Value to validate
     * @param {string} fieldName - Name of field for error messages
     * @returns {string} The validated string
     */
    static validateString(value, fieldName) {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            throw new Error(`${fieldName} is required`);
        }
        return value.trim();
    }
}

// Export for use in other modules (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseCharacter;
}
