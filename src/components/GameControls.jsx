/**
 * Game controls component for chess game
 */
const GameControls = ({ 
  playerColor, 
  setPlayerColor, 
  engineDepth, 
  setEngineDepth, 
  onNewGame
}) => {
  return (
    <div className="game-info">
      <div className="player-info">
        <strong>You are playing as: {playerColor}</strong>
      </div>
      
      <div className="engine-controls">
        <label>
          Engine Depth: 
          <input 
            type="number" 
            min="1" 
            max="20" 
            value={engineDepth} 
            onChange={(e) => setEngineDepth(parseInt(e.target.value))}
            style={{marginLeft: '10px', width: '60px'}}
          />
        </label>
      </div>
      
      <button onClick={onNewGame} className="reset-btn">
        New Game
      </button>
    </div>
  );
};

export default GameControls;
