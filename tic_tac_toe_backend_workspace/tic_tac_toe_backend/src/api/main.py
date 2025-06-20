from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body, Path
from pydantic import BaseModel, Field
from typing import List, Optional

from .tic_tac_toe_engine import (
    create_new_game,
    get_game,
    GameResult,
)

openapi_tags = [
    {
        "name": "TicTacToe",
        "description": "Endpoints for playing Tic Tac Toe game.",
    }
]


app = FastAPI(
    title="Tic Tac Toe Game Backend",
    version="1.0.0",
    description=(
        "REST API for classic Tic Tac Toe game. "
        "Start new games, make moves, fetch board state, check results."
    ),
    openapi_tags=openapi_tags,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------- Pydantic models for API -------------


class CreateGameRequest(BaseModel):
    player_x: str = Field(..., description="Name or ID of player X")
    player_o: Optional[str] = Field(
        None, description="Name or ID of player O (optional)"
    )


class GameIdResponse(BaseModel):
    id: str = Field(..., description="Game ID")


class MoveRequest(BaseModel):
    row: int = Field(..., ge=0, le=2, description="Row for the move (0-2)")
    col: int = Field(..., ge=0, le=2, description="Column for the move (0-2)")


class BoardState(BaseModel):
    id: str
    board: List[List[Optional[str]]]
    current_player: Optional[str]
    winner: Optional[str]
    result: GameResult


# ------------- FastAPI Endpoints -------------


@app.get("/", tags=["Utility"])
def health_check():
    """Check API health status."""
    return {"message": "Healthy"}


# PUBLIC_INTERFACE
@app.post(
    "/games",
    response_model=GameIdResponse,
    tags=["TicTacToe"],
    summary="Start new game",
    description="Creates a new Tic Tac Toe game and returns its ID."
)
def start_new_game(req: CreateGameRequest = Body(...)):
    """Start a new Tic Tac Toe game."""
    game = create_new_game(player_x=req.player_x, player_o=req.player_o)
    return {"id": game.id}


# PUBLIC_INTERFACE
@app.post(
    "/games/{game_id}/move",
    response_model=BoardState,
    tags=["TicTacToe"],
    summary="Submit move",
    description="Submit a move for the current player."
)
def submit_move(
    game_id: str = Path(..., description="ID of the game"),
    move: MoveRequest = Body(...)
):
    """Submit a move for the current player."""
    try:
        game = get_game(game_id)
        game.make_move(move.row, move.col)
        return game.get_state()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# PUBLIC_INTERFACE
@app.get(
    "/games/{game_id}",
    response_model=BoardState,
    tags=["TicTacToe"],
    summary="Get board state",
    description="Get the current state of the board."
)
def get_board_state(game_id: str = Path(..., description="ID of the game")):
    """Return current board state and game result."""
    try:
        game = get_game(game_id)
        return game.get_state()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# PUBLIC_INTERFACE
@app.get(
    "/games/{game_id}/result",
    tags=["TicTacToe"],
    summary="Check game result",
    description="Returns whether the game is ongoing, draw, or win (with winner)."
)
def get_result(game_id: str = Path(..., description="ID of the game")):
    """Return current result: ongoing, draw, or win (with winner)."""
    try:
        game = get_game(game_id)
        return {
            "result": game.result,
            "winner": game.winner,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
