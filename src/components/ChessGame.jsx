import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { useChessGame } from '../hooks/useChessGame.js';
import { useStockfishEngine } from '../hooks/useStockfishEngine.js';
import { isEnginesTurn, getRandomPlayerColor } from '../lib/chess-utils.js';
import GameControls from './GameControls.jsx';
import GameStatus from './GameStatus.jsx';

/**
 * Chess game component with Stockfish AI opponent
 */
const ChessGame = () => {
  // Game configuration
  const [playerColor, setPlayerColor] = useState(() => getRandomPlayerColor());
  const [engineDepth, setEngineDepth] = useState(10);
  
  // Chess game logic
  const {
    chessGame,
    chessPosition,
    moveFrom,
    setMoveFrom,
    optionSquares,
    gameStatus,
    getMoveOptions,
    makeMove,
    resetGame,
    updateGameStatus,
    updatePosition
  } = useChessGame();
  
  // Stockfish engine
  const { engineLoaded, isThinking, makeEngineMove } = useStockfishEngine(engineDepth);

  // Auto-play engine moves
  useEffect(() => {
    if (isEnginesTurn(playerColor, chessGame.turn()) && engineLoaded && !chessGame.isGameOver() && !isThinking) {
      // Delay engine move slightly for better UX
      const timer = setTimeout(() => {
        makeEngineMove(chessGame, updatePosition);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [chessPosition, playerColor, engineLoaded, isThinking, makeEngineMove, chessGame, updatePosition]);

  // Handle square clicks
  const onSquareClick = ({ square, piece }) => {
    // Piece clicked to move - if no moveFrom and there's a piece, try to select it
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) {
        setMoveFrom(square);
      }
      return;
    }

    // Square clicked to move to, check if valid move
    const moves = chessGame.moves({
      square: moveFrom,
      verbose: true
    });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

    // Not a valid move
    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square);
      setMoveFrom(hasMoveOptions ? square : '');
      return;
    }

    // Make the move
    const success = makeMove(moveFrom, square);
    if (success) {
      setMoveFrom('');
    }
  };

  // Handle piece drag start - show possible moves
  const onPieceDrag = ({ sourceSquare }) => {
    const hasMoveOptions = getMoveOptions(sourceSquare);
    if (hasMoveOptions) {
      setMoveFrom(sourceSquare);
    }
  };

  // Handle piece drops (drag and drop)
  const onPieceDrop = ({ sourceSquare, targetSquare }) => {
    const success = makeMove(sourceSquare, targetSquare);
    if (success) {
      setMoveFrom('');
    }
    return success;
  };

  // Handle new game
  const handleNewGame = () => {
    resetGame();
    setPlayerColor(getRandomPlayerColor());
  };

  return (
    <div className="chess-game">
      <GameControls 
        playerColor={playerColor}
        setPlayerColor={setPlayerColor}
        engineDepth={engineDepth}
        setEngineDepth={setEngineDepth}
        onNewGame={handleNewGame}
      />
      
      <div className="chessboard-container">
        <Chessboard 
          options={{
            position: chessPosition,
            onSquareClick: ({ piece, square }) => onSquareClick({ square, piece }),
            onPieceDrag: ({ square }) => onPieceDrag({ sourceSquare: square }),
            onPieceDrop: ({ sourceSquare, targetSquare }) => onPieceDrop({ sourceSquare, targetSquare }),
            squareStyles: optionSquares,
            boardOrientation: playerColor,
            allowDrawingArrows: false
          }}
        />
      </div>
      
      <GameStatus 
        chessGame={chessGame}
        gameStatus={gameStatus}
        isThinking={isThinking}
        engineLoaded={engineLoaded}
      />
    </div>
  );
};

export default ChessGame;
