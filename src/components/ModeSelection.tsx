interface ModeSelectionProps {
  onSelectMode: (mode: 'warmup' | 'arena' | 'config') => void
}

function ModeSelection({ onSelectMode }: ModeSelectionProps) {
  return (
    <div className="mode-selection">
      <h1>3D Snake Game</h1>
      <p>Choose your game mode to start playing</p>
      <div className="mode-buttons">
        <button
          className="mode-button"
          onClick={() => onSelectMode('warmup')}
        >
          Warm-up
        </button>
        <button
          className="mode-button"
          onClick={() => onSelectMode('arena')}
        >
          Arena
        </button>
        <button
          className="mode-button config"
          onClick={() => onSelectMode('config')}
        >
          Config
        </button>
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <p><strong>Warm-up:</strong> Practice mode - snake moves only when you press keys</p>
        <p><strong>Arena:</strong> Classic mode - snake moves continuously forward</p>
        <p><strong>Config:</strong> Visualize and configure scene lighting and camera</p>
      </div>
    </div>
  )
}

export default ModeSelection
