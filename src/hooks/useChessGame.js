import { useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';

/**
 * Custom hook for managing chess game state and logic
 */
export const useChessGame = () => {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [gameStatus, setGameStatus] = useState('active');

  // Check game status
  const updateGameStatus = useCallback(() => {
    if (chessGame.isCheckmate()) {
      setGameStatus(chessGame.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!');
    } else if (chessGame.isDraw()) {
      setGameStatus('Draw!');
    } else if (chessGame.isCheck()) {
      setGameStatus(chessGame.turn() === 'w' ? 'White in check' : 'Black in check');
    } else {
      setGameStatus('active');
    }
  }, [chessGame]);

  // Get move options for a square
  const getMoveOptions = useCallback((square) => {
    console.log('🔍 Getting moves for square:', square);
    const moves = chessGame.moves({
      square,
      verbose: true
    });
    console.log('Available moves:', moves);

    if (moves.length === 0) {
      console.log('❌ No moves available for', square);
      setOptionSquares({});
      return false;
    }

    const newSquares = {};
    
    for (const move of moves) {
      newSquares[move.to] = {
        background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color 
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%'
      };
    }

    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };

    console.log('✅ Setting option squares:', newSquares);
    setOptionSquares(newSquares);
    return true;
  }, [chessGame]);

  // Make a move
  const makeMove = useCallback((from, to, promotion = 'q') => {
    try {
      const move = chessGame.move({
        from,
        to,
        promotion
      });
      
      if (move) {
        setChessPosition(chessGame.fen());
        updateGameStatus();
        setMoveFrom('');
        setOptionSquares({});
        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
    return false;
  }, [chessGame, updateGameStatus]);

  // Update position (for when external code modifies chessGame directly)
  const updatePosition = useCallback(() => {
    setChessPosition(chessGame.fen());
    updateGameStatus();
  }, [chessGame, updateGameStatus]);

  // Reset game
  const resetGame = useCallback(() => {
    chessGame.reset();
    setChessPosition(chessGame.fen());
    setMoveFrom('');
    setOptionSquares({});
    setGameStatus('active');
    updateGameStatus();
  }, [chessGame, updateGameStatus]);

  return {
    chessGame,
    chessPosition,
    moveFrom,
    setMoveFrom,
    optionSquares,
    setOptionSquares,
    gameStatus,
    getMoveOptions,
    makeMove,
    resetGame,
    updateGameStatus,
    updatePosition
  };
};
