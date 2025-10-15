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
  const [obstaclePosition, setObstaclePosition] = useState(100);
  const [birdPosition, setBirdPosition] = useState(180);
  const [cookiePosition, setCookiePosition] = useState(150);
  const [playerHeight, setPlayerHeight] = useState(20);
  const [isFlying, setIsFlying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const lastHitRef = useRef(0);

  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, distance: 0 }));
    setGameOver(false);
    setObstaclePosition(100);
    setBirdPosition(180);
    setCookiePosition(150);
    setScore(0);
    setHealth(100);
    setPlayerHeight(20);
    lastHitRef.current = 0;
  };

  const stopGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  };

  const startFlying = () => {
    if (gameState.isPlaying && !gameOver) {
      setIsFlying(true);
    }
  };

  const stopFlying = () => {
    setIsFlying(false);
  };

  useEffect(() => {
    if (gameState.isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        setPlayerHeight(prev => {
          if (isFlying && prev < 70) {
            return prev + 2;
          } else if (!isFlying && prev > 20) {
            return prev - 1.5;
          }
          return prev;
        });

        setObstaclePosition(prev => {
          const newPos = prev - 1.2;
          if (newPos < -10) {
            setScore(s => s + 1);
            return 100 + Math.random() * 50;
          }
          return newPos;
        });

        setBirdPosition(prev => {
          const newPos = prev - 1.3;
          if (newPos < -10) {
            return 100 + Math.random() * 80;
          }
          return newPos;
        });

        setCookiePosition(prev => {
          const newPos = prev - 1.1;
          if (newPos < -10) {
            return 120 + Math.random() * 60;
          }
          return newPos;
        });

        setGameState(prev => ({
          ...prev,
          distance: prev.distance + 0.1
        }));
      }, 30);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameOver, isFlying]);

  useEffect(() => {
    if (gameState.isPlaying && !gameOver) {
      const now = Date.now();
      
      if (obstaclePosition < 25 && obstaclePosition > 5 && playerHeight < 35) {
        if (now - lastHitRef.current > 1000) {
          lastHitRef.current = now;
          setHealth(prev => {
            const newHealth = prev - 20;
            if (newHealth <= 0) {
              setGameOver(true);
              setGameState(prevState => ({
                ...prevState,
                isPlaying: false,
                cookies: prevState.cookies + score,
                experience: prevState.experience + score * 10,
                coins: prevState.coins + score * 5
              }));
              toast({
                title: "Игра окончена! 🍪",
                description: `Набрано очков: ${score}`
              });
            } else {
              toast({
                title: "Ударился об ёлку! 🌳",
                description: `HP: ${newHealth}`,
                variant: "destructive"
              });
            }
            return newHealth;
          });
        }
      }

      if (birdPosition < 25 && birdPosition > 5 && playerHeight > 40) {
        if (now - lastHitRef.current > 1000) {
          lastHitRef.current = now;
          setHealth(prev => {
            const newHealth = prev - 15;
            if (newHealth <= 0) {
              setGameOver(true);
              setGameState(prevState => ({
                ...prevState,
                isPlaying: false,
                cookies: prevState.cookies + score,
                experience: prevState.experience + score * 10,
                coins: prevState.coins + score * 5
              }));
              toast({
                title: "Игра окончена! 🍪",
                description: `Набрано очков: ${score}`
              });
            } else {
              toast({
                title: "Врезался в птицу! 🦅",
                description: `HP: ${newHealth}`,
                variant: "destructive"
              });
            }
            return newHealth;
          });
        }
      }

      if (cookiePosition < 25 && cookiePosition > 5) {
        const heightDiff = Math.abs(playerHeight - 40);
        if (heightDiff < 20) {
          setCookiePosition(120 + Math.random() * 60);
          setGameState(prev => ({
            ...prev,
            cookies: prev.cookies + 1,
            experience: prev.experience + 5,
            coins: prev.coins + 3
          }));
        }
      }
    }
  }, [obstaclePosition, birdPosition, cookiePosition, playerHeight, gameState.isPlaying, gameOver, score]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState.isPlaying && !gameOver) {
        e.preventDefault();
        startFlying();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        stopFlying();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, gameOver]);

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
                <CardTitle className="text-3xl">Летай и собирай печеньки!</CardTitle>
                <CardDescription className="text-white text-lg font-semibold">
                  Зажми ПРОБЕЛ чтобы лететь вверх. Перелетай ёлки и пролетай под птицами!
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-lg font-bold">HP: {health}</span>
                      <span className="text-lg font-bold text-primary">Очки: {score}</span>
                    </div>
                    <Progress 
                      value={health} 
                      className="h-4 border-2 border-primary" 
                    />
                  </div>
                </div>

                <div className="relative h-80 bg-gradient-to-b from-sky-400 to-sky-200 rounded-xl overflow-hidden border-4 border-accent shadow-inner">
                  <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-green-700 to-green-500"></div>
                  
                  <div
                    className="absolute left-16 transition-all duration-75 ease-linear"
                    style={{ bottom: `${playerHeight}%` }}
                  >
                    <img 
                      src="https://cdn.poehali.dev/files/8a72effe-a051-448a-b949-e67378f89373.png" 
                      alt="Shadow Milk Cookie"
                      className="w-16 h-16 object-contain drop-shadow-lg"
                      style={{ 
                        transform: isFlying ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                        transition: 'transform 0.2s ease-out'
                      }}
                    />
                  </div>

                  {gameState.isPlaying && (
                    <>
                      <div
                        className="absolute transition-all duration-75"
                        style={{ left: `${obstaclePosition}%`, bottom: '0' }}
                      >
                        <img 
                          src="https://cdn.poehali.dev/files/32a3f130-4d9b-41f7-84fb-35b08c77d7a4.png"
                          alt="Soul Jam"
                          className="w-16 h-16 object-contain drop-shadow-xl"
                        />
                      </div>
                      <div
                        className="absolute transition-all duration-75"
                        style={{ left: `${birdPosition}%`, top: '15%' }}
                      >
                        <img 
                          src="https://cdn.poehali.dev/files/a5111a36-c8a1-470f-959b-d027d57604c4.png"
                          alt="Pure Vanilla Cookie"
                          className="w-20 h-20 object-contain drop-shadow-xl"
                        />
                      </div>
                      <div
                        className="absolute transition-all duration-75"
                        style={{ left: `${cookiePosition}%`, top: '35%' }}
                      >
                        <img 
                          src="https://cdn.poehali.dev/files/6bf6d106-ce2d-4b81-87e4-a75c9a7507b5.png"
                          alt="Soul Stone"
                          className="w-12 h-12 object-contain drop-shadow-lg animate-bounce-cookie"
                        />
                      </div>
                    </>
                  )}

                  {!gameState.isPlaying && gameOver && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-white p-8 rounded-2xl border-4 border-primary text-center max-w-md">
                        <img 
                          src="https://cdn.poehali.dev/files/a5111a36-c8a1-470f-959b-d027d57604c4.png"
                          alt="Pure Vanilla Cookie"
                          className="w-32 h-32 mx-auto mb-4 object-contain drop-shadow-xl"
                        />
                        <h3 className="text-3xl font-bold text-primary mb-2">ШадоуВанилы победили!</h3>
                        <p className="text-xl mb-4">Набрано очков: <span className="font-bold text-secondary">{score}</span></p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-6 justify-center flex-wrap">
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
                        onMouseDown={startFlying}
                        onMouseUp={stopFlying}
                        onMouseLeave={stopFlying}
                        onTouchStart={startFlying}
                        onTouchEnd={stopFlying}
                        className="bg-gradient-to-r from-accent to-purple-500 text-white px-12 py-6 text-2xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform border-4 border-white active:scale-95"
                      >
                        <Icon name="Plane" className="mr-2" size={32} />
                        ЛЕТЕТЬ
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
                <div className="text-center text-sm text-muted-foreground mt-2">
                  💡 Зажми и держи кнопку ЛЕТЕТЬ или ПРОБЕЛ для полёта вверх
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