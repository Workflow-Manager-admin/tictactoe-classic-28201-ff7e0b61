import React, { useState } from "react";
import "./App.css";

// Backend API URL
const BACKEND_URL = "https://vscode-internal-450-qa.qa01.cloud.kavia.ai:3001";

// PUBLIC_INTERFACE
function App() {
  // Game state
  const [gameId, setGameId] = useState(null);
  const [playerX, setPlayerX] = useState("");
  const [playerO, setPlayerO] = useState("");
  const [board, setBoard] = useState([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [winner, setWinner] = useState(null);
  const [gameResult, setGameResult] = useState("ongoing"); // "ongoing","win","draw"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (setter) => (e) => setter(e.target.value);

  // PUBLIC_INTERFACE
  // Start New Game
  const startGame = async () => {
    setError("");
    if (!playerX) {
      setError("Player X is required.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_x: playerX,
          player_o: playerO || null,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.id) {
        setError("Failed to start game");
        setLoading(false);
        return;
      }
      setGameId(data.id);
      fetchBoard(data.id);
    } catch (e) {
      setError("Could not connect to backend.");
    }
    setLoading(false);
  };

  // PUBLIC_INTERFACE
  // Fetch Board & Game State
  const fetchBoard = async (id = gameId) => {
    setError("");
    if (!id) return;
    try {
      const resp = await fetch(`${BACKEND_URL}/games/${id}`);
      const boardState = await resp.json();
      if (!resp.ok) throw new Error();
      setBoard(boardState.board || [["", "", ""], ["", "", ""], ["", "", ""]]);
      setCurrentPlayer(boardState.current_player);
      setWinner(boardState.winner);
      setGameResult(boardState.result);
    } catch (e) {
      setError("Error fetching board.");
    }
  };

  // PUBLIC_INTERFACE
  // Make Move
  const makeMove = async (row, col) => {
    if (!gameId || board[row][col] || gameResult !== "ongoing") return;
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/games/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row, col }),
      });
      const boardState = await resp.json();
      if (!resp.ok) {
        setError(boardState.detail ? boardState.detail[0].msg : "Invalid move");
        setLoading(false);
        return;
      }
      setBoard(boardState.board);
      setCurrentPlayer(boardState.current_player);
      setWinner(boardState.winner);
      setGameResult(boardState.result);

      // Optional: Auto-fetch game result if move ends the game
      if (boardState.result === "win" || boardState.result === "draw") {
        fetchResult(gameId);
      }
    } catch (e) {
      setError("Move failed.");
    }
    setLoading(false);
  };

  // PUBLIC_INTERFACE
  // Fetch Game Result
  const fetchResult = async (id = gameId) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/games/${id}/result`);
      const result = await resp.json();
      if (resp.ok && (result.result === "win" || result.result === "draw")) {
        setGameResult(result.result);
        setWinner(result.winner);
      }
    } catch (e) {
      // ignore for display
    }
  };

  // PUBLIC_INTERFACE
  // Restart the game - Option: start a new game with same players
  const restartGame = () => {
    setGameId(null);
    setPlayerX("");
    setPlayerO("");
    setBoard([["", "", ""], ["", "", ""], ["", "", ""]]);
    setCurrentPlayer("");
    setWinner(null);
    setGameResult("ongoing");
    setError("");
    setLoading(false);
  };

  // UI Helpers
  const renderCell = (row, col) => (
    <button
      className={`ttt-cell${board[row][col] ? " filled" : ""}`}
      onClick={() => makeMove(row, col)}
      disabled={!!board[row][col] || gameResult !== "ongoing" || loading}
      key={`${row}-${col}`}
      aria-label={`Cell ${row + 1}, ${col + 1}`}
    >
      {board[row][col]}
    </button>
  );

  // Win/draw message
  const statusMessage = () => {
    if (error) return <div className="status error">{error}</div>;
    if (!gameId) return null;
    if (gameResult === "win")
      return (
        <div className="status win">
          {winner ? `Winner: ${winner}` : "We have a winner!"}
        </div>
      );
    if (gameResult === "draw")
      return <div className="status draw">Draw! No winner.</div>;
    return (
      <div className="status turn">
        Turn: <span className="turn-player">{currentPlayer}</span>
      </div>
    );
  };

  return (
    <div className="app" style={{ background: "var(--background, #fff)", color: "var(--secondary, #333)" }}>
      <nav className="navbar" style={{ background: "#fff", color: "#222", borderBottom: "1px solid #e7e7e7" }}>
        <div className="container" style={{ maxWidth: 460 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo" style={{ color: "#1976d2" }}>
              <span className="logo-symbol" style={{ color: "#ff5722" }}>✗⭕</span>
              Tic Tac Toe
            </div>
            <button className="btn btn-outline" style={{ color: "#1976d2", background: "#fff", border: "1px solid #1976d2" }} onClick={restartGame}>
              Restart
            </button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container ttt-main">
          <div className="hero" style={{ paddingTop: 80, paddingBottom: 0, alignItems: "center" }}>
            {!gameId ? (
              <div className="ttt-startbox">
                <h1 className="ttt-title">Tic Tac Toe</h1>
                <div className="ttt-fields">
                  <input
                    type="text"
                    className="ttt-input"
                    placeholder="Player X (required)"
                    value={playerX}
                    onChange={handleChange(setPlayerX)}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="ttt-input"
                    placeholder="Player O (optional)"
                    value={playerO}
                    onChange={handleChange(setPlayerO)}
                  />
                </div>
                <button className="btn btn-large ttt-start-btn" style={{ background: "#ff5722" }} onClick={startGame} disabled={loading}>
                  {loading ? "Starting..." : "Start Game"}
                </button>
                {error && <div className="status error">{error}</div>}
              </div>
            ) : (
              <>
                <div className="ttt-boardbox">
                  <div className="ttt-board">
                    {board.map((rowArr, row) => (
                      <div className="ttt-row" key={row}>
                        {rowArr.map((_, col) => renderCell(row, col))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ttt-controls">
                  {statusMessage()}
                  <button className="btn ttt-restart-btn" style={{ background: "#1976d2", marginTop: 16, color: "#fff" }} onClick={restartGame}>
                    Restart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
