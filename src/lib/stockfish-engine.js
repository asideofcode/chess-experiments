/**
 * Modern Stockfish chess engine wrapper with proper ES6+ patterns.
 * Provides a clean interface to communicate with Stockfish via Web Workers.
 * 
 * @example
 * ```javascript
 * const engine = new StockfishEngine('/stockfish/stockfish.js');
 * engine.stream = (line) => console.log('Engine output:', line);
 * engine.send('uci'); // Initialize UCI protocol
 * engine.send('position startpos moves e2e4');
 * engine.send('go depth 15', (result) => {
 *   console.log('Best move:', result);
 * });
 * ```
 * 
 * @class StockfishEngine
 */
export class StockfishEngine {
  /**
   * Creates a new Stockfish engine instance.
   * 
   * @param {string} workerPath - Path to the Stockfish Web Worker JavaScript file.
   *                             Can include WASM path after '#' (e.g., 'stockfish.js#stockfish.wasm')
   */
  constructor(workerPath) {
    /** @type {Worker|null} Web Worker instance */
    this.worker = null;
    
    /** @type {Array<Object>} Queue of pending UCI commands */
    this.commandQueue = [];
    
    /** @type {number} Timestamp when engine was created */
    this.started = Date.now();
    
    /** @type {boolean} Whether UCI protocol has been initialized */
    this.loaded = false;
    
    /** @type {boolean} Whether engine is ready to receive commands */
    this.ready = false;
    
    /** @type {Function|null} Callback for streaming engine output */
    this.stream = null;
    
    /** @type {RegExp} Pattern to detect completed evaluation output */
    this.evalRegex = /Total Evaluation[\s\S]+\n$/;
    
    this.initWorker(workerPath);
  }
  
  /**
   * Initializes the Web Worker for Stockfish communication.
   * 
   * @private
   * @param {string} path - Path to the Stockfish worker script
   * @throws {Error} If Web Workers are not supported
   */
  initWorker(path = 'stockfish.js') {
    if (typeof Worker !== 'function') {
      throw new Error('Web Workers not supported in this environment');
    }
    
    this.worker = new Worker(path);
    this.worker.onmessage = this.handleMessage.bind(this);
  }
  
  /**
   * Extracts the first word from a UCI command or response line.
   * 
   * @private
   * @param {string} line - The input line
   * @returns {string} The first word of the line
   */
  getFirstWord(line) {
    const spaceIndex = line.indexOf(' ');
    return spaceIndex === -1 ? line : line.substring(0, spaceIndex);
  }
  
  /**
   * Determines which queued command corresponds to the given engine response.
   * Uses UCI protocol patterns to match responses to their originating commands.
   * 
   * @private
   * @param {string} line - Engine response line
   * @returns {number} Index of the corresponding command in the queue
   */
  determineQueueIndex(line) {
    if (!this.commandQueue.length) return 0;
    
    const firstCommand = this.commandQueue[0];
    if (firstCommand?.cmd === 'bench' || firstCommand?.cmd === 'perft') {
      return 0;
    }
    
    const firstWord = this.getFirstWord(line);
    let cmdType;
    
    if (['uciok', 'option'].includes(firstWord)) {
      cmdType = 'uci';
    } else if (firstWord === 'readyok') {
      cmdType = 'isready';
    } else if (['bestmove', 'info'].includes(firstWord)) {
      cmdType = 'go';
    } else {
      cmdType = 'other';
    }
    
    return this.commandQueue.findIndex(item => {
      const cmdFirstWord = this.getFirstWord(item.cmd);
      return cmdFirstWord === cmdType || 
             (cmdType === 'other' && ['d', 'eval'].includes(cmdFirstWord));
    }) || 0;
  }
  
