class Player {
    constructor(name, hp, ac, initiativeModifier = 0, type = 'player') {
        this.id = this.generateId();
        this.name = name;
        this.maxHp = hp;
        this.currentHp = hp;
        this.ac = ac;
        this.initiativeModifier = initiativeModifier;
        this.type = type;
        this.initiative = 0;
        this.conditions = [];
        this.actions = [];
        this.isAlive = true;
        this.notes = '';
    }

    generateId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    rollInitiative() {
        const roll = Math.floor(Math.random() * 20) + 1;
        this.initiative = roll + this.initiativeModifier;
        return this.initiative;
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        if (this.currentHp === 0) {
            this.isAlive = false;
            this.addCondition('unconscious', -1);
        }
        return this.currentHp;
    }

    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        if (this.currentHp > 0 && !this.isAlive) {
            this.isAlive = true;
            this.removeCondition('unconscious');
        }
        return this.currentHp;
    }

    addCondition(name, duration = -1, description = '') {
        const condition = {
            id: this.generateId(),
            name: name,
            duration: duration,
            description: description,
            appliedTurn: 0
        };
        this.conditions.push(condition);
        return condition;
    }

    removeCondition(name) {
        this.conditions = this.conditions.filter(condition => condition.name !== name);
    }

    updateConditions() {
        this.conditions = this.conditions.filter(condition => {
            if (condition.duration === -1) return true;
            condition.duration--;
            return condition.duration > 0;
        });
    }

    addAction(action) {
        const actionEntry = {
            id: this.generateId(),
            action: action,
            turn: 0,
            timestamp: new Date().toISOString()
        };
        this.actions.push(actionEntry);
        return actionEntry;
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

    hasCondition(conditionName) {
        return this.conditions.some(condition => condition.name === conditionName);
    }

    clone() {
        const clone = new Player(this.name, this.maxHp, this.ac, this.initiativeModifier, this.type);
        clone.currentHp = this.currentHp;
        clone.initiative = this.initiative;
        clone.conditions = [...this.conditions];
        clone.actions = [...this.actions];
        clone.isAlive = this.isAlive;
        clone.notes = this.notes;
        return clone;
    }

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

    static fromJSON(data) {
        const player = new Player(data.name, data.maxHp, data.ac, data.initiativeModifier, data.type);
        player.id = data.id;
        player.currentHp = data.currentHp;
        player.initiative = data.initiative;
        player.conditions = data.conditions || [];
        player.actions = data.actions || [];
        player.isAlive = data.isAlive;
        player.notes = data.notes || '';
        return player;
    }
}