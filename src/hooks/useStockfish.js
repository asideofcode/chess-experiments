import { useState, useEffect, useRef, useCallback } from 'react';
import { StockfishEngine } from '../lib/stockfish-engine.js';

export const useStockfish = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const engineRef = useRef(null);

  const appendOutput = useCallback((text) => {
    setOutput(prev => prev ? prev + '\n' + text : text);
  }, []);

  const initializeEngine = useCallback(() => {
    try {
      const engine = new StockfishEngine("/stockfish/stockfish.js#/stockfish/stockfish.wasm");
      
      engine.stream = (line) => {
        appendOutput(line);
        
        if (line === 'uciok') {
          setIsLoaded(true);
          setIsReady(true); // Engine is ready after uciok
        } else if (line === 'readyok') {
          setIsReady(true);
        }
      };
      
      engineRef.current = engine;
      
      // Initialize UCI
      engine.send('uci');
      
    } catch (err) {
      console.error('Error loading Stockfish:', err);
      setError('Failed to initialize Stockfish engine: ' + err.message);
    }
  }, [appendOutput]);

  const sendCommand = useCallback((command, callback, stream) => {
    if (!engineRef.current) {
      setError('Engine not loaded');
      return;
    }
    
    engineRef.current.send(command, callback, stream);
  }, []);

  const quit = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.quit();
      engineRef.current = null;
      setIsLoaded(false);
      setIsReady(false);
    }
  }, []);

  useEffect(() => {
    initializeEngine();
    
    return () => {
      quit();
    };
  }, [initializeEngine, quit]);

  return {
    isLoaded,
    isReady,
    output,
    error,
    sendCommand,
    quit,
    clearOutput: () => setOutput('')
  };
};