  /**
   * Handles messages received from the Stockfish Web Worker.
   * Processes engine output, manages command queue, and triggers callbacks.
   * 
   * @private
   * @param {MessageEvent|string} event - Message from the worker
   */
  handleMessage = (event) => {
    const line = typeof event === 'string' ? event : event.data;
    
    // Handle multi-line messages
    if (line.includes('\n')) {
      line.split('\n').forEach(subLine => {
        if (subLine.trim()) this.handleMessage(subLine);
      });
      return;
    }
    
    // Stream output to listeners
    if (this.stream) {
      this.stream(line);
    }
    
    // Skip certain system messages
    if (!this.commandQueue.length || 
        line.startsWith('No such option') || 
        line.startsWith('id ') || 
        line.startsWith('Stockfish')) {
      return;
    }
    
    const queueIndex = this.determineQueueIndex(line);
    const command = this.commandQueue[queueIndex];
    
    if (!command) return;
    
    // Stream to command-specific handler
    if (command.stream) {
      command.stream(line);
    }
    
    // Build message
    command.message = command.message ? `${command.message}\n${line}` : line;
    
    // Check if command is complete
    const isComplete = this.isCommandComplete(line, command);
    
    if (isComplete) {
      this.commandQueue.splice(queueIndex, 1);
      
      if (command.callback && !command.discard) {
        command.callback(command.message);
      }
    }
  }
  
  /**
   * Determines if a UCI command has completed based on the engine response.
   * Different command types have different completion patterns.
   * 
   * @private
   * @param {string} line - Current engine response line
   * @param {Object} command - The command object being processed
   * @returns {boolean} True if the command is complete
   */
  isCommandComplete(line, command) {
    if (line === 'uciok') {
      this.loaded = true;
      return true;
    }
    
    if (line === 'readyok') {
      this.ready = true;
      return true;
    }
    
    if (line.startsWith('bestmove') && command.cmd !== 'bench') {
      command.message = line;
      return true;
    }
    
    if (command.cmd === 'd') {
      return line.startsWith('Legal uci moves') || line.startsWith('Key is');
    }
    
    if (command.cmd === 'eval') {
      return this.evalRegex.test(command.message);
    }
    
    return ['pawn key', 'Nodes/second', 'Unknown command'].some(prefix => 
      line.startsWith(prefix)
    );
  }
  
  /**
   * Sends a UCI command to the Stockfish engine.
   * 
   * @param {string} command - The UCI command to send (e.g., 'uci', 'go depth 15')
   * @param {Function} [callback] - Optional callback for when command completes
   * @param {Function} [stream] - Optional callback for streaming command output
   * 
   * @example
   * ```javascript
   * // Simple command
   * engine.send('uci');
   * 
   * // Command with callback
   * engine.send('go depth 10', (result) => {
   *   console.log('Best move:', result);
   * });
   * 
   * // Command with streaming output
   * engine.send('go infinite', null, (line) => {
   *   if (line.startsWith('info')) {
   *     console.log('Analysis:', line);
   *   }
   * });
   * ```
   */
  send(command, callback, stream) {
    const cmd = String(command).trim();
    
    // Commands that don't need queue tracking
    const immediateCommands = [
      'ucinewgame', 'flip', 'stop', 'ponderhit'
    ];
    
    const needsQueue = !immediateCommands.includes(cmd) && 
                      !cmd.startsWith('position') && 
                      !cmd.startsWith('setoption');
    
    if (needsQueue) {
      this.commandQueue.push({
        cmd,
        callback,
        stream,
        message: ''
      });
    }
    
    this.worker.postMessage(cmd);
  }
  
  /**
   * Terminates the Stockfish engine and cleans up resources.
   * After calling this method, the engine instance cannot be reused.
   * 
   * @example
   * ```javascript
   * engine.quit();
   * // Engine is now terminated and cannot be used
   * ```
   */
  quit() {
    if (this.worker?.terminate) {
      this.worker.terminate();
      this.worker = null;
      this.ready = false;
      this.loaded = false;
    }
  }
}

/**
 * Factory function for creating StockfishEngine instances.
 * Provided for backward compatibility with existing code.
 * 
 * @param {string} path - Path to the Stockfish worker script
 * @param {Object} [options] - Additional options (currently unused)
 * @returns {StockfishEngine} A new StockfishEngine instance
 * 
 * @example
 * ```javascript
 * const engine = loadEngine('/stockfish/stockfish.js');
 * ```
 */
export const loadEngine = (path, options) => new StockfishEngine(path, options);

/**
 * Default export for convenience.
 * @default StockfishEngine
 */
export default StockfishEngine;
