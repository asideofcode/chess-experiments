import { useState } from 'react'
import StockfishInterface from './components/StockfishInterface'
import ChessGame from './components/ChessGame'
import './App.css'

function App() {
  const [activeComponent, setActiveComponent] = useState('chess')

  return (
    <div className="app">
      <nav className="app-nav">
        <button 
          onClick={() => setActiveComponent('chess')}
          className={activeComponent === 'chess' ? 'active' : ''}
        >
          Chess Game
        </button>
        <button 
          onClick={() => setActiveComponent('interface')}
          className={activeComponent === 'interface' ? 'active' : ''}
        >
          Engine Interface
        </button>
      </nav>
      
      <main className="app-main">
        {activeComponent === 'chess' ? <ChessGame /> : <StockfishInterface />}
      </main>
    </div>
  )
}

export default App
