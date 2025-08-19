/**
 * Game status component showing current turn and game state
 */
const GameStatus = ({ chessGame, gameStatus, isThinking, engineLoaded }) => {
  return (
    <div className="game-controls">
      <div className="turn-indicator">
        {chessGame.turn() === 'w' ? "White's turn" : "Black's turn"}
      </div>
      
      {gameStatus !== 'active' && (
        <div className="game-status">
          <strong>{gameStatus}</strong>
        </div>
      )}
      
      {isThinking && (
        <div className="engine-status">
          🤖 Engine is thinking...
        </div>
      )}
      
      {!engineLoaded && (
        <div className="engine-status">
          ⏳ Loading engine...
        </div>
      )}
    </div>
  );
};

export default GameStatus;
