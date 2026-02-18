import { useState } from 'react'
import './App.css'
import ModeSelection from './components/ModeSelection'
import Game from './components/Game'

export type GameMode = 'warmup' | 'arena' | null

function App() {
  const [gameMode, setGameMode] = useState<GameMode>(null)

  const handleModeSelect = (mode: 'warmup' | 'arena') => {
    setGameMode(mode)
  }

  const handleBackToMenu = () => {
    setGameMode(null)
  }

  return (
    <div className="app">
      {gameMode === null ? (
        <ModeSelection onSelectMode={handleModeSelect} />
      ) : (
        <Game mode={gameMode} onBackToMenu={handleBackToMenu} />
      )}
    </div>
  )
}

export default App
