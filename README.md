# 🐉 D&D 5e to Daggerheart Converter

A comprehensive web application that converts D&D 5e monsters into Daggerheart adversaries with intelligent feature detection, comprehensive bestiary integration, and a dark fantasy interface.

## ✨ Features

### 🎯 **Complete Monster Coverage**

- **80+ Bestiary Files**: Loads all official D&D 5e monsters from JSON files
- **Comprehensive Database**: 3,000+ creatures from MM, VGM, MTF, and all supplements
- **Automatic Updates**: Simply add new bestiary files to load additional monsters

### 🔄 **Smart Conversion System**

- **Intelligent Role Detection**: Automatically assigns Bruiser/Skulk/Leader/etc. based on abilities
- **Dynamic Feature Generation**: Converts D&D traits into Daggerheart features
- **Contextual Descriptions**: Generated descriptions based on creature characteristics
- **Accurate Scaling**: Proper CR-to-Tier and damage conversion

### 🎲 **Advanced Feature Detection**

- **Breath Weapons**: Fire/Cold/Lightning/Acid/Poison breath attacks
- **Frightening Presence**: Fear-based abilities
- **Flight Abilities**: "From Above" positioning features
- **Legendary Actions & Resistance**: High-tier creature mechanics
- **Special Abilities**: Pack tactics, regeneration, magic resistance, etc.
- **Damage Types**: Resistances and immunities

### 🖥️ **Three Input Methods**

1. **Monster Library**: Select from complete bestiary database
2. **Custom Creator**: Build creatures from scratch with form inputs
3. **Text Parser**: Paste D&D 5e statblocks for automatic parsing

### 🎨 **Dark Fantasy Interface**

- **Sinister Theme**: Black and red color scheme with D&D atmosphere
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Professional Output**: Clean, readable Daggerheart statblocks
- **Export Options**: Copy to clipboard or download as Markdown

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- Local web server (required for file loading)

### Installation

1. **Clone or Download** the repository:

   ```bash
   git clone [repository-url]
   cd "5e To Daggerheart"
   ```

2. **Start a Local Server** (required for CORS):

   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server
   
   # PHP
   php -S localhost:8000
   ```

3. **Open Your Browser**:

   ```text
   http://localhost:8000
   ```

4. **Wait for Loading**: The app will automatically load all bestiary files (takes 3-5 seconds)

## 📖 How to Use

### Converting Existing Monsters

1. **Select "Choose from SRD Monsters"** (default)
2. **Pick a creature** from the dropdown (shows name, CR, and source book)
3. **Click "Convert Selected Monster"**
4. **View Results** in the right panel
5. **Export**: Use Copy or Download buttons

**Example Output:**

```text
ANCIENT RED DRAGON
Tier 4 Bruiser
A gargantuan dragon chromatic who strikes from the sky.
Motives & Tactics: Break lines, Smash frontliners, Charge

Difficulty: 18 | Thresholds: 19/35 | HP: 7 | Stress: 4
ATK: +4 | Bite: Very Close | 2d8+2 phy

Experience: Keen Senses +3

FEATURES
From Above - Passive: When this adversary succeeds on a standard attack from above a target, deal one die-step higher damage instead of standard damage.
Fire Breath - Action: Spend a Fear to unleash a devastating area attack affecting all enemies within Close range.
Frightening Presence - Action: Spend a Fear to cause all enemies within Close range to mark Stress.
Legendary Resistance - Passive: Three times per encounter, when this adversary fails a roll, they can choose to succeed instead.
Legendary Actions - Passive: At the end of each PC turn, this adversary can take one additional action.
```

### Creating Custom Creatures

1. **Select "Create Custom Creature"**
2. **Fill in the form** with creature details:

   - Name, CR, HP, AC
   - All six ability scores
   - Creature type and speed
   - Actions (one per line)

3. **Click "Convert Custom Creature"**

### Parsing Statblocks

1. **Select "Parse Raw Statblock Text"**
2. **Paste D&D 5e statblock text** into the textarea
3. **Click "Parse & Convert"**

## 🛠️ File Structure

```text
📁 5e To Daggerheart/
├── 📄 index.html           # Main application
├── 🎨 styles.css           # Dark fantasy theme
├── 📜 script.js            # Main application logic
├── 📁 js/                  # Core modules
│   ├── 🔧 converter.js     # Advanced conversion engine
│   ├── 📚 bestiary-loader.js # Loads all 80+ JSON files
│   ├── 🗺️ mappings.js      # CR/tier/damage mappings
│   └── 🔍 utils.js         # Utility functions
├── 📁 bestiary/            # Monster database (80+ files)
│   ├── 📊 bestiary-mm.json # Monster Manual
│   ├── 📊 bestiary-vgm.json # Volo's Guide
│   ├── 📊 bestiary-mtf.json # Mordenkainen's
│   └── ... (77+ more files)
└── 📋 README.md            # This file
```

## ⚙️ Conversion Logic

### Role Assignment

- **Skulk**: Stealth-focused, ambush creatures
- **Ranged**: Creatures with ranged attacks, no stealth
- **Bruiser**: Large size + high HP or multiattack
- **Leader**: Summoning abilities or support spells
- **Minion**: CR < 1/4 or HP < 8
- **Standard**: Default for most creatures

### Feature Detection

The converter automatically detects and converts:

| D&D Ability | Daggerheart Feature | Trigger |
|-------------|-------------------|---------|
| Multiattack (4+ attacks) | Flurry | Complex multiattack patterns |
| Breath Weapon | Fire/Cold/Lightning/etc. Breath | "breath" or "recharge" in actions |
| Frightful Presence | Frightening Presence | "frighten", "fear", "frightful" |
| Flying Speed | From Above | Flying speed or dive attacks |
| Pack Tactics | Pack Hunters | Pack tactics trait |
| Poison/Venom | Venomous Strike | Poison-related abilities |
| Regeneration | Regeneration | Regeneration trait |
| Legendary Resistance | Legendary Resistance | Legendary resistance trait |
| Legendary Actions | Legendary Actions | Has legendary action array |
| Keen Senses | Keen Senses | Keen sight/smell/hearing |
| Magic Resistance | Magic Resistance | Magic resistance trait |

### Experience Generation

Automatically assigns experiences based on highest skill bonus:

- **Perception** → Keen Senses +2/+3
- **Stealth** → Stealth +2/+3  
- **Arcana** → Arcane Knowledge +2/+3
- **And 12 more skill mappings...**

## 🎯 Advanced Features

### Console Commands

Open browser dev tools (F12) and try:

```javascript
// Get conversion statistics
console.log(`Loaded ${bestiaryLoader.getMonstersCount()} monsters`);

