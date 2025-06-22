# Create a Complete 9×9 Go Game (หมากล้อม) - Single Player vs AI Prompt

## Project Requirements

Create a fully functional 9×9 Go game web application with the following specifications:

### Core Game Features
- **Board**: 9×9 grid with proper Go board styling (wooden texture, grid lines)
- **Stones**: Black and white stones with realistic appearance
- **Player vs AI**: Human plays as black (goes first), AI plays as white
- **Move Validation**: Enforce all official Go rules
- **Game State Management**: Track captures, territory, ko rule, etc.

### Go Rules Implementation (Critical - Must Be Accurate)
1. **Stone Placement**: Only on empty intersections
2. **Capture Logic**: Remove groups with no liberties (breathing spaces)
3. **Ko Rule**: Prevent immediate recapture that returns to previous board state
4. **Suicide Rule**: Prevent moves that would capture your own stones (unless it captures opponent first)
5. **Territory Scoring**: Count empty intersections surrounded by one color
6. **Prisoner Counting**: Track captured stones
7. **Pass System**: Both players can pass; game ends when both pass consecutively

### AI Implementation
- **Difficulty Levels**: Easy, Medium, Hard
- **AI Strategy**: Use Monte Carlo Tree Search (MCTS) or minimax with Go-specific heuristics
- **Evaluation**: Consider territory control, stone safety, influence, and tactical patterns
- **Response Time**: AI should move within 1-3 seconds
- **Opening Patterns**: AI should know basic joseki and opening principles

### Technical Stack Recommendations
**Frontend**: React with TypeScript for type safety and component structure
**Styling**: Tailwind CSS for responsive design and clean UI
**State Management**: React hooks (useState, useReducer) for game state
**AI Logic**: Custom JavaScript implementation or integrate a lightweight Go engine
**Board Rendering**: Canvas API or SVG for precise stone placement and animations

### UI/UX Features
- **Interactive Board**: Click to place stones with hover preview
- **Game Controls**: New game, pass, resign, undo (if desired)
- **Score Display**: Show captured stones and current territory estimate
- **Move History**: Display recent moves with coordinates
- **Game Status**: Clear indication of whose turn, game over, winner
- **Responsive Design**: Work well on desktop and mobile devices

### Advanced Features (Nice to Have)
- **Handicap System**: Allow handicap stones for balanced play
- **Game Review**: Step through game history
- **Hint System**: Suggest good moves for beginners
- **Multiple AI Personalities**: Different playing styles
- **Save/Load Games**: Persist game state

### Code Quality Requirements
- **Clean Architecture**: Separate game logic, AI, and UI components
- **Type Safety**: Use TypeScript interfaces for game state, moves, board position
- **Performance**: Smooth animations, no lag during gameplay
- **Error Handling**: Graceful handling of invalid moves and edge cases
- **Documentation**: Clear comments explaining Go rules and AI decision making

### Deliverables
1. Complete working game with all rules implemented correctly
2. AI opponent that provides challenging but fair gameplay
3. Clean, intuitive user interface
4. Responsive design that works on various screen sizes
5. Well-structured, maintainable code

### Testing Considerations
- Verify all Go rules work correctly in edge cases
- Test AI performance across different game phases
- Ensure UI responsiveness and accessibility
- Validate game state persistence and recovery

**Priority**: Focus on accurate rule implementation first, then AI quality, then UI polish. The game must follow authentic Go rules precisely - this is more important than having advanced AI or fancy graphics.

**Cultural Note**: This is หมากล้อม (Go) - respect the traditional aspects while creating a modern digital experience.