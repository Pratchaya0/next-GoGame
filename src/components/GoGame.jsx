'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, RotateCcw, Flag, Users, Brain, Zap } from 'lucide-react';

// Game constants
const BOARD_SIZE = 9;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// Utility functions
const getOpponent = (color) => color === BLACK ? WHITE : BLACK;
const colorToString = (color) => color === BLACK ? 'Black' : color === WHITE ? 'White' : 'Empty';

// Board utilities
const getNeighbors = (row, col) => {
  const neighbors = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
      neighbors.push([newRow, newCol]);
    }
  }
  return neighbors;
};

const getGroup = (board, row, col) => {
  const color = board[row][col];
  if (color === EMPTY) return [];
  
  const group = [];
  const visited = new Set();
  const stack = [[row, col]];
  
  while (stack.length > 0) {
    const [r, c] = stack.pop();
    const key = `${r},${c}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (board[r][c] === color) {
      group.push([r, c]);
      for (const [nr, nc] of getNeighbors(r, c)) {
        if (!visited.has(`${nr},${nc}`)) {
          stack.push([nr, nc]);
        }
      }
    }
  }
  return group;
};

const getLiberties = (board, group) => {
  const liberties = new Set();
  for (const [row, col] of group) {
    for (const [nr, nc] of getNeighbors(row, col)) {
      if (board[nr][nc] === EMPTY) {
        liberties.add(`${nr},${nc}`);
      }
    }
  }
  return liberties.size;
};

const getCapturedGroups = (board, color) => {
  const capturedGroups = [];
  const visited = new Set();
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`;
      if (board[row][col] === color && !visited.has(key)) {
        const group = getGroup(board, row, col);
        group.forEach(([r, c]) => visited.add(`${r},${c}`));
        
        if (getLiberties(board, group) === 0) {
          capturedGroups.push(group);
        }
      }
    }
  }
  return capturedGroups;
};

// Game logic
const isValidMove = (board, row, col, color, koState) => {
  // Check if position is empty
  if (board[row][col] !== EMPTY) return false;
  
  // Create test board
  const testBoard = board.map(row => [...row]);
  testBoard[row][col] = color;
  
  // Check for captures
  const opponentColor = getOpponent(color);
  let capturedSomething = false;
  
  // Remove captured opponent groups
  for (const [nr, nc] of getNeighbors(row, col)) {
    if (testBoard[nr][nc] === opponentColor) {
      const group = getGroup(testBoard, nr, nc);
      if (getLiberties(testBoard, group) === 0) {
        group.forEach(([r, c]) => testBoard[r][c] = EMPTY);
        capturedSomething = true;
      }
    }
  }
  
  // Check suicide rule
  const ownGroup = getGroup(testBoard, row, col);
  if (getLiberties(testBoard, ownGroup) === 0 && !capturedSomething) {
    return false;
  }
  
  // Check Ko rule
  if (koState && boardsEqual(testBoard, koState)) {
    return false;
  }
  
  return true;
};

const boardsEqual = (board1, board2) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board1[row][col] !== board2[row][col]) return false;
    }
  }
  return true;
};

const copyBoard = (board) => board.map(row => [...row]);

const makeMove = (board, row, col, color) => {
  const newBoard = copyBoard(board);
  newBoard[row][col] = color;
  
  const opponentColor = getOpponent(color);
  let captured = 0;
  
  // Capture opponent groups
  for (const [nr, nc] of getNeighbors(row, col)) {
    if (newBoard[nr][nc] === opponentColor) {
      const group = getGroup(newBoard, nr, nc);
      if (getLiberties(newBoard, group) === 0) {
        group.forEach(([r, c]) => newBoard[r][c] = EMPTY);
        captured += group.length;
      }
    }
  }
  
  return { board: newBoard, captured };
};

// Simple AI using basic heuristics
const evaluatePosition = (board, color) => {
  let score = 0;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === color) {
        // Corner and edge bonuses
        if ((row === 0 || row === BOARD_SIZE - 1) && (col === 0 || col === BOARD_SIZE - 1)) {
          score += 3; // Corner
        } else if (row === 0 || row === BOARD_SIZE - 1 || col === 0 || col === BOARD_SIZE - 1) {
          score += 2; // Edge
        } else {
          score += 1; // Center
        }
        
        // Liberty bonus
        const group = getGroup(board, row, col);
        score += getLiberties(board, group) * 0.5;
      }
    }
  }
  
  return score;
};

const getAIMove = (board, color, difficulty = 'medium') => {
  const validMoves = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(board, row, col, color, null)) {
        validMoves.push([row, col]);
      }
    }
  }
  
  if (validMoves.length === 0) return null;
  
  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  
  // Evaluate moves
  let bestMove = null;
  let bestScore = -Infinity;
  
  for (const [row, col] of validMoves) {
    const { board: testBoard } = makeMove(board, row, col, color);
    let score = evaluatePosition(testBoard, color) - evaluatePosition(testBoard, getOpponent(color));
    
    // Add some randomness for medium difficulty
    if (difficulty === 'medium') {
      score += (Math.random() - 0.5) * 2;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = [row, col];
    }
  }
  
  return bestMove;
};

