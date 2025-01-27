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
  ],
  currentPlayer: 0,
  isRunning: false,
  isSetup: true,
  selectedTime: 45,
  timeLeft: 45,
  isNextPlayerBlocked: false,
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
  const [audio] = useState(new Audio("/alarm.mp3"));
  const [isNextPlayerBlocked, setIsNextPlayerBlocked] = useState<boolean>(
    initialState.isNextPlayerBlocked
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            audio.play();
            nextPlayer();
            return selectedTime;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const nextPlayer = () => {
    if (isNextPlayerBlocked) return;

    setIsNextPlayerBlocked(true);
    setCurrentPlayer((prev) => (prev + 1) % players.length);
    setTimeLeft(selectedTime);
    setIsRunning(true);

    setTimeout(() => {
      setIsNextPlayerBlocked(false);
    }, 1000);
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

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  audio.play();
                  setIsSetup(false);
                }}
              >
                Начать игру
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-[calc(100vh-2.5rem)] flex flex-col gap-4 relative">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={() => {
              setCurrentPlayer(initialState.currentPlayer);
              setIsRunning(initialState.isRunning);
              setIsSetup(initialState.isSetup);
              setTimeLeft(initialState.selectedTime);
              setIsNextPlayerBlocked(initialState.isNextPlayerBlocked);
            }}
          >
            ⚙️
          </Button>

          <Button
            variant={isRunning ? "destructive" : "default"}
            className="flex-1 text-4xl"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? "ПАУЗА" : "СТАРТ"}
          </Button>

          <Card
            className={cn(
              "flex-1 text-white",
              timeLeft <= 5
                ? "animate-[pulse-bg_1s_ease-in-out_infinite]"
                : "bg-green-600"
            )}
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
