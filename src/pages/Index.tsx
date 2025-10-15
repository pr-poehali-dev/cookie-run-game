import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface GameState {
  cookies: number;
  experience: number;
  level: number;
  coins: number;
  speed: number;
  jumpPower: number;
  magnetPower: number;
  isPlaying: boolean;
  distance: number;
}

interface PowerUp {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  effect: 'speed' | 'jump' | 'magnet';
}

const POWER_UPS: PowerUp[] = [
  { id: '1', name: 'Ускорение', description: 'Увеличивает скорость бега +20%', cost: 500, icon: 'Zap', effect: 'speed' },
  { id: '2', name: 'Супер-прыжок', description: 'Прыгай выше на +30%', cost: 700, icon: 'ArrowUp', effect: 'jump' },
  { id: '3', name: 'Магнит', description: 'Притягивает печеньки +50%', cost: 1000, icon: 'Magnet', effect: 'magnet' }
];

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'game' | 'shop' | 'upgrade'>('game');
  const [gameState, setGameState] = useState<GameState>({
    cookies: 0,
    experience: 0,
    level: 1,
    coins: 1000,
    speed: 100,
    jumpPower: 100,
    magnetPower: 100,
    isPlaying: false,
    distance: 0
  });
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstaclePositionRef = useRef(100);
  const [playerJumping, setPlayerJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, distance: 0 }));
    setGameOver(false);
    obstaclePositionRef.current = 100;
  };

  const stopGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  };

  const jump = () => {
    if (!playerJumping && !gameOver) {
      setPlayerJumping(true);
      setTimeout(() => setPlayerJumping(false), 500);
    }
  };

  useEffect(() => {
    if (gameState.isPlaying) {
      gameLoopRef.current = setInterval(() => {
        obstaclePositionRef.current -= 2;
        
        if (obstaclePositionRef.current < -10) {
          obstaclePositionRef.current = 100;
          setGameState(prev => ({
            ...prev,
            cookies: prev.cookies + Math.floor(1 + prev.magnetPower / 100),
            experience: prev.experience + 10,
            distance: prev.distance + 1,
            coins: prev.coins + 5
          }));
        }

        if (obstaclePositionRef.current < 20 && obstaclePositionRef.current > 0 && !playerJumping) {
          setGameOver(true);
          stopGame();
          toast({
            title: "Игра окончена! 🍪",
            description: `Собрано печенек: ${gameState.cookies + 1}, Пройдено: ${gameState.distance}м`
          });
        }
      }, 50);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, playerJumping, gameState.cookies, gameState.distance, gameState.magnetPower]);

  const buyPowerUp = (powerUp: PowerUp) => {
    if (gameState.coins >= powerUp.cost) {
      setGameState(prev => {
        const updates: Partial<GameState> = { coins: prev.coins - powerUp.cost };
        
        if (powerUp.effect === 'speed') updates.speed = prev.speed + 20;
        if (powerUp.effect === 'jump') updates.jumpPower = prev.jumpPower + 30;
        if (powerUp.effect === 'magnet') updates.magnetPower = prev.magnetPower + 50;

        return { ...prev, ...updates };
      });

      toast({
        title: "Куплено! ✨",
        description: `${powerUp.name} добавлен к вашим способностям`
      });
    } else {
      toast({
        title: "Недостаточно монет",
        description: "Играй больше, чтобы заработать монеты!",
        variant: "destructive"
      });
    }
  };

  const upgradeCharacter = (stat: 'speed' | 'jumpPower' | 'magnetPower', cost: number) => {
    if (gameState.experience >= cost) {
      setGameState(prev => ({
        ...prev,
        experience: prev.experience - cost,
        [stat]: prev[stat] + 10
      }));

      toast({
        title: "Прокачка успешна! 🎉",
        description: "Характеристика улучшена"
      });
    } else {
      toast({
        title: "Недостаточно опыта",
        description: "Играй больше, чтобы получить опыт!",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const newLevel = Math.floor(gameState.experience / 1000) + 1;
    if (newLevel > gameState.level) {
      setGameState(prev => ({ ...prev, level: newLevel }));
      toast({
        title: "Новый уровень! 🎊",
        description: `Теперь ты ${newLevel} уровня!`
      });
    }
  }, [gameState.experience]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState.isPlaying) {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying, playerJumping, gameOver]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8DC] via-[#FFE4B5] to-[#FFD4A3] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-2 drop-shadow-lg">
            COOKIE RUN ADVENTURE
          </h1>
          <p className="text-xl text-accent font-semibold">Беги, прыгай, собирай печеньки! 🍪</p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-primary to-pink-400 text-white border-4 border-white shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{gameState.cookies}</div>
              <div className="text-sm font-semibold">Печенек</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary to-orange-400 text-white border-4 border-white shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{gameState.coins}</div>
              <div className="text-sm font-semibold">Монет</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent to-purple-400 text-white border-4 border-white shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{gameState.experience}</div>
              <div className="text-sm font-semibold">Опыта</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-muted to-teal-400 text-white border-4 border-white shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{gameState.level}</div>
              <div className="text-sm font-semibold">Уровень</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-6 justify-center">
          <Button
            size="lg"
            variant={activeTab === 'game' ? 'default' : 'outline'}
            onClick={() => setActiveTab('game')}
            className="rounded-full px-8 py-6 text-lg font-bold border-4"
          >
            Игра
          </Button>
          <Button
            size="lg"
            variant={activeTab === 'shop' ? 'default' : 'outline'}
            onClick={() => setActiveTab('shop')}
            className="rounded-full px-8 py-6 text-lg font-bold border-4"
          >
            Магазин
          </Button>
          <Button
            size="lg"
            variant={activeTab === 'upgrade' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upgrade')}
            className="rounded-full px-8 py-6 text-lg font-bold border-4"
          >
            Прокачка
          </Button>
        </div>

        {activeTab === 'game' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-4 border-primary shadow-2xl bg-white">
              <CardHeader className="text-center bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
                <CardTitle className="text-3xl">Беги и собирай печеньки!</CardTitle>
                <CardDescription className="text-white text-lg font-semibold">
                  Прыгай через препятствия, нажимая ПРОБЕЛ или кнопку
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative h-64 bg-gradient-to-b from-sky-300 to-green-200 rounded-xl overflow-hidden border-4 border-accent shadow-inner">
                  <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-amber-800 to-amber-600"></div>
                  
                  <div
                    className={`absolute bottom-20 left-16 transition-all duration-300 ${
                      playerJumping ? 'bottom-40' : 'bottom-20'
                    }`}
                  >
                    <div className="text-6xl animate-bounce-cookie">🍪</div>
                  </div>

                  {gameState.isPlaying && (
                    <div
                      className="absolute bottom-20"
                      style={{ left: `${obstaclePositionRef.current}%` }}
                    >
                      <div className="text-5xl">🌳</div>
                    </div>
                  )}

                  {gameState.isPlaying && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-6 py-2 rounded-full border-4 border-primary">
                      <div className="text-2xl font-bold text-primary">
                        Дистанция: {gameState.distance}м
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6 justify-center">
                  {!gameState.isPlaying ? (
                    <Button
                      size="lg"
                      onClick={startGame}
                      className="bg-gradient-to-r from-primary to-pink-500 text-white px-12 py-6 text-2xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform border-4 border-white"
                    >
                      <Icon name="Play" className="mr-2" size={32} />
                      СТАРТ!
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={jump}
                        className="bg-gradient-to-r from-accent to-purple-500 text-white px-12 py-6 text-2xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform border-4 border-white"
                      >
                        <Icon name="ArrowUp" className="mr-2" size={32} />
                        ПРЫЖОК
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={stopGame}
                        className="px-8 py-6 text-xl font-bold rounded-full border-4 border-white"
                      >
                        СТОП
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-4 border-secondary shadow-2xl bg-white">
              <CardHeader className="bg-gradient-to-r from-secondary to-orange-400 text-white rounded-t-lg">
                <CardTitle className="text-3xl text-center">Магазин усилений ✨</CardTitle>
                <CardDescription className="text-white text-center text-lg font-semibold">
                  Покупай усиления за монеты
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {POWER_UPS.map(powerUp => (
                    <Card key={powerUp.id} className="border-4 border-accent hover:scale-105 transition-transform shadow-lg">
                      <CardHeader className="text-center bg-gradient-to-br from-accent/20 to-purple-100">
                        <div className="text-6xl mb-3">
                          <Icon name={powerUp.icon as any} size={64} className="mx-auto text-accent" />
                        </div>
                        <CardTitle className="text-2xl">{powerUp.name}</CardTitle>
                        <CardDescription className="text-base font-semibold">
                          {powerUp.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="text-lg px-4 py-1 bg-secondary">
                            <Icon name="Coins" size={20} className="mr-1" />
                            {powerUp.cost}
                          </Badge>
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-pink-500 text-white font-bold text-lg py-6 rounded-full border-4 border-white"
                          onClick={() => buyPowerUp(powerUp)}
                        >
                          Купить
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'upgrade' && (
          <div className="space-y-4 animate-fade-in">
            <Card className="border-4 border-accent shadow-2xl bg-white">
              <CardHeader className="bg-gradient-to-r from-accent to-purple-500 text-white rounded-t-lg">
                <CardTitle className="text-3xl text-center">Прокачка персонажа 🎮</CardTitle>
                <CardDescription className="text-white text-center text-lg font-semibold">
                  Улучшай характеристики за опыт
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Card className="border-4 border-primary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-primary">Скорость</h3>
                        <p className="text-muted-foreground font-semibold">Текущее значение: {gameState.speed}%</p>
                      </div>
                      <Badge className="text-xl px-4 py-2 bg-accent">
                        <Icon name="Zap" size={24} className="mr-1" />
                        200 XP
                      </Badge>
                    </div>
                    <Progress value={gameState.speed % 100} className="mb-4 h-3" />
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-pink-500 text-white font-bold text-lg py-6 rounded-full border-4 border-white"
                      onClick={() => upgradeCharacter('speed', 200)}
                    >
                      Улучшить скорость
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-4 border-secondary">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-secondary">Сила прыжка</h3>
                        <p className="text-muted-foreground font-semibold">Текущее значение: {gameState.jumpPower}%</p>
                      </div>
                      <Badge className="text-xl px-4 py-2 bg-accent">
                        <Icon name="ArrowUp" size={24} className="mr-1" />
                        300 XP
                      </Badge>
                    </div>
                    <Progress value={gameState.jumpPower % 100} className="mb-4 h-3" />
                    <Button
                      className="w-full bg-gradient-to-r from-secondary to-orange-500 text-white font-bold text-lg py-6 rounded-full border-4 border-white"
                      onClick={() => upgradeCharacter('jumpPower', 300)}
                    >
                      Улучшить прыжок
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-4 border-muted">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-muted">Сила магнита</h3>
                        <p className="text-muted-foreground font-semibold">Текущее значение: {gameState.magnetPower}%</p>
                      </div>
                      <Badge className="text-xl px-4 py-2 bg-accent">
                        <Icon name="Magnet" size={24} className="mr-1" />
                        400 XP
                      </Badge>
                    </div>
                    <Progress value={gameState.magnetPower % 100} className="mb-4 h-3" />
                    <Button
                      className="w-full bg-gradient-to-r from-muted to-teal-500 text-white font-bold text-lg py-6 rounded-full border-4 border-white"
                      onClick={() => upgradeCharacter('magnetPower', 400)}
                    >
                      Улучшить магнит
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
