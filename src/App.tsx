import { useState } from 'react'
import './App.css'
import ModeSelection from './components/ModeSelection'
import Game from './components/Game'
import ConfigMode from './components/ConfigMode'

export type GameMode = 'warmup' | 'arena' | 'config' | null

function App() {
  const [gameMode, setGameMode] = useState<GameMode>(null)

  const handleModeSelect = (mode: 'warmup' | 'arena' | 'config') => {
    setGameMode(mode)
  }

  const handleBackToMenu = () => {
    setGameMode(null)
  }

  return (
    <div className="app">
      {gameMode === null ? (
        <ModeSelection onSelectMode={handleModeSelect} />
      ) : gameMode === 'config' ? (
        <ConfigMode onBackToMenu={handleBackToMenu} />
      ) : (
        <Game mode={gameMode} onBackToMenu={handleBackToMenu} />
      )}
    </div>
  )
}

export default App
