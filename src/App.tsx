import { useEffect, useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { cn } from "./lib/utils";

interface Player {
  id: number;
  name: string;
}

interface GameResult {
  winner: string;
  round: number;
  position: number;
  players: string[];
  date: number;
}

interface PlayerStats {
  totalWins: number;
  winsByPosition: { [position: number]: number };
  averageRound: number;
}

interface Statistics {
  games: GameResult[];
  playerStats: { [playerName: string]: PlayerStats };
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const initialState = {
  players: [
    { id: 1, name: "Кирилл" },
    { id: 2, name: "Виквик" },
    { id: 3, name: "Макс" },
    { id: 4, name: "Мирон" },
  ],
  currentPlayer: 0,
  isRunning: false,
  isSetup: true,
  selectedTime: 40,
  timeLeft: 40,
  isNextPlayerBlocked: false,
  round: 1,
};

// Функции для работы со статистикой
const loadStatistics = (): Statistics => {
  const saved = localStorage.getItem("splendor-timer-stats");
  if (saved) {
    return JSON.parse(saved);
  }
  return { games: [], playerStats: {} };
};

const saveStatistics = (stats: Statistics) => {
  localStorage.setItem("splendor-timer-stats", JSON.stringify(stats));
};

const deleteGameFromStats = (gameIndex: number) => {
  const stats = loadStatistics();
  const deletedGame = stats.games[gameIndex];

  // Удаляем игру из списка
  stats.games.splice(gameIndex, 1);

  // Пересчитываем статистику для игрока
  const winner = deletedGame.winner;
  if (stats.playerStats[winner]) {
    const playerStats = stats.playerStats[winner];
    playerStats.totalWins -= 1;

    // Уменьшаем количество побед с этой позиции
    const position = deletedGame.position;
    if (playerStats.winsByPosition[position]) {
      playerStats.winsByPosition[position] -= 1;
      if (playerStats.winsByPosition[position] === 0) {
        delete playerStats.winsByPosition[position];
      }
    }

    // Пересчитываем средний круг или удаляем игрока если побед нет
    if (playerStats.totalWins === 0) {
      delete stats.playerStats[winner];
    } else {
      const playerGames = stats.games.filter((game) => game.winner === winner);
      playerStats.averageRound =
        playerGames.reduce((sum, game) => sum + game.round, 0) /
        playerGames.length;
    }
  }

  saveStatistics(stats);
};

const saveGameResult = (
  winner: string,
  round: number,
  position: number,
  players: string[]
) => {
  const stats = loadStatistics();

  const gameResult: GameResult = {
    winner,
    round,
    position,
    players: [...players],
    date: Date.now(),
  };

  stats.games.push(gameResult);

  // Обновляем статистику игрока
  if (!stats.playerStats[winner]) {
    stats.playerStats[winner] = {
      totalWins: 0,
      winsByPosition: {},
      averageRound: 0,
    };
  }

  const playerStats = stats.playerStats[winner];
  playerStats.totalWins += 1;
  playerStats.winsByPosition[position] =
    (playerStats.winsByPosition[position] || 0) + 1;

  // Пересчитываем средний круг
  const playerGames = stats.games.filter((game) => game.winner === winner);
  playerStats.averageRound =
    playerGames.reduce((sum, game) => sum + game.round, 0) / playerGames.length;

  saveStatistics(stats);
};

function App() {
  const [players, setPlayers] = useState<Player[]>(initialState.players);
  const [currentPlayer, setCurrentPlayer] = useState<number>(
    initialState.currentPlayer
  );
  const [isRunning, setIsRunning] = useState<boolean>(initialState.isRunning);
  const [isSetup, setIsSetup] = useState<boolean>(initialState.isSetup);
  const [selectedTime, setSelectedTime] = useState<number>(
    initialState.selectedTime
  );
  const [timeLeft, setTimeLeft] = useState<number>(initialState.selectedTime);
  const [isNextPlayerBlocked, setIsNextPlayerBlocked] = useState<boolean>(
    initialState.isNextPlayerBlocked
  );
  const [round, setRound] = useState<number>(initialState.round);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showGameEnd, setShowGameEnd] = useState<boolean>(false);
  const [statsVersion, setStatsVersion] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            nextPlayer();
            return selectedTime;
          }

          // Вибрация на мобильных устройствах на последних 5 секундах
          if (prev <= 5 && "vibrate" in navigator) {
            navigator.vibrate(200);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    document.body.style.overflow = isSetup || showStats ? "" : "hidden";
  }, [isSetup, showStats]);

  const nextPlayer = () => {
    if (isNextPlayerBlocked) return;

    setIsNextPlayerBlocked(true);
    const nextPlayerIndex = (currentPlayer + 1) % players.length;
    setCurrentPlayer(nextPlayerIndex);

    // Если дошли до первого игрока, увеличиваем номер круга
    if (nextPlayerIndex === 0) {
      setRound((prev) => prev + 1);
    }

    setTimeLeft(selectedTime);
    setIsRunning(true);

    setTimeout(() => {
      setIsNextPlayerBlocked(false);
    }, 1000);
  };

  const endGame = () => {
    const winner = players[currentPlayer].name;
    const winnerPosition = currentPlayer;
    const playerNames = players.map((p) => p.name);

    saveGameResult(winner, round, winnerPosition, playerNames);
    setShowGameEnd(true);
    setIsRunning(false);
  };

  const resetGame = () => {
    setCurrentPlayer(initialState.currentPlayer);
    setIsRunning(initialState.isRunning);
    setIsSetup(initialState.isSetup);
    setIsNextPlayerBlocked(initialState.isNextPlayerBlocked);
    setRound(initialState.round);
    setTimeLeft(selectedTime);
    setShowGameEnd(false);
  };

  const movePlayer = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= players.length) return;

    const newPlayers = [...players];
    const [removed] = newPlayers.splice(fromIndex, 1);
    newPlayers.splice(toIndex, 0, removed);
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    const newId = Math.max(...players.map((p) => p.id)) + 1;
    setPlayers([
      ...players,
      { id: newId, name: `Игрок ${players.length + 1}` },
    ]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return; // Prevent having less than 2 players
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
  };

  const updatePlayerName = (index: number, newName: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name: newName };
    setPlayers(newPlayers);
  };

  // Определяем класс для моргания в зависимости от оставшегося времени
  const getBlinkClass = () => {
    if (timeLeft <= 5) {
      return "animate-[pulse-fast_0.5s_ease-in-out_infinite]";
    } else if (timeLeft <= 10) {
      return "animate-[pulse-medium_1s_ease-in-out_infinite]";
    }
    return "";
  };

  const getPositionName = (position: number) => {
    return `${position + 1}-я позиция`;
  };

  // Компонент статистики
  const StatsComponent = () => {
    const stats = loadStatistics();
    const sortedPlayers = Object.entries(stats.playerStats).sort(
      ([, a], [, b]) => b.totalWins - a.totalWins
    );

    const handleDeleteGame = (gameIndex: number) => {
      if (confirm("Удалить эту игру из статистики?")) {
        deleteGameFromStats(gameIndex);
        setStatsVersion((prev) => prev + 1); // Принудительно обновляем компонент
      }
    };

    return (
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Статистика игр</CardTitle>
            <Button variant="outline" onClick={() => setShowStats(false)}>
              Назад
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {sortedPlayers.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Пока нет сыгранных игр
              </p>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Общая статистика
                  </h3>
                  <div className="space-y-3">
                    {sortedPlayers.map(([playerName, playerStats]) => (
                      <Card key={playerName}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {playerName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Всего побед: {playerStats.totalWins}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Средний круг победы:{" "}
                                {playerStats.averageRound.toFixed(1)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium mb-1">
                                Победы по позициям:
                              </p>
                              <div className="text-sm text-muted-foreground">
                                {Object.entries(playerStats.winsByPosition)
                                  .sort(([a], [b]) => Number(a) - Number(b))
                                  .map(([position, wins]) => (
                                    <div key={position}>
                                      {getPositionName(Number(position))}:{" "}
                                      {wins}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">История игр</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.games
                      .slice()
                      .reverse()
                      .map((game, index) => (
                        <Card key={index} className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteGame(stats.games.length - 1 - index)
                            }
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                          >
                            ✕
                          </Button>
                          <CardContent className="p-3 pr-10">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">🏆 {game.winner}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getPositionName(game.position)} • Круг{" "}
                                  {game.round}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(game.date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {game.players.join(", ")}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Компонент окончания игры
  const GameEndComponent = () => {
    const winner = players[currentPlayer].name;

    return (
      <div className="container mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">🏆 Игра завершена! 🏆</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">
                {winner}
              </h2>
              <p className="text-lg text-muted-foreground">
                Победил на {round} круге!
              </p>
              <p className="text-sm text-muted-foreground">
                Позиция: {getPositionName(currentPlayer)}
              </p>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={resetGame}>
                Новая игра
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowStats(true)}
              >
                Посмотреть статистику
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (showStats) {
    return (
      <div className="min-h-[100dvh] bg-background p-4">
        <StatsComponent key={statsVersion} />
      </div>
    );
  }

  if (showGameEnd) {
    return (
      <div className="min-h-[100dvh] bg-background p-4">
        <GameEndComponent />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background p-4">
      {isSetup ? (
        <div className="container mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Настройка игры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Порядок игроков</h3>
                  <Button variant="outline" size="sm" onClick={addPlayer}>
                    +
                  </Button>
                </div>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <Card key={index}>
                      <CardContent className="flex items-center justify-between p-2">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => movePlayer(index, "up")}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => movePlayer(index, "down")}
                            disabled={index === players.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) =>
                            updatePlayerName(index, e.target.value)
                          }
                          className="flex-grow mx-4 bg-transparent border-none focus:outline-none"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlayer(index)}
                          disabled={players.length <= 2}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-lg font-medium">Время на ход</label>
                <Select
                  defaultValue={selectedTime.toString()}
                  onValueChange={(value) => {
                    const newTime = Number(value);
                    setSelectedTime(newTime);
                    setTimeLeft(newTime);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите время" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 секунд</SelectItem>
                    <SelectItem value="30">30 секунд</SelectItem>
                    <SelectItem value="35">35 секунд</SelectItem>
                    <SelectItem value="40">40 секунд</SelectItem>
                    <SelectItem value="45">45 секунд</SelectItem>
                    <SelectItem value="60">1 минута</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsSetup(false)}
                >
                  Начать игру
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowStats(true)}
                >
                  📊 Статистика
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-[calc(100vh-2.5rem)] flex flex-col gap-4 relative">
          <div className="absolute top-2 left-2 z-10">
            <Card className="p-2">
              <div className="text-sm font-semibold text-center">
                Круг {round}
              </div>
            </Card>
          </div>

          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={resetGame}>
              ⚙️
            </Button>
            <Button variant="secondary" size="sm" onClick={endGame}>
              🏆
            </Button>
          </div>

          <Button
            variant={isRunning ? "destructive" : "default"}
            className="flex-1 text-4xl"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? "ПАУЗА" : "СТАРТ"}
          </Button>

          <Card
            className={cn("flex-1 text-white bg-green-600", getBlinkClass())}
          >
            <CardContent className="h-full flex items-center justify-center text-center">
              <div className="space-y-4">
                <h2 className="text-4xl">
                  {players[currentPlayer].name}{" "}
                  <span className="text-green-300">#{currentPlayer + 1}</span>
                </h2>
                <p className="text-9xl font-bold">{formatTime(timeLeft)}</p>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="default"
            className="flex-1 text-4xl"
            onClick={nextPlayer}
            disabled={isNextPlayerBlocked}
          >
            ПЕРЕДАТЬ ХОД
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;