// Calculate territory (simplified)
const calculateTerritory = (board) => {
  const territory = { [BLACK]: 0, [WHITE]: 0 };
  const visited = new Set();
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row},${col}`;
      if (board[row][col] === EMPTY && !visited.has(key)) {
        const area = [];
        const stack = [[row, col]];
        const borders = new Set();
        
        while (stack.length > 0) {
          const [r, c] = stack.pop();
          const areaKey = `${r},${c}`;
          
          if (visited.has(areaKey)) continue;
          visited.add(areaKey);
          
          if (board[r][c] === EMPTY) {
            area.push([r, c]);
            for (const [nr, nc] of getNeighbors(r, c)) {
              if (!visited.has(`${nr},${nc}`)) {
                stack.push([nr, nc]);
              }
            }
          } else {
            borders.add(board[r][c]);
          }
        }
        
        // If area is surrounded by only one color, it's territory
        if (borders.size === 1) {
          const owner = Array.from(borders)[0];
          territory[owner] += area.length;
        }
      }
    }
  }
  
  return territory;
};

// Main game component
const GoGame = () => {
  const [board, setBoard] = useState(() => 
    Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY))
  );
  const [currentPlayer, setCurrentPlayer] = useState(BLACK);
  const [gameStatus, setGameStatus] = useState('playing');
  const [captures, setCaptures] = useState({ [BLACK]: 0, [WHITE]: 0 });
  const [koState, setKoState] = useState(null);
  const [passCount, setPassCount] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [moveHistory, setMoveHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  
  const aiTimeoutRef = useRef(null);
  
  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY)));
    setCurrentPlayer(BLACK);
    setGameStatus('playing');
    setCaptures({ [BLACK]: 0, [WHITE]: 0 });
    setKoState(null);
    setPassCount(0);
    setMoveHistory([]);
    setIsThinking(false);
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
  }, []);
  
  const makePlayerMove = useCallback((row, col) => {
    if (gameStatus !== 'playing' || currentPlayer !== BLACK || isThinking) return false;
    
    if (!isValidMove(board, row, col, BLACK, koState)) return false;
    
    const oldBoard = copyBoard(board);
    const { board: newBoard, captured } = makeMove(board, row, col, BLACK);
    
    setBoard(newBoard);
    setCaptures(prev => ({ ...prev, [BLACK]: prev[BLACK] + captured }));
    setKoState(captured > 0 ? oldBoard : null);
    setCurrentPlayer(WHITE);
    setPassCount(0);
    setMoveHistory(prev => [...prev, { player: BLACK, row, col, captured }]);
    
    return true;
  }, [board, currentPlayer, gameStatus, koState, isThinking]);
  
  const makeAIMove = useCallback(() => {
    if (gameStatus !== 'playing' || currentPlayer !== WHITE) return;
    
    setIsThinking(true);
    
    aiTimeoutRef.current = setTimeout(() => {
      const move = getAIMove(board, WHITE, difficulty);
      
      if (move) {
        const [row, col] = move;
        const oldBoard = copyBoard(board);
        const { board: newBoard, captured } = makeMove(board, row, col, WHITE);
        
        setBoard(newBoard);
        setCaptures(prev => ({ ...prev, [WHITE]: prev[WHITE] + captured }));
        setKoState(captured > 0 ? oldBoard : null);
        setMoveHistory(prev => [...prev, { player: WHITE, row, col, captured }]);
        setPassCount(0);
      } else {
        // AI passes
        setPassCount(prev => prev + 1);
        setMoveHistory(prev => [...prev, { player: WHITE, pass: true }]);
      }
      
      setCurrentPlayer(BLACK);
      setIsThinking(false);
    }, Math.random() * 1000 + 500); // Random delay 0.5-1.5s
  }, [board, currentPlayer, gameStatus, difficulty]);
  
  const handlePass = useCallback(() => {
    if (gameStatus !== 'playing' || currentPlayer !== BLACK || isThinking) return;
    
    const newPassCount = passCount + 1;
    setPassCount(newPassCount);
    setMoveHistory(prev => [...prev, { player: BLACK, pass: true }]);
    
    if (newPassCount >= 2) {
      // Game ends
      const territory = calculateTerritory(board);
      const blackScore = captures[BLACK] + territory[BLACK];
      const whiteScore = captures[WHITE] + territory[WHITE];
      
      if (blackScore > whiteScore) {
        setGameStatus('black_wins');
      } else if (whiteScore > blackScore) {
        setGameStatus('white_wins');
      } else {
        setGameStatus('draw');
      }
    } else {
      setCurrentPlayer(WHITE);
    }
  }, [gameStatus, currentPlayer, passCount, captures, board, isThinking]);
  
  const handleResign = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setGameStatus('white_wins'); // Player (black) resigns
  }, [gameStatus]);
  
  // AI move effect
  useEffect(() => {
    if (currentPlayer === WHITE && gameStatus === 'playing') {
      makeAIMove();
    }
  }, [currentPlayer, gameStatus, makeAIMove]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, []);
  
  const handleCellClick = (row, col) => {
    makePlayerMove(row, col);
  };
  
  const getGameStatusText = () => {
    switch (gameStatus) {
      case 'playing':
        if (isThinking) return 'AI is thinking...';
        return currentPlayer === BLACK ? 'Your turn (Black)' : 'AI turn (White)';
      case 'black_wins': return 'You win!';
      case 'white_wins': return 'AI wins!';
      case 'draw': return 'Draw!';
      default: return '';
    }
  };
  
  const territory = calculateTerritory(board);
  const blackScore = captures[BLACK] + territory[BLACK];
  const whiteScore = captures[WHITE] + territory[WHITE];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">หมากล้อม (Go)</h1>
          <p className="text-amber-700">9×9 Board • Single Player vs AI</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <div className="bg-amber-200 p-6 rounded-xl shadow-lg">
              <div className="aspect-square w-full max-w-lg mx-auto">
                <div 
                  className="grid grid-cols-9 gap-0 bg-amber-800 p-2 rounded-lg shadow-inner"
                  style={{ aspectRatio: '1' }}
                >
                  {board.map((row, rowIdx) =>
                    row.map((cell, colIdx) => (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className="relative aspect-square border border-amber-900 bg-amber-200 cursor-pointer hover:bg-amber-300 transition-colors"
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                      >
                        {/* Grid lines */}
                        <div className="absolute inset-0 border border-amber-700 opacity-60" />
                        
                        {/* Star points (handicap points for 9x9) */}
                        {((rowIdx === 2 && colIdx === 2) || 
                          (rowIdx === 2 && colIdx === 6) || 
                          (rowIdx === 6 && colIdx === 2) || 
                          (rowIdx === 6 && colIdx === 6) ||
                          (rowIdx === 4 && colIdx === 4)) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-amber-800 rounded-full opacity-60" />
                          </div>
                        )}
                        
                        {/* Stones */}
                        {cell === BLACK && (
                          <div className="absolute inset-1 bg-gray-900 rounded-full shadow-lg border-2 border-gray-700" />
                        )}
                        {cell === WHITE && (
                          <div className="absolute inset-1 bg-gray-100 rounded-full shadow-lg border-2 border-gray-300" />
                        )}
                        
                        {/* Last move indicator */}
                        {moveHistory.length > 0 && 
                         moveHistory[moveHistory.length - 1].row === rowIdx &&
                         moveHistory[moveHistory.length - 1].col === colIdx && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full opacity-80" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Game Info Panel */}
          <div className="space-y-4">
            {/* Game Status */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Game Status</h3>
              <p className="text-lg font-medium text-amber-800">{getGameStatusText()}</p>
              {isThinking && (
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <Brain className="w-4 h-4 mr-1 animate-pulse" />
                  Processing...
                </div>
              )}
            </div>
            
            {/* Score */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3">Score</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-900 rounded-full mr-2" />
                    <span>You (Black)</span>
                  </div>
                  <span className="font-bold">{blackScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded-full mr-2" />
                    <span>AI (White)</span>
                  </div>
                  <span className="font-bold">{whiteScore}</span>
                </div>
                <hr className="my-2" />
                <div className="text-xs text-gray-600">
                  <div>Captures: Black {captures[BLACK]}, White {captures[WHITE]}</div>
                  <div>Territory: Black {territory[BLACK]}, White {territory[WHITE]}</div>
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3">Controls</h3>
              <div className="space-y-2">
                <button
                  onClick={handlePass}
                  disabled={gameStatus !== 'playing' || currentPlayer !== BLACK || isThinking}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Pass
                </button>
                
                <button
                  onClick={handleResign}
                  disabled={gameStatus !== 'playing'}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Resign
                </button>
                
                <button
                  onClick={resetGame}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Game
                </button>
              </div>
            </div>
            
            {/* AI Difficulty */}
            <div className="bg-white text-gray-700 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3">AI Difficulty</h3>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={gameStatus === 'playing'}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            {/* Recent Moves */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-3">Recent Moves</h3>
              <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                {moveHistory.slice(-5).reverse().map((move, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className={move.player === BLACK ? 'text-gray-900' : 'text-gray-600'}>
                      {colorToString(move.player)}:
                    </span>
                    <span>
                      {move.pass ? 'Pass' : `${String.fromCharCode(65 + move.col)}${move.row + 1}`}
                      {move.captured > 0 && ` (${move.captured})`}
                    </span>
                  </div>
                ))}
                {moveHistory.length === 0 && (
                  <p className="text-gray-500 text-center">No moves yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Rules Info */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-3">Go Rules Summary</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="mb-2"><strong>Objective:</strong> Control more territory than your opponent</p>
              <p className="mb-2"><strong>Territory:</strong> Empty intersections surrounded by your stones</p>
              <p className="mb-2"><strong>Captures:</strong> Surround opponent groups to remove them</p>
            </div>
            <div>
              <p className="mb-2"><strong>Ko Rule:</strong> Cannot immediately recapture to repeat position</p>
              <p className="mb-2"><strong>No Suicide:</strong> Cannot place stones that would capture yourself</p>
              <p className="mb-2"><strong>Game End:</strong> Both players pass consecutively</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoGame;