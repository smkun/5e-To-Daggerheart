// Bestiary loader for all JSON files
class BestiaryLoader {
    constructor() {
        this.monsters = new Map(); // name -> monster data
        this.loadingPromise = null;
    }

    // List of all bestiary files to load
    // NOTE: To add new files, simply add the filename to this array
    // The files should be in the 'bestiary/' directory
    getBestiaryFiles() {
        return [
            'bestiary-aatm.json',
            'bestiary-ai.json',
            'bestiary-aitfr-dn.json',
            'bestiary-aitfr-fcd.json',
            'bestiary-aitfr-isf.json',
            'bestiary-aitfr-thp.json',
            'bestiary-awm.json',
            'bestiary-bam.json',
            'bestiary-bgdia.json',
            'bestiary-bgg.json',
            'bestiary-bmt.json',
            'bestiary-cm.json',
            'bestiary-coa.json',
            'bestiary-cos.json',
            'bestiary-crcotn.json',
            'bestiary-dc.json',
            'bestiary-dip.json',
            'bestiary-ditlcot.json',
            'bestiary-dmg.json',
            'bestiary-dod.json',
            'bestiary-dosi.json',
            'bestiary-dsotdq.json',
            'bestiary-egw.json',
            'bestiary-erlw.json',
            'bestiary-esk.json',
            'bestiary-ftd.json',
            'bestiary-ggr.json',
            'bestiary-gos.json',
            'bestiary-gotsf.json',
            'bestiary-hat-tg.json',
            'bestiary-hftt.json',
            'bestiary-hol.json',
            'bestiary-hotdq.json',
            'bestiary-idrotf.json',
            'bestiary-imr.json',
            'bestiary-jttrc.json',
            'bestiary-kftgv.json',
            'bestiary-kkw.json',
            'bestiary-llk.json',
            'bestiary-lmop.json',
            'bestiary-lox.json',
            'bestiary-lr.json',
            'bestiary-lrdt.json',
            'bestiary-mabjov.json',
            'bestiary-mcv1sc.json',
            'bestiary-mcv2dc.json',
            'bestiary-mcv3mc.json',
            'bestiary-mcv4ec.json',
            'bestiary-mff.json',
            'bestiary-mgelft.json',
            'bestiary-mismv1.json',
            'bestiary-mm.json',
            'bestiary-mot.json',
            'bestiary-mpmm.json',
            'bestiary-mpp.json',
            'bestiary-mtf.json',
            'bestiary-nrh-ass.json',
            'bestiary-nrh-at.json',
            'bestiary-nrh-avitw.json',
            'bestiary-nrh-awol.json',
            'bestiary-nrh-coi.json',
            'bestiary-nrh-tcmc.json',
            'bestiary-nrh-tlt.json',
            'bestiary-oota.json',
            'bestiary-oow.json',
            'bestiary-pabtso.json',
            'bestiary-phb.json',
            'bestiary-pota.json',
            'bestiary-ps-a.json',
            'bestiary-ps-d.json',
            'bestiary-ps-i.json',
            'bestiary-ps-k.json',
            'bestiary-ps-x.json',
            'bestiary-ps-z.json',
            'bestiary-qftis.json',
            'bestiary-rmbre.json',
            'bestiary-rot.json',
            'bestiary-rtg.json',
            'bestiary-sads.json',
            'bestiary-scc.json',
            'bestiary-sdw.json',
            'bestiary-skt.json',
            'bestiary-slw.json',
            'bestiary-tce.json',
            'bestiary-tdcsr.json',
            'bestiary-tftyp.json',
            'bestiary-toa.json',
            'bestiary-tofw.json',
            'bestiary-ttp.json',
            'bestiary-vd.json',
            'bestiary-veor.json',
            'bestiary-vgm.json',
            'bestiary-vrgr.json',
            'bestiary-wbtw.json',
            'bestiary-wdh.json',
            'bestiary-wdmm.json',
            'bestiary-xdmg.json',
            'bestiary-xge.json',
            'bestiary-xmm.json',
            'bestiary-xphb.json'
        ];
    }

