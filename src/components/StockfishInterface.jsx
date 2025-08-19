import { useState, useRef, useEffect } from 'react';
import { useStockfish } from '../hooks/useStockfish';

const StockfishInterface = () => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  const { isLoaded, isReady, output, error, sendCommand, clearOutput } = useStockfish();

  // Sample commands for quick access
  const sampleCommands = [
    'uci',
    'isready',
    'ucinewgame',
    'position startpos',
    'position startpos moves e2e4 e7e5',
    'd',
    'eval',
    'go depth 10',
    'go depth 15',
    'go movetime 1000',
    'go nodes 100000',
    'stop',
    'setoption name Threads value 1',
    'setoption name MultiPV value 3',
    'setoption name Clear Hash',
  ];

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSendCommand = () => {
    if (!command.trim() || !isLoaded) return;

    const trimmedCommand = command.trim();
    
    // Add to history
    setCommandHistory(prev => {
      const newHistory = [...prev.filter(cmd => cmd !== trimmedCommand), trimmedCommand];
      return newHistory.slice(-50); // Keep last 50 commands
    });
    
    setHistoryIndex(-1);
    
    // Send command
    sendCommand(trimmedCommand);
    
    // Clear input
    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleSampleCommand = (cmd) => {
    setCommand(cmd);
    inputRef.current?.focus();
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isReady) return 'text-green-600';
    if (isLoaded) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (isReady) return 'Ready';
    if (isLoaded) return 'Loaded (initializing...)';
    return 'Loading...';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Stockfish Interface</h1>
          <div className="flex items-center space-x-4">
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <button
              onClick={clearOutput}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear Output
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Output Area */}
          <div className="flex-1 p-4">
            <div className="h-full bg-black rounded-lg p-4 overflow-hidden">
              <textarea
                ref={outputRef}
                value={output}
                readOnly
                className="w-full h-full bg-transparent text-green-400 font-mono text-sm resize-none border-none outline-none"
                placeholder="Stockfish output will appear here..."
              />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter UCI command (e.g., 'uci', 'position startpos', 'go depth 10')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!isLoaded}
              />
              <button
                onClick={handleSendCommand}
                disabled={!isLoaded || !command.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use ↑/↓ arrows to navigate command history • Press Enter to send
            </p>
          </div>
        </div>

        {/* Sidebar with Sample Commands */}
        <div className="w-80 bg-white border-l p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sample Commands</h3>
          <div className="space-y-1">
            {sampleCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => handleSampleCommand(cmd)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors font-mono"
                disabled={!isLoaded}
              >
                {cmd}
              </button>
            ))}
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-2">Quick Start</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>1. Wait for "Ready" status</p>
              <p>2. Send "uci" to initialize</p>
              <p>3. Send "isready" to confirm</p>
              <p>4. Set position with "position startpos"</p>
              <p>5. Analyze with "go depth 10"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockfishInterface;