// Search for creatures
bestiaryLoader.searchMonsters("dragon").forEach(m => console.log(m.name));

// Get specific monster data
const dragon = bestiaryLoader.searchMonsters("ancient red dragon")[0];
console.log(dragon);
```

### Adding New Bestiary Files

1. **Place JSON files** in the `bestiary/` folder
2. **Update the file list** in `js/bestiary-loader.js`:

   ```javascript
   getBestiaryFiles() {
       return [
           // ... existing files ...
           'bestiary-new-supplement.json',  // Add here
       ];
   }
   ```

### Customizing Features

Edit `js/converter.js` to modify feature detection:

```javascript
// Add new feature detection
if (hasTrait(mon, /your-pattern/i)) {
    feats.push({ 
        kind:'Action', 
        name:'Custom Feature', 
        text:'Your feature description.' 
    });
}
```

## 🐛 Troubleshooting

### Common Issues

#### "No monsters loaded"

- ✅ Running via HTTP server (not `file://`)?
- ✅ All bestiary JSON files present in `bestiary/` folder?
- ✅ Check browser console (F12) for error messages

#### "Conversion failed"

- ✅ Monster has required fields (name, CR, HP, AC)?
- ✅ Check console for specific error details
- ✅ Try with a known working monster first

#### "Features not appearing"

- ✅ Monster data includes `trait`, `action`, or `legendary` arrays?
- ✅ Check monster's raw JSON data in console
- ✅ Verify feature detection patterns match monster abilities

### Performance Tips

- **Initial Load**: 3-5 seconds for 80+ files
- **Memory Usage**: ~50-100MB for full bestiary
- **Conversion Speed**: Near-instant after loading
- **Browser Limit**: ~10,000 monsters maximum

## 🎨 Theme Customization

The dark D&D theme uses these color variables in `styles.css`:

```css
/* Primary Colors */
--primary-red: #DC143C;    /* Crimson */
--dark-red: #8B0000;       /* Dark Red */
--bg-black: #1a0000;       /* Deep Black-Red */
--text-light: #e0e0e0;     /* Light Gray */
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Make changes to relevant files
3. Test thoroughly with multiple monsters
4. Submit pull request

### Key Areas for Enhancement

- **Feature Detection**: Add more D&D ability patterns
- **UI Improvements**: Enhanced mobile experience
- **Export Formats**: PDF, JSON, or other formats
- **Batch Processing**: Convert multiple monsters at once

## 📋 Changelog

### Current Version

- ✅ Complete bestiary integration (80+ files)
- ✅ Advanced feature detection system
- ✅ Intelligent role assignment
- ✅ Dark fantasy theme
- ✅ Comprehensive experience mapping
- ✅ Dynamic descriptions
- ✅ Full size name conversion (gargantuan vs G)
- ✅ Selective multiattack filtering

### Roadmap

- 🔄 Batch conversion mode
- 🔄 PDF export option
- 🔄 Advanced filtering and search
- 🔄 Monster comparison tools

## 📄 License

This project is for personal and educational use. D&D 5e content is owned by Wizards of the Coast. Daggerheart content is owned by Darrington Press.

---

Convert with confidence! 🐉⚔️