    async loadAllBestiaries() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadBestiariesInternal();
        return this.loadingPromise;
    }

    async _loadBestiariesInternal() {
        const files = this.getBestiaryFiles();
        const loadPromises = files.map(file => this._loadBestiaryFile(file));
        
        const results = await Promise.allSettled(loadPromises);
        
        let totalMonsters = 0;
        let loadedFiles = 0;
        let errors = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                totalMonsters += result.value;
                loadedFiles++;
            } else {
                errors.push(`Failed to load ${files[index]}: ${result.reason.message}`);
            }
        });

        console.log(`Loaded ${totalMonsters} monsters from ${loadedFiles}/${files.length} bestiary files`);
        
        if (errors.length > 0) {
            console.warn('Some bestiary files failed to load:', errors);
        }

        return {
            totalMonsters,
            loadedFiles,
            totalFiles: files.length,
            errors
        };
    }

    async _loadBestiaryFile(filename) {
        try {
            const response = await fetch(`bestiary/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const monsters = data.monster || [];
            
            let count = 0;
            monsters.forEach(monster => {
                if (monster.name && this._isValidMonster(monster)) {
                    // Create a unique key for the monster
                    const key = this._generateMonsterKey(monster);
                    
                    // Normalize the monster data to our expected format
                    const normalizedMonster = this._normalizeMonster(monster);
                    this.monsters.set(key, normalizedMonster);
                    count++;
                }
            });

            console.log(`Loaded ${count} monsters from ${filename}`);
            return count;
        } catch (error) {
            console.error(`Failed to load ${filename}:`, error);
            throw error;
        }
    }

    _isValidMonster(monster) {
        // Check if monster has required fields for conversion
        return monster.name && 
               monster.cr !== undefined && 
               monster.hp !== undefined &&
               monster.ac !== undefined;
    }

    _generateMonsterKey(monster) {
        // Create a unique key: name + source + page (if available)
        let key = monster.name.toLowerCase().replace(/\s+/g, '_');
        if (monster.source) {
            key += `_${monster.source.toLowerCase()}`;
        }
        if (monster.page) {
            key += `_${monster.page}`;
        }
        return key;
    }

    _normalizeMonster(monster) {
        // Convert 5eTools format to our internal format
        const normalized = {
            name: monster.name,
            source: monster.source,
            page: monster.page,
            size: Array.isArray(monster.size) ? monster.size[0] : monster.size,
            type: monster.type,
            alignment: this._normalizeAlignment(monster.alignment),
            ac: this._normalizeAC(monster.ac),
            hp: this._normalizeHP(monster.hp),
            speed: this._normalizeSpeed(monster.speed),
            str: monster.str || 10,
            dex: monster.dex || 10,
            con: monster.con || 10,
            int: monster.int || 10,
            wis: monster.wis || 10,
            cha: monster.cha || 10,
            saves: monster.save || {},
            skills: monster.skill || {},
            senses: monster.senses || [],
            languages: monster.languages || [],
            cr: this._normalizeCR(monster.cr),
            traits: this._normalizeAbilities(monster.trait || []),
            actions: this._normalizeAbilities(monster.action || []),
            reactions: this._normalizeAbilities(monster.reaction || []),
            legendary_actions: this._normalizeAbilities(monster.legendary || [])
        };

        return normalized;
    }

    _normalizeAlignment(alignment) {
        if (!alignment) return 'Unaligned';
        if (Array.isArray(alignment)) {
            return alignment.join(' ');
        }
        return alignment;
    }

    _normalizeAC(ac) {
        if (!ac) return 10;
        if (Array.isArray(ac)) {
            return ac[0].ac || ac[0];
        }
        if (typeof ac === 'object') {
            return ac.ac || 10;
        }
        return ac;
    }

    _normalizeHP(hp) {
        if (!hp) return 1;
        if (typeof hp === 'object') {
            return hp.average || hp.formula || 1;
        }
        return hp;
    }

    _normalizeSpeed(speed) {
        if (!speed) return '30 ft.';
        if (typeof speed === 'object') {
            const parts = [];
            if (speed.walk) parts.push(`${speed.walk} ft.`);
            if (speed.fly) {
                const flySpeed = typeof speed.fly === 'object' ? speed.fly.number : speed.fly;
                const condition = typeof speed.fly === 'object' && speed.fly.condition ? ` ${speed.fly.condition}` : '';
                parts.push(`fly ${flySpeed} ft.${condition}`);
            }
            if (speed.swim) parts.push(`swim ${speed.swim} ft.`);
            if (speed.climb) parts.push(`climb ${speed.climb} ft.`);
            if (speed.burrow) parts.push(`burrow ${speed.burrow} ft.`);
            return parts.join(', ') || '30 ft.';
        }
        return speed;
    }

    _normalizeCR(cr) {
        if (!cr) return '0';
        if (typeof cr === 'object') {
            return cr.cr || '0';
        }
        return cr.toString();
    }

    _normalizeAbilities(abilities) {
        if (!Array.isArray(abilities)) return [];
        
        return abilities.map(ability => ({
            name: ability.name || 'Unnamed',
            desc: this._joinEntries(ability.entries || []),
            damage: this._extractDamage(ability.entries || [])
        }));
    }

    _joinEntries(entries) {
        if (!Array.isArray(entries)) return entries || '';
        return entries.join(' ');
    }

    _extractDamage(entries) {
        if (!Array.isArray(entries)) return '';
        const text = entries.join(' ');
        // Look for damage patterns like "1d6+2", "2d8", etc.
        const damageMatch = text.match(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)/);
        return damageMatch ? damageMatch[1] : '';
    }

    getAllMonsters() {
        return Array.from(this.monsters.values());
    }

    getMonster(key) {
        return this.monsters.get(key);
    }

    searchMonsters(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.monsters.values()).filter(monster => 
            monster.name.toLowerCase().includes(lowerQuery)
        );
    }

    getMonstersBySource(source) {
        return Array.from(this.monsters.values()).filter(monster => 
            monster.source === source
        );
    }

    getMonstersCount() {
        return this.monsters.size;
    }
}

// Global bestiary loader instance
const bestiaryLoader = new BestiaryLoader();