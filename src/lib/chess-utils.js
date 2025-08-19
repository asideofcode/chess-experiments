/**
 * Utility functions for chess game logic
 */

/**
 * Determines if it's the engine's turn based on player color and current turn
 * @param {string} playerColor - 'white' or 'black'
 * @param {string} currentTurn - 'w' or 'b' from chess.js
 * @returns {boolean}
 */
export const isEnginesTurn = (playerColor, currentTurn) => {
  return (playerColor === 'white' && currentTurn === 'b') || 
         (playerColor === 'black' && currentTurn === 'w');
};

/**
 * Generates a random player color
 * @returns {string} 'white' or 'black'
 */
export const getRandomPlayerColor = () => {
  return Math.random() > 0.5 ? 'white' : 'black';
};
