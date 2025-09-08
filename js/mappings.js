// Conversion mappings based on the Python YAML configuration
const mappings = {
    // CR to Tier mapping (updated to match Python version)
    cr_to_tier: {
        "0": "Tier 0", "1/8": "Tier 0", "1/4": "Tier 0", "1/2": "Tier 0",
        "1": "Tier 1", "2": "Tier 1", "3": "Tier 1",
        "4": "Tier 2", "5": "Tier 2", "6": "Tier 2", "7": "Tier 2", "8": "Tier 2", "9": "Tier 2", "10": "Tier 2",
        "11": "Tier 3", "12": "Tier 3", "13": "Tier 3", "14": "Tier 3", "15": "Tier 3", "16": "Tier 3",
        "17": "Tier 4", "18": "Tier 4", "19": "Tier 4", "20": "Tier 4", "21": "Tier 4", "22": "Tier 4", 
        "23": "Tier 4", "24": "Tier 4", "25": "Tier 4", "26": "Tier 4", "27": "Tier 4", "28": "Tier 4", 
        "29": "Tier 4", "30": "Tier 4"
    },

    // AC to Defense mapping
    ac_to_defense_offset: {
        base_guard: 10,
        ac_pivot: 13
    },

    // HP to Vitality mapping (updated to match Python version)
    hp_to_vitality: [
        {max_hp: 15, vitality: 6},
        {max_hp: 35, vitality: 8},
        {max_hp: 60, vitality: 10},
        {max_hp: 90, vitality: 12},
        {max_hp: 130, vitality: 14},
        {max_hp: 9999, vitality: 16}
    ],

    // Damage mapping (updated to match Python version)
    damage_step: [
        {max_avg: 6, dice: "1d6"},
        {max_avg: 10, dice: "1d8"},
        {max_avg: 14, dice: "1d10"},
        {max_avg: 18, dice: "2d6"},
        {max_avg: 24, dice: "2d8"},
        {max_avg: 999, dice: "2d10"}
    ],

    // Type to Tags mapping (expanded from Python version)
    type_to_tags: {
        "aberration": ["Aberrant"],
        "beast": ["Beast"],
        "celestial": ["Celestial", "Holy"],
        "construct": ["Construct"],
        "dragon": ["Dragon"],
        "elemental": ["Elemental"],
        "fey": ["Fey"],
        "fiend": ["Fiend", "Unholy"],
        "giant": ["Giant"],
        "humanoid": ["Humanoid"],
        "monstrosity": ["Monstrosity"],
        "ooze": ["Ooze"],
        "plant": ["Plant"],
        "undead": ["Undead", "Unholy"]
    }
};