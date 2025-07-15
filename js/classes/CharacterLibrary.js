class CharacterLibrary {
    constructor() {
        this.characters = {
            player: [],
            monster: [],
            npc: []
        };
        this.loadFromStorage();
    }

    // Character Management
    addCharacter(character) {
        const type = character.type;
        if (!this.characters[type]) {
            this.characters[type] = [];
        }
        
        this.characters[type].push(character);
        this.saveToStorage();
        return character;
    }

    removeCharacter(characterId) {
        for (const type in this.characters) {
            const index = this.characters[type].findIndex(char => char.id === characterId);
            if (index !== -1) {
                const removed = this.characters[type].splice(index, 1)[0];
                this.saveToStorage();
                return removed;
            }
        }
        return null;
    }

    getCharacter(characterId) {
        for (const type in this.characters) {
            const character = this.characters[type].find(char => char.id === characterId);
            if (character) return character;
        }
        return null;
    }

    updateCharacter(characterId, updates) {
        const character = this.getCharacter(characterId);
        if (character) {
            character.updateStats(updates);
            this.saveToStorage();
            return character;
        }
        return null;
    }

    // Type-specific getters
    getPlayers() {
        return [...this.characters.player];
    }

    getMonsters() {
        return [...this.characters.monster];
    }

    getNPCs() {
        return [...this.characters.npc];
    }

    getCharactersByType(type) {
        return this.characters[type] ? [...this.characters[type]] : [];
    }

    getAllCharacters() {
        const allCharacters = [];
        for (const type in this.characters) {
            allCharacters.push(...this.characters[type]);
        }
        return allCharacters;
    }

    // Search and Filter
    searchCharacters(query, type = null) {
        const characters = type ? this.getCharactersByType(type) : this.getAllCharacters();
        const lowercaseQuery = query.toLowerCase();
        
        return characters.filter(character => 
            character.name.toLowerCase().includes(lowercaseQuery) ||
            character.class.toLowerCase().includes(lowercaseQuery) ||
            character.race.toLowerCase().includes(lowercaseQuery)
        );
    }

    getCharactersByLevel(minLevel, maxLevel, type = null) {
        const characters = type ? this.getCharactersByType(type) : this.getAllCharacters();
        return characters.filter(char => 
            char.level >= minLevel && char.level <= maxLevel
        );
    }

    getCharactersByClass(className, type = null) {
        const characters = type ? this.getCharactersByType(type) : this.getAllCharacters();
        return characters.filter(char => 
            char.class.toLowerCase().includes(className.toLowerCase())
        );
    }

    // Bulk Operations
    duplicateCharacter(characterId) {
        const character = this.getCharacter(characterId);
        if (character) {
            const duplicate = character.clone();
            duplicate.name = character.name + ' (Copy)';
            this.addCharacter(duplicate);
            return duplicate;
        }
        return null;
    }

    importCharacters(charactersData) {
        const imported = [];
        
        try {
            const data = Array.isArray(charactersData) ? charactersData : JSON.parse(charactersData);
            
            data.forEach(charData => {
                const character = Character.fromJSON(charData);
                this.addCharacter(character);
                imported.push(character);
            });
            
            return { success: true, imported: imported.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    exportCharacters(type = null) {
        const characters = type ? this.getCharactersByType(type) : this.getAllCharacters();
        const exportData = {
            characters: characters.map(char => char.toJSON()),
            exportDate: new Date().toISOString(),
            type: type,
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Statistics
    getLibraryStats() {
        const stats = {
            totalCharacters: this.getAllCharacters().length,
            byType: {
                players: this.characters.player.length,
                monsters: this.characters.monster.length,
                npcs: this.characters.npc.length
            },
            byLevel: {},
            byClass: {}
        };

        // Level distribution
        for (let level = 1; level <= 20; level++) {
            stats.byLevel[level] = this.getCharactersByLevel(level, level).length;
        }

        // Class distribution
        const allCharacters = this.getAllCharacters();
        const classes = {};
        allCharacters.forEach(char => {
            if (char.class) {
                classes[char.class] = (classes[char.class] || 0) + 1;
            }
        });
        stats.byClass = classes;

        return stats;
    }

    // Storage Management
    saveToStorage() {
        try {
            const data = {
                characters: {}
            };
            
            for (const type in this.characters) {
                data.characters[type] = this.characters[type].map(char => char.toJSON());
            }
            
            localStorage.setItem('dnd-character-library', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save character library:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('dnd-character-library');
            if (data) {
                const parsed = JSON.parse(data);
                
                for (const type in parsed.characters) {
                    this.characters[type] = parsed.characters[type].map(charData => 
                        Character.fromJSON(charData)
                    );
                }
            }
        } catch (error) {
            console.error('Failed to load character library:', error);
        }
    }

    clearStorage() {
        localStorage.removeItem('dnd-character-library');
        this.characters = {
            player: [],
            monster: [],
            npc: []
        };
    }

    // Backup and Restore
    createBackup() {
        const backup = {
            characters: {},
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        for (const type in this.characters) {
            backup.characters[type] = this.characters[type].map(char => char.toJSON());
        }
        
        return JSON.stringify(backup, null, 2);
    }

    restoreFromBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (backup.version !== '1.0') {
                return { success: false, error: 'Unsupported backup version' };
            }
            
            this.characters = {
                player: [],
                monster: [],
                npc: []
            };
            
            for (const type in backup.characters) {
                this.characters[type] = backup.characters[type].map(charData => 
                    Character.fromJSON(charData)
                );
            }
            
            this.saveToStorage();
            return { success: true, message: 'Backup restored successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Validation
    validateCharacter(character) {
        const errors = [];
        
        if (!character.name || character.name.trim() === '') {
            errors.push('Character name is required');
        }
        
        if (character.maxHp <= 0) {
            errors.push('Hit points must be greater than 0');
        }
        
        if (character.ac <= 0) {
            errors.push('Armor class must be greater than 0');
        }
        
        if (character.level < 1 || character.level > 20) {
            errors.push('Level must be between 1 and 20');
        }
        
        // Validate ability scores
        for (const ability in character.abilities) {
            const score = character.abilities[ability];
            if (score < 1 || score > 20) {
                errors.push(`${ability} must be between 1 and 20`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Name conflict resolution
    generateUniqueName(baseName, type) {
        const existingNames = this.getCharactersByType(type).map(char => char.name);
        
        if (!existingNames.includes(baseName)) {
            return baseName;
        }
        
        let counter = 1;
        let newName = `${baseName} (${counter})`;
        
        while (existingNames.includes(newName)) {
            counter++;
            newName = `${baseName} (${counter})`;
        }
        
        return newName;
    }
}