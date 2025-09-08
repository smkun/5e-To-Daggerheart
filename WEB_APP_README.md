# D&D 5e to Daggerheart Converter - Web Application

This is a web-based version of the D&D 5e to Daggerheart creature converter, converted from the original Python implementation.

## Features

- **Complete Bestiary Integration**: Loads ALL monsters from the bestiary JSON files (18+ files)
- **Three Input Methods**:
  - Select from SRD monsters (loaded from bestiary files)
  - Create custom creatures with manual input
  - Parse raw D&D 5e statblock text
- **Accurate Conversion**: Based on the original Python implementation with proper mappings
- **Modern Web Interface**: Responsive design with clean UI
- **Export Options**: Copy to clipboard or download as Markdown

## File Structure

```
/
├── index.html              # Main web application
├── styles.css             # CSS styling
├── script.js              # Main application logic
├── js/                    # JavaScript modules
│   ├── mappings.js        # Conversion mappings (from YAML)
│   ├── bestiary-loader.js # Handles loading all JSON files
│   ├── converter.js       # Core conversion logic
│   └── utils.js           # Utility functions for debugging
└── bestiary/              # Monster data files
    ├── bestiary-aatm.json
    ├── bestiary-ai.json
    ├── bestiary-bmt.json
    └── ... (18+ files)
```

## Setup Instructions

1. **Ensure File Structure**: Make sure all bestiary JSON files are in the `bestiary/` folder
2. **Run Local Server**: Due to CORS restrictions, you need to serve the files via HTTP:
   
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open Browser**: Navigate to `http://localhost:8000`

## Usage

### Loading Monsters
The app automatically loads all monsters from the bestiary JSON files when it starts. You'll see a loading message, and then the dropdown will be populated with all available monsters.

### Converting Monsters

1. **SRD Monsters**: 
   - Select the "Choose from SRD Monsters" radio button
   - Pick a monster from the dropdown (shows name, CR, and source)
   - Click "Convert Selected Monster"

2. **Custom Creatures**:
   - Select "Create Custom Creature"
   - Fill in the creature details (name, CR, stats, etc.)
   - Click "Convert Custom Creature"

3. **Text Parser**:
   - Select "Parse Raw Statblock Text"
   - Paste a D&D 5e statblock
   - Click "Parse & Convert"

### Export Options
After conversion, use the buttons to:
- **Copy to Clipboard**: Copy the Markdown output
- **Download as Markdown**: Save as a .md file

## Conversion Details

The converter uses the same logic as the Python version:

- **CR to Tier**: Maps D&D Challenge Rating to Daggerheart Tiers (0-4)
- **HP to Vitality**: Converts hit points to Daggerheart vitality scores
- **Damage Scaling**: Converts D&D damage to appropriate Daggerheart dice
- **Defense Calculation**: Maps AC to Guard, ability scores to Will/Wits
- **Type to Tags**: Converts creature types to Daggerheart tags
- **Role Determination**: Assigns Minion/Standard/Elite/Boss based on CR

## Developer Console

The app includes utility functions available in the browser console:

```javascript
// Get conversion statistics
converterUtils.getConversionStats()

// Search for monsters
converterUtils.searchMonstersByName("dragon")

// Get loading information
bestiaryLoader.getMonstersCount()

// Access raw monster data
bestiaryLoader.getAllMonsters()
```

## Troubleshooting

### "Failed to load bestiary files"
- Ensure you're running via HTTP server (not file://)
- Check that bestiary/*.json files exist
- Check browser console for specific error messages

### "No monsters loaded"
- Verify JSON files are valid
- Check network tab in browser dev tools
- Ensure files are accessible via HTTP

### Conversion Errors
- Check browser console for detailed error messages
- Verify input monster data is complete
- Test with known working monsters first

## Differences from Python Version

### Improvements
- Loads ALL bestiary files (not just SRD)
- Better error handling and user feedback
- Interactive web interface
- Real-time validation
- Export options

### Limitations
- Requires HTTP server (can't run from file system)
- Limited to browser JavaScript capabilities
- No command-line batch processing

## Performance

- **Loading**: ~18 JSON files, typically 2-5 seconds
- **Monster Count**: 1000+ monsters depending on bestiary files
- **Memory Usage**: Reasonable for modern browsers
- **Conversion Speed**: Near-instant after loading

## Browser Compatibility

- **Recommended**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Required Features**: ES6 modules, Fetch API, async/await
- **Not Supported**: Internet Explorer

## Contributing

To modify the conversion logic:

1. **Mappings**: Edit `js/mappings.js` for CR/tier/damage mappings
2. **Conversion**: Edit `js/converter.js` for core conversion logic
3. **Loading**: Edit `js/bestiary-loader.js` to add new bestiary files
4. **UI**: Edit `index.html` and `styles.css` for interface changes

The modular structure makes it easy to maintain and extend functionality.