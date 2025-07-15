class Character {
    constructor(name, type = 'player') {
        this.id = this.generateId();
        this.name = name;
        this.type = type; // 'player', 'monster', 'npc'
        this.class = '';
        this.race = '';
        this.level = 1;
        
        // Core Stats
        this.maxHp = 10;
        this.currentHp = 10;
        this.ac = 10;
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
        
        // Combat Stats
        this.initiative = 0;
        this.initiativeModifier = 0;
        this.conditions = [];
        this.actions = [];
        
        // Character Details
        this.attacks = '';
        this.notes = '';
        this.isAlive = true;
        
        // Tracking
        this.createdAt = new Date().toISOString();
        this.lastModified = new Date().toISOString();
    }

    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Ability Score Modifiers
    getAbilityModifier(ability) {
        const score = this.abilities[ability];
        return Math.floor((score - 10) / 2);
    }

    getStrengthModifier() { return this.getAbilityModifier('strength'); }
    getDexterityModifier() { return this.getAbilityModifier('dexterity'); }
    getConstitutionModifier() { return this.getAbilityModifier('constitution'); }
    getIntelligenceModifier() { return this.getAbilityModifier('intelligence'); }
    getWisdomModifier() { return this.getAbilityModifier('wisdom'); }
    getCharismaModifier() { return this.getAbilityModifier('charisma'); }

    // Initiative
    calculateInitiativeModifier() {
        this.initiativeModifier = this.getDexterityModifier();
        return this.initiativeModifier;
    }

    rollInitiative() {
        const roll = Math.floor(Math.random() * 20) + 1;
        this.initiative = roll + this.calculateInitiativeModifier();
        return this.initiative;
    }

    setInitiative(value) {
        this.initiative = value;
        this.updateLastModified();
    }

    // Health Management
    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        if (this.currentHp === 0) {
            this.isAlive = false;
            this.addCondition('unconscious', -1);
        }
        this.updateLastModified();
        return this.currentHp;
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        if (this.currentHp > 0 && !this.isAlive) {
            this.isAlive = true;
            this.removeCondition('unconscious');
        }
        this.updateLastModified();
        return this.currentHp;
    }

    getHpPercentage() {
        return (this.currentHp / this.maxHp) * 100;
    }

    getStatusColor() {
        const hpPercent = this.getHpPercentage();
        if (hpPercent <= 0) return '#dc3545';
        if (hpPercent <= 25) return '#dc3545';
        if (hpPercent <= 50) return '#ffc107';
        if (hpPercent <= 75) return '#fd7e14';
        return '#28a745';
    }

    // Conditions
    addCondition(name, duration = -1, description = '') {
        const condition = {
            id: this.generateId(),
            name: name,
            duration: duration,
            description: description,
            appliedTurn: 0
        };
        this.conditions.push(condition);
        this.updateLastModified();
        return condition;
    }

    removeCondition(name) {
        this.conditions = this.conditions.filter(condition => condition.name !== name);
        this.updateLastModified();
    }

    hasCondition(conditionName) {
        return this.conditions.some(condition => condition.name === conditionName);
    }

    updateConditions() {
        this.conditions = this.conditions.filter(condition => {
            if (condition.duration === -1) return true;
            condition.duration--;
            return condition.duration > 0;
        });
        this.updateLastModified();
    }

    // Actions
    addAction(action) {
        const actionEntry = {
            id: this.generateId(),
            action: action,
            turn: 0,
            timestamp: new Date().toISOString()
        };
        this.actions.push(actionEntry);
        this.updateLastModified();
        return actionEntry;
    }

    // Saving Throws
    getSavingThrowBonus(ability) {
        const modifier = this.getAbilityModifier(ability);
        // In a full implementation, you'd check for proficiency in saving throws
        return modifier;
    }

    // Skill Checks
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
        // In a full implementation, you'd check for proficiency in skills
        return modifier;
    }

    // Update Methods
    updateStats(updates) {
        Object.assign(this, updates);
        this.calculateInitiativeModifier();
        this.updateLastModified();
    }

    updateAbilities(abilities) {
        Object.assign(this.abilities, abilities);
        this.calculateInitiativeModifier();
        this.updateLastModified();
    }

    updateLastModified() {
        this.lastModified = new Date().toISOString();
    }

    // Utility Methods
    clone() {
        const clone = new Character(this.name, this.type);
        clone.id = this.generateId(); // New ID for clone
        clone.class = this.class;
        clone.race = this.race;
        clone.level = this.level;
        clone.maxHp = this.maxHp;
        clone.currentHp = this.maxHp; // Reset to full HP
        clone.ac = this.ac;
        clone.speed = this.speed;
        clone.proficiencyBonus = this.proficiencyBonus;
        clone.abilities = { ...this.abilities };
        clone.attacks = this.attacks;
        clone.notes = this.notes;
        clone.calculateInitiativeModifier();
        clone.isAlive = true;
        clone.conditions = [];
        clone.actions = [];
        clone.initiative = 0;
        return clone;
    }

    reset() {
        this.currentHp = this.maxHp;
        this.isAlive = true;
        this.conditions = [];
        this.actions = [];
        this.initiative = 0;
        this.updateLastModified();
    }

    // Serialization
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

    static fromJSON(data) {
        const character = new Character(data.name, data.type);
        character.id = data.id;
        character.class = data.class || '';
        character.race = data.race || '';
        character.level = data.level || 1;
        character.maxHp = data.maxHp || 10;
        character.currentHp = data.currentHp || 10;
        character.ac = data.ac || 10;
        character.speed = data.speed || 30;
        character.proficiencyBonus = data.proficiencyBonus || 2;
        character.abilities = data.abilities || {
            strength: 10, dexterity: 10, constitution: 10,
            intelligence: 10, wisdom: 10, charisma: 10
        };
        character.initiative = data.initiative || 0;
        character.initiativeModifier = data.initiativeModifier || 0;
        character.conditions = data.conditions || [];
        character.actions = data.actions || [];
        character.attacks = data.attacks || '';
        character.notes = data.notes || '';
        character.isAlive = data.isAlive !== undefined ? data.isAlive : true;
        character.createdAt = data.createdAt || new Date().toISOString();
        character.lastModified = data.lastModified || new Date().toISOString();
        return character;
    }

    // Display Methods
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

    getTypeIcon() {
        switch (this.type) {
            case 'player': return '👤';
            case 'monster': return '👹';
            case 'npc': return '🧑';
            default: return '❓';
        }
    }

    getStatusText() {
        if (!this.isAlive) return 'Dead';
        if (this.currentHp <= this.maxHp * 0.25) return 'Critical';
        if (this.currentHp <= this.maxHp * 0.5) return 'Wounded';
        if (this.currentHp <= this.maxHp * 0.75) return 'Injured';
        return 'Healthy';
    }
}