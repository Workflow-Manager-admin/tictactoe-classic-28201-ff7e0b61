from enum import Enum
from typing import List, Optional
import uuid


# PUBLIC_INTERFACE
class GameResult(str, Enum):
    ONGOING = "ongoing"
    WIN = "win"
    DRAW = "draw"


# PUBLIC_INTERFACE
class Player(str, Enum):
    X = "X"
    O_PIECE = "O"  # Avoid ambiguous variable name 'O'


# Game state container (in-memory game store for demo purposes)
game_store = {}


# PUBLIC_INTERFACE
class TicTacToeGame:
    """Encapsulates the game logic and state for a single Tic Tac Toe game."""

    def __init__(self, player_x: str, player_o: Optional[str] = None):
        self.id = str(uuid.uuid4())
        self.board: List[List[Optional[str]]] = [
            [None for _ in range(3)] for _ in range(3)
        ]
        self.current_player: str = Player.X
        self.player_x = player_x
        self.player_o = player_o
        self.winner: Optional[str] = None
        self.result = GameResult.ONGOING

    # PUBLIC_INTERFACE
    def make_move(self, row: int, col: int) -> None:
        """Attempt to make a move for the current player at (row, col)."""
        if self.result != GameResult.ONGOING:
            raise ValueError("Game already finished.")
        if self.board[row][col] is not None:
            raise ValueError("Cell already taken.")
        self.board[row][col] = self.current_player
        if self._check_win(self.current_player):
            self.result = GameResult.WIN
            self.winner = self.current_player
        elif self._check_draw():
            self.result = GameResult.DRAW
        else:
            if self.current_player == Player.X:
                self.current_player = Player.O_PIECE
            else:
                self.current_player = Player.X

    # PUBLIC_INTERFACE
    def get_state(self):
        """Returns the current state of the game, including board, turn, and result."""
        return {
            "id": self.id,
            "board": self.board,
            "current_player": self.current_player,
            "winner": self.winner,
            "result": self.result,
        }

    def _check_win(self, player) -> bool:
        b = self.board
        win_lines = (
            b[0], b[1], b[2],
            [b[0][0], b[1][0], b[2][0]],
            [b[0][1], b[1][1], b[2][1]],
            [b[0][2], b[1][2], b[2][2]],
            [b[0][0], b[1][1], b[2][2]],
            [b[0][2], b[1][1], b[2][0]]
        )
        return any(
            all(cell == player for cell in line) for line in win_lines
        )

    def _check_draw(self) -> bool:
        return (
            all(cell is not None for row in self.board for cell in row)
            and self.result != GameResult.WIN
        )


# PUBLIC_INTERFACE
def create_new_game(player_x: str, player_o: Optional[str] = None) -> TicTacToeGame:
    """Creates a new TicTacToe game and adds it to the in-memory store."""
    game = TicTacToeGame(player_x, player_o)
    game_store[game.id] = game
    return game


# PUBLIC_INTERFACE
def get_game(game_id: str) -> TicTacToeGame:
    """Retrieve an existing game by its ID."""
    game = game_store.get(game_id)
    if not game:
        raise ValueError("Game not found")
    return game
