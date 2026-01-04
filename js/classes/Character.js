/**
 * Character - Full D&D character with complete stats and abilities
 * Extends BaseCharacter with ability scores, proficiencies, and detailed tracking
 */
class Character extends BaseCharacter {
    constructor(name, type = 'player') {
        super(name, type);

        // Generate character-specific ID
        this.id = this.generateId('char');

        // Character details
        this.class = '';
        this.race = '';
        this.level = 1;

        // Extended stats
        this.speed = 30;
        this.proficiencyBonus = 2;

        // Ability Scores
        this.abilities = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };

        // Character details
        this.attacks = '';

        // Tracking
        this.createdAt = new Date().toISOString();
        this.lastModified = new Date().toISOString();
    }

    // ==================== Ability Scores ====================

    /**
     * Get the modifier for an ability score
     * @param {string} ability - Name of the ability
     * @returns {number} The modifier (-5 to +10)
     */
    getAbilityModifier(ability) {
        const score = this.abilities[ability];
        if (score === undefined) {
            throw new Error(`Unknown ability: ${ability}`);
        }
        return Math.floor((score - 10) / 2);
    }

    // Convenience methods for each ability
    getStrengthModifier() { return this.getAbilityModifier('strength'); }
    getDexterityModifier() { return this.getAbilityModifier('dexterity'); }
    getConstitutionModifier() { return this.getAbilityModifier('constitution'); }
    getIntelligenceModifier() { return this.getAbilityModifier('intelligence'); }
    getWisdomModifier() { return this.getAbilityModifier('wisdom'); }
    getCharismaModifier() { return this.getAbilityModifier('charisma'); }

    // ==================== Initiative ====================

    /**
     * Calculate initiative modifier from Dexterity
     * @returns {number} The initiative modifier
     */
    calculateInitiativeModifier() {
        this.initiativeModifier = this.getDexterityModifier();
        return this.initiativeModifier;
    }

    /**
     * Roll initiative (d20 + Dex modifier)
     * @returns {number} The initiative result
     */
    rollInitiative() {
        const roll = Math.floor(Math.random() * 20) + 1;
        this.initiative = roll + this.calculateInitiativeModifier();
        return this.initiative;
    }

    /**
     * Set initiative to a specific value
     * @param {number} value - The initiative value
     */
    setInitiative(value) {
        super.setInitiative(value);
        this.updateLastModified();
    }

    // ==================== Health (override to track modifications) ====================

    takeDamage(amount) {
        const result = super.takeDamage(amount);
        this.updateLastModified();
        return result;
    }

    heal(amount) {
        const result = super.heal(amount);
        this.updateLastModified();
        return result;
    }

    // ==================== Conditions (override to track modifications) ====================

    addCondition(name, duration = -1, description = '') {
        const condition = super.addCondition(name, duration, description);
        this.updateLastModified();
        return condition;
    }

    removeCondition(name) {
        const result = super.removeCondition(name);
        this.updateLastModified();
        return result;
    }

    updateConditions() {
        super.updateConditions();
        this.updateLastModified();
    }

    // ==================== Actions (override to track modifications) ====================

    addAction(action) {
        const entry = super.addAction(action);
        this.updateLastModified();
        return entry;
    }

    // ==================== Saving Throws ====================

    /**
     * Get saving throw bonus for an ability
     * @param {string} ability - Name of the ability
     * @returns {number} Saving throw bonus
     */
    getSavingThrowBonus(ability) {
        const modifier = this.getAbilityModifier(ability);
        // TODO: Add proficiency tracking for saving throws
        return modifier;
    }

    // ==================== Skill Checks ====================

    /**
     * Get skill bonus
     * @param {string} skill - Name of the skill
     * @returns {number} Skill bonus
     */
    getSkillBonus(skill) {
        const skillAbilities = {
            'acrobatics': 'dexterity',
            'animal_handling': 'wisdom',
            'arcana': 'intelligence',
            'athletics': 'strength',
            'deception': 'charisma',
            'history': 'intelligence',
            'insight': 'wisdom',
            'intimidation': 'charisma',
            'investigation': 'intelligence',
            'medicine': 'wisdom',
            'nature': 'intelligence',
            'perception': 'wisdom',
            'performance': 'charisma',
            'persuasion': 'charisma',
            'religion': 'intelligence',
            'sleight_of_hand': 'dexterity',
            'stealth': 'dexterity',
            'survival': 'wisdom'
        };

        const ability = skillAbilities[skill];
        if (!ability) return 0;

        const modifier = this.getAbilityModifier(ability);
        // TODO: Add proficiency tracking for skills
        return modifier;
    }

    // ==================== Update Methods ====================

    /**
     * Update character stats
     * @param {Object} updates - Object with properties to update
     */
    updateStats(updates) {
        // Only allow updating known properties
        const allowedProps = ['name', 'class', 'race', 'level', 'maxHp', 'currentHp',
                             'ac', 'speed', 'proficiencyBonus', 'attacks', 'notes',
                             'initiativeModifier'];

        for (const prop of allowedProps) {
            if (updates[prop] !== undefined) {
                this[prop] = updates[prop];
            }
        }

        this.calculateInitiativeModifier();
        this.updateLastModified();
    }

    /**
     * Update ability scores
     * @param {Object} abilities - Object with ability names and scores
     */
    updateAbilities(abilities) {
        const validAbilities = ['strength', 'dexterity', 'constitution',
                               'intelligence', 'wisdom', 'charisma'];

        for (const ability of validAbilities) {
            if (abilities[ability] !== undefined) {
                const score = parseInt(abilities[ability], 10);
                if (!isNaN(score) && score >= 1 && score <= 30) {
                    this.abilities[ability] = score;
                }
            }
        }

        this.calculateInitiativeModifier();
        this.updateLastModified();
    }

    /**
     * Update the last modified timestamp
     */
    updateLastModified() {
        this.lastModified = new Date().toISOString();
    }

    // ==================== Clone & Reset ====================

    /**
     * Create a clone of this character
     * @returns {Character} A new Character instance
     */
    clone() {
        const clone = new Character(this.name, this.type);

        clone.class = this.class;
        clone.race = this.race;
        clone.level = this.level;
        clone.maxHp = this.maxHp;
        clone.currentHp = this.maxHp; // Reset to full HP for clone
        clone.ac = this.ac;
        clone.speed = this.speed;
        clone.proficiencyBonus = this.proficiencyBonus;
        clone.abilities = { ...this.abilities };
        clone.attacks = this.attacks;
        clone.notes = this.notes;
        clone.initiativeModifier = this.initiativeModifier;

        // Reset combat state for clone
        clone.isAlive = true;
        clone.conditions = [];
        clone.actions = [];
        clone.initiative = 0;

        clone.calculateInitiativeModifier();

        return clone;
    }

    /**
     * Reset character to starting state
     */
    reset() {
        super.reset();
        this.updateLastModified();
    }

    // ==================== Display Methods ====================

    /**
     * Get formatted display name
     * @returns {string} Display name with class/race info
     */
    getDisplayName() {
        if (this.class && this.race) {
            return `${this.name} (${this.race} ${this.class})`;
        } else if (this.class) {
            return `${this.name} (${this.class})`;
        } else if (this.race) {
            return `${this.name} (${this.race})`;
        }
        return this.name;
    }

    // ==================== Serialization ====================

    /**
     * Serialize character to JSON
     * @returns {Object} JSON-serializable object
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            class: this.class,
            race: this.race,
            level: this.level,
            maxHp: this.maxHp,
            currentHp: this.currentHp,
            ac: this.ac,
            speed: this.speed,
            proficiencyBonus: this.proficiencyBonus,
            abilities: this.abilities,
            initiative: this.initiative,
            initiativeModifier: this.initiativeModifier,
            conditions: this.conditions,
            actions: this.actions,
            attacks: this.attacks,
            notes: this.notes,
            isAlive: this.isAlive,
            createdAt: this.createdAt,
            lastModified: this.lastModified
        };
    }

    /**
     * Create a Character instance from JSON data
     * @param {Object} data - JSON data
     * @returns {Character} New Character instance
     */
    static fromJSON(data) {
        if (!data) {
            throw new Error('Cannot create Character from null/undefined data');
        }

        const character = new Character(data.name || 'Unknown', data.type || 'player');

        character.id = data.id || character.id;
        character.class = data.class || '';
        character.race = data.race || '';
        character.level = data.level || 1;
        character.maxHp = data.maxHp || 10;
        character.currentHp = data.currentHp !== undefined ? data.currentHp : 10;
        character.ac = data.ac || 10;
        character.speed = data.speed || 30;
        character.proficiencyBonus = data.proficiencyBonus || 2;

        character.abilities = data.abilities || {
            strength: 10, dexterity: 10, constitution: 10,
            intelligence: 10, wisdom: 10, charisma: 10
        };

        character.initiative = data.initiative || 0;
        character.initiativeModifier = data.initiativeModifier || 0;
        character.conditions = Array.isArray(data.conditions) ? data.conditions : [];
        character.actions = Array.isArray(data.actions) ? data.actions : [];
        character.attacks = data.attacks || '';
        character.notes = data.notes || '';
        character.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        character.createdAt = data.createdAt || new Date().toISOString();
        character.lastModified = data.lastModified || new Date().toISOString();

        return character;
    }
}

// Export for use in other modules (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Character;
}
