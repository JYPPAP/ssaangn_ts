# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean word guessing game (similar to Wordle) where players guess 2-character Korean words within 7 attempts. The game features sophisticated Korean text processing, multiple game modes, and emoji-based feedback system.

## Development Environment

**No Build System Required**: This is a pure client-side JavaScript application that runs directly in browsers using ES6 modules.

**To run the game**:
- Open `script.js` in a web browser with a local server
- No compilation, bundling, or package installation needed
- Uses manual cache-busting with query parameters (e.g., `hangul_tools.js?8`)

## Architecture Overview

### Core Modules

**`script.js`** - Main game engine (~60k tokens)
- Game state management and flow control
- UI rendering and event handling
- Multiple game modes (Daily, Race, Practice, Story)
- Statistics tracking and data persistence

**`hangul_tools.js`** - Korean text processing engine
- Real-time Korean character composition (`appendHangul()`)
- Smart character deletion (`deleteOneJamo()`)
- QWERTY to Korean character mapping
- Vowel/consonant pairing validation
- Unicode Hangul syllable manipulation

**`helper_tools.js`** - Utility functions
- Local storage management with type validation
- Mathematical utilities (clamp, remap, binary search)
- Time/date handling (Korean timezone)
- DOM manipulation helpers

**`word.js`** - Korean word dictionary (3000+ words)
- All 2-character Korean words used in gameplay

### Game Mechanics

**Word Matching System**: Uses sophisticated emoji-based feedback:
- 🥕 (당근) - Exact match
- 🍄 (버섯) - Similar (2+ matching jamo components, first consonant matches)
- 🧄 (마늘) - Many matches but first consonant differs
- 🍆 (가지) - Contains some jamo components
- 🍌 (바난) - Components exist in opposite positions
- 🍎 - No matches

**Game Constants**:
- `MAX_LETTERS = 2` (word length)
- `NUMBER_OF_GUESSES = 7` (attempts allowed)

### Korean Text Processing

The game's core innovation is real-time Korean character composition:

1. **Input Processing**: QWERTY keys map to Korean jamo (character components)
2. **Character Assembly**: Consonants and vowels combine to form complete syllables
3. **Smart Editing**: Deletion respects Korean character structure (consonant → vowel → batchim)
4. **Validation**: Checks for valid consonant/vowel pairings and syllable formation

### Game Modes

- **Daily Mode**: Single daily challenge word
- **Race Mode**: Progressive 3-lap challenge where:
  - Lap 1: Standard 7-guess gameplay
  - Lap 2: Previous answer appears as 🍎 hint in first row, new word excludes jamo components from Lap 1 answer
  - Lap 3: Previous two answers appear as 🍎 hints in first two rows, new word excludes jamo components from both previous answers
- **Practice Mode**: Uses curated practice word set
- **Story Mode**: Progressive narrative with images and themed words

### Data Management

**Local Storage Schema**:
- Game statistics and progress tracking
- Weekly performance metrics
- User preferences and settings
- Import/export functionality for data portability

**Global Statistics**: Shared community statistics with refresh cooldown system

## Key Functions for Development

### Korean Text Processing
- `appendHangul(text, key)` - Add Korean character to text
- `deleteOneJamo(text)` - Remove last character component
- `hangulSyllableToJamoComponentsText(syllable)` - Break syllable into components
- `keyboardKeyToJamoText(key)` - Convert QWERTY to Korean

### Game Logic
- `checkGuess()` - Validate word and provide feedback
- `initBoard()` - Set up game board
- `endGameWriteStats()` - Handle game completion

### Utility Functions
- `getFromStorage(key, type)` - Type-safe local storage retrieval
- `setStorage(key, value, type)` - Local storage with validation
- `clamp(num, low, high)` - Mathematical clamping

## Important Notes

**Korean Character Handling**: The game implements complex Korean typography rules. When modifying text processing, understand that Korean characters are composed of up to 3 components (initial consonant, vowel, final consonant) that must be handled atomically.

**Race Mode Jamo Filtering**: Race mode requires filtering words to exclude those containing jamo components from previous lap answers. This prevents component overlap between laps.

**Cache Management**: Files use manual cache-busting query parameters. When updating modules, increment the version number in the import statement.

**Browser Compatibility**: Uses modern ES6 features including modules, arrow functions, and template literals. Requires modern browser support.

**No Server Dependencies**: Entirely client-side application with no backend requirements.