import { useState, useRef, useEffect, useCallback } from 'react';
import { StockfishEngine } from '../lib/stockfish-engine.js';

/**
 * Custom hook for managing Stockfish engine integration
 */
export const useStockfishEngine = (engineDepth = 10) => {
  const engineRef = useRef(null);
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Initialize Stockfish engine
  useEffect(() => {
    const engine = new StockfishEngine("/stockfish/stockfish.js#/stockfish/stockfish.wasm");
    
    engine.stream = (line) => {
      console.log('Engine:', line);
      if (line === 'uciok') {
        setEngineLoaded(true);
        engine.send('isready');
      }
    };
    
    engineRef.current = engine;
    engine.send('uci');
    
    return () => {
      engine.quit();
    };
  }, []);

  // Make engine move
  const makeEngineMove = useCallback((chessGame, onMoveComplete) => {
    if (!engineRef.current || !engineLoaded || chessGame.isGameOver()) {
      return;
    }

    setIsThinking(true);
    
    // Set position
    const fen = chessGame.fen();
    engineRef.current.send(`position fen ${fen}`);
    
    // Get best move
    engineRef.current.send(`go depth ${engineDepth}`, (result) => {
      setIsThinking(false);
      
      // Parse bestmove from result
      const match = result.match(/bestmove (\w+)/);
      if (match) {
        const moveStr = match[1];
        
        try {
          // Convert UCI notation to chess.js move
          const from = moveStr.substring(0, 2);
          const to = moveStr.substring(2, 4);
          const promotion = moveStr.length > 4 ? moveStr.substring(4) : undefined;
          
          const move = chessGame.move({
            from,
            to,
            promotion
          });
          
          if (move && onMoveComplete) {
            onMoveComplete();
          }
        } catch (error) {
          console.error('Invalid engine move:', moveStr, error);
        }
      }
    });
  }, [engineLoaded, engineDepth]);

  return {
    engineLoaded,
    isThinking,
    makeEngineMove
  };
};
