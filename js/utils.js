// Utility functions for the D&D to Daggerheart converter

class ConverterUtils {
    static logConversionDetails(originalMonster, convertedAdversary) {
        console.group(`Conversion Details: ${originalMonster.name}`);
        console.log('Original 5e Stats:', {
            CR: originalMonster.cr,
            HP: originalMonster.hp,
            AC: originalMonster.ac,
            Type: originalMonster.type
        });
        console.log('Converted Daggerheart Stats:', {
            Role: convertedAdversary.role,
            Tier: convertedAdversary.tier,
            Vitality: convertedAdversary.vitality,
            Damage: convertedAdversary.damage,
            Defenses: convertedAdversary.defenses
        });
        console.groupEnd();
    }

    static validateConversion(adversary) {
        const errors = [];
        
        if (!adversary.name) errors.push('Missing name');
        if (!adversary.role) errors.push('Missing role');
        if (!adversary.tier) errors.push('Missing tier');
        if (!adversary.tags || adversary.tags.length === 0) errors.push('Missing tags');
        if (!adversary.defenses) errors.push('Missing defenses');
        if (!adversary.vitality) errors.push('Missing vitality');
        if (!adversary.damage) errors.push('Missing damage');
        
        if (errors.length > 0) {
            console.error('Conversion validation failed:', errors);
            return false;
        }
        
        return true;
    }

    static getConversionStats() {
        const monsters = bestiaryLoader.getAllMonsters();
        const stats = {
            totalMonsters: monsters.length,
            bySource: {},
            byCR: {},
            byType: {}
        };

        monsters.forEach(monster => {
            // Count by source
            const source = monster.source || 'Unknown';
            stats.bySource[source] = (stats.bySource[source] || 0) + 1;

            // Count by CR
            const cr = monster.cr || '0';
            stats.byCR[cr] = (stats.byCR[cr] || 0) + 1;

            // Count by type
            const type = monster.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }

    static searchMonstersByName(query) {
        if (!query || query.length < 2) return [];
        
        const monsters = bestiaryLoader.getAllMonsters();
        const lowerQuery = query.toLowerCase();
        
        return monsters
            .filter(monster => monster.name.toLowerCase().includes(lowerQuery))
            .sort((a, b) => {
                // Prioritize exact matches
                const aExact = a.name.toLowerCase() === lowerQuery;
                const bExact = b.name.toLowerCase() === lowerQuery;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Then prioritize starts with
                const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
                const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                // Finally alphabetical
                return a.name.localeCompare(b.name);
            })
            .slice(0, 20); // Limit results
    }

    static exportConvertedAdversary(adversary, format = 'markdown') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(adversary, null, 2);
            
            case 'yaml':
                return this._toYAML(adversary);
            
            case 'markdown':
            default:
                return converter.generateMarkdown(adversary);
        }
    }

    static _toYAML(obj, indent = 0) {
        const spaces = '  '.repeat(indent);
        let yaml = '';
        
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) continue;
            
            yaml += `${spaces}${key}:`;
            
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    yaml += ' []\n';
                } else {
                    yaml += '\n';
                    value.forEach(item => {
                        if (typeof item === 'object') {
                            yaml += `${spaces}  -\n${this._toYAML(item, indent + 2)}`;
                        } else {
                            yaml += `${spaces}  - ${item}\n`;
                        }
                    });
                }
            } else if (typeof value === 'object') {
                yaml += '\n';
                yaml += this._toYAML(value, indent + 1);
            } else {
                yaml += ` ${value}\n`;
            }
        }
        
        return yaml;
    }

    static createBatchConversionReport(monsterNames) {
        const report = {
            timestamp: new Date().toISOString(),
            totalRequested: monsterNames.length,
            successful: [],
            failed: []
        };

        monsterNames.forEach(name => {
            try {
                const monsters = this.searchMonstersByName(name);
                if (monsters.length === 0) {
                    report.failed.push({name, reason: 'Not found'});
                    return;
                }

                const monster = monsters[0]; // Take first match
                const adversary = converter.convertToDaggerheart(monster);
                
                if (this.validateConversion(adversary)) {
                    report.successful.push({
                        originalName: monster.name,
                        convertedName: adversary.name,
                        source: monster.source,
                        cr: monster.cr,
                        tier: adversary.tier,
                        role: adversary.role
                    });
                } else {
                    report.failed.push({name, reason: 'Validation failed'});
                }
            } catch (error) {
                report.failed.push({name, reason: error.message});
            }
        });

        report.successRate = (report.successful.length / report.totalRequested * 100).toFixed(1);
        
        return report;
    }
}

// Add utility functions to global scope for console debugging
window.converterUtils = ConverterUtils;