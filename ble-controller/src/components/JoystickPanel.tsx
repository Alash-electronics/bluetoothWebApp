import { useState, useEffect, useRef, useCallback } from 'react';
import { bluetoothService, type ConnectionStatus } from '../services/bluetoothService';
import { appSettings } from '../services/appSettings';
import { localization } from '../services/localization';
import { Capacitor } from '@capacitor/core';
import { BleDeviceListModal } from './BleDeviceListModal';

interface JoystickPanelProps {
  connectionStatus: ConnectionStatus;
  deviceName?: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

interface JoystickPosition {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export const JoystickPanel: React.FC<JoystickPanelProps> = ({
  connectionStatus: initialConnectionStatus,
  deviceName: _deviceName,
  onBack,
  onOpenSettings,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const isConnected = connectionStatus === 'connected';
  const [, forceUpdate] = useState({});
  const [leftJoystickPos, setLeftJoystickPos] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [rightJoystickPos, setRightJoystickPos] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const lastCommandRef = useRef<string>('');
  const lastSendTimeRef = useRef<number>(0);
  const wasMovingRef = useRef<boolean>(false); // Отслеживаем был ли джойстик в движении
  const prevButtonsRef = useRef<boolean[]>(new Array(18).fill(false));
  const prevL2ValueRef = useRef<number>(0);
  const prevR2ValueRef = useRef<number>(0);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [_gamepadName, setGamepadName] = useState<string>('');
  const gamepadIndexRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const leftTouchIdRef = useRef<number | null>(null);
  const rightTouchIdRef = useRef<number | null>(null);
  const [buttons, setButtons] = useState<boolean[]>(new Array(18).fill(false));
  const [l2Value, setL2Value] = useState(0); // 0-100
  const [r2Value, setR2Value] = useState(0); // 0-100
  const [isPortrait, setIsPortrait] = useState(false);

  // Refs для джойстиков (для нативных событий с passive: false)
  const leftJoystickBgRef = useRef<SVGCircleElement>(null);
  const leftJoystickStickRef = useRef<SVGCircleElement>(null);
  const rightJoystickBgRef = useRef<SVGCircleElement>(null);
  const rightJoystickStickRef = useRef<SVGCircleElement>(null);

  // Refs для state (чтобы обработчики всегда читали актуальные значения)
  const isDraggingLeftRef = useRef(isDraggingLeft);
  const isDraggingRightRef = useRef(isDraggingRight);
  const gamepadConnectedRef = useRef(gamepadConnected);
  const isConnectedRef = useRef(isConnected);
  const leftJoystickPosRef = useRef(leftJoystickPos);
  const rightJoystickPosRef = useRef(rightJoystickPos);

  // Обновляем refs при изменении state
  useEffect(() => {
    isDraggingLeftRef.current = isDraggingLeft;
  }, [isDraggingLeft]);

  useEffect(() => {
    isDraggingRightRef.current = isDraggingRight;
  }, [isDraggingRight]);

  useEffect(() => {
    gamepadConnectedRef.current = gamepadConnected;
  }, [gamepadConnected]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    leftJoystickPosRef.current = leftJoystickPos;
  }, [leftJoystickPos]);

  useEffect(() => {
    rightJoystickPosRef.current = rightJoystickPos;
  }, [rightJoystickPos]);

  // Отслеживание ориентации - блокировка вертикального режима
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortraitNow = height > width && height < 1024;
      // console.log('JoystickPanel orientation:', { width, height, isPortraitNow });
      setIsPortrait(isPortraitNow);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    const timer = setTimeout(checkOrientation, 100);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      clearTimeout(timer);
    };
  }, []);

  // Обновляем локальный статус при изменении prop
  useEffect(() => {
    setConnectionStatus(initialConnectionStatus);
  }, [initialConnectionStatus]);

  useEffect(() => {
    const unsubscribe = localization.subscribe(() => forceUpdate({}));

    // Подписываемся на изменения статуса подключения
    bluetoothService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Блокируем скролл только для JoystickPanel
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    const originalTouchAction = document.body.style.touchAction;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;

    // Применяем стили для блокировки скролла
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    document.body.style.overscrollBehavior = 'none';

    // Также для html
    const htmlElement = document.documentElement;
    const originalHtmlOverflow = htmlElement.style.overflow;
    const originalHtmlPosition = htmlElement.style.position;
    const originalHtmlTouchAction = htmlElement.style.touchAction;

    htmlElement.style.overflow = 'hidden';
    htmlElement.style.position = 'fixed';
    htmlElement.style.width = '100%';
    htmlElement.style.height = '100%';
    htmlElement.style.touchAction = 'none';

    // Возвращаем обратно при размонтировании
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.body.style.touchAction = originalTouchAction;
      document.body.style.overscrollBehavior = originalOverscrollBehavior;

      htmlElement.style.overflow = originalHtmlOverflow;
      htmlElement.style.position = originalHtmlPosition;
      htmlElement.style.touchAction = originalHtmlTouchAction;
      htmlElement.style.width = '';
      htmlElement.style.height = '';
    };
  }, []);


  // Gamepad API support
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      setGamepadConnected(true);
      setGamepadName(e.gamepad.id);
      gamepadIndexRef.current = e.gamepad.index;
      appSettings.vibrate([50, 50, 50]); // Тройная вибрация при подключении
    };

    const handleGamepadDisconnected = (_e: GamepadEvent) => {
      setGamepadConnected(false);
      setGamepadName('');
      gamepadIndexRef.current = null;
      // Сбрасываем позиции джойстиков
      setLeftJoystickPos({ x: 0, y: 0 });
      setRightJoystickPos({ x: 0, y: 0 });
      appSettings.vibrate(100);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Проверяем уже подключенные геймпады
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        setGamepadConnected(true);
        setGamepadName(gamepad.id);
        gamepadIndexRef.current = gamepad.index;
        break;
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Gamepad polling loop - читаем данные с физического джойстика
  useEffect(() => {
    if (!gamepadConnected || gamepadIndexRef.current === null) return;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[gamepadIndexRef.current!];

      if (gamepad) {
        // PlayStation контроллер: axes[0]=LX, axes[1]=LY, axes[2]=RX, axes[3]=RY
        // Значения от -1 до 1, где -1 это влево/вверх, +1 это вправо/вниз

        const deadzone = 0.15; // Увеличенная мертвая зона для предотвращения дрейфа

        let lx = gamepad.axes[0] || 0;
        let ly = gamepad.axes[1] || 0;
        let rx = gamepad.axes[2] || 0;
        let ry = gamepad.axes[3] || 0;

        // console.log(`[GAMEPAD] Raw axes: LX=${lx.toFixed(3)}, LY=${ly.toFixed(3)}, RX=${rx.toFixed(3)}, RY=${ry.toFixed(3)}`);

        // Применяем deadzone
        lx = Math.abs(lx) < deadzone ? 0 : lx;
        ly = Math.abs(ly) < deadzone ? 0 : ly;
        rx = Math.abs(rx) < deadzone ? 0 : rx;
        ry = Math.abs(ry) < deadzone ? 0 : ry;

        // console.log(`[GAMEPAD] After deadzone: LX=${lx.toFixed(3)}, LY=${ly.toFixed(3)}, RX=${rx.toFixed(3)}, RY=${ry.toFixed(3)}`);

        // Обновляем позиции виртуальных джойстиков для визуализации
        setLeftJoystickPos({ x: lx, y: ly });
        setRightJoystickPos({ x: rx, y: ry });

        // Читаем все кнопки (PS4 имеет до 18 кнопок)
        const buttonStates: boolean[] = [];
        for (let i = 0; i < 18; i++) {
          buttonStates[i] = gamepad.buttons[i]?.pressed || false;
        }

        // Читаем аналоговые значения триггеров L2 (6) и R2 (7)
        const l2 = Math.round((gamepad.buttons[6]?.value || 0) * 100);
        const r2 = Math.round((gamepad.buttons[7]?.value || 0) * 100);
        setL2Value(l2);
        setR2Value(r2);

        setButtons(buttonStates);
      }

      animationFrameRef.current = requestAnimationFrame(pollGamepad);
    };

    animationFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gamepadConnected]);

  // Отправка данных джойстиков (постоянно) и кнопок (при изменении)
  useEffect(() => {
    if (!isConnected) return;

    // ВАЖНО: Отправляем данные джойстиков ТОЛЬКО если:
    // 1. Хотя бы один джойстик в состоянии dragging ИЛИ
    // 2. Подключен физический геймпад
    // Это предотвращает отправку старых значений после TouchEnd
    // ИСПОЛЬЗУЕМ REFS чтобы читать актуальные значения синхронно
    const isDraggingLeftNow = isDraggingLeftRef.current;
    const isDraggingRightNow = isDraggingRightRef.current;
    const gamepadConnectedNow = gamepadConnectedRef.current;

    // console.log(`[useEffect] Dragging check: Left=${isDraggingLeftNow}, Right=${isDraggingRightNow}, Gamepad=${gamepadConnectedNow}`);

    // НОВАЯ ЛОГИКА: Используем REFS для чтения актуальных позиций синхронно
    const leftPos = leftJoystickPosRef.current;
    const rightPos = rightJoystickPosRef.current;

    const leftInCenter = Math.abs(leftPos.x) < 0.05 && Math.abs(leftPos.y) < 0.05;
    const rightInCenter = Math.abs(rightPos.x) < 0.05 && Math.abs(rightPos.y) < 0.05;
    const bothCentered = leftInCenter && rightInCenter;

    // console.log(`[useEffect] Positions from REF: L(${leftPos.x.toFixed(2)},${leftPos.y.toFixed(2)}) R(${rightPos.x.toFixed(2)},${rightPos.y.toFixed(2)}) centered=${bothCentered} wasMoving=${wasMovingRef.current}`);

    if (!gamepadConnectedNow) {
      // Touch режим: отправляем только при активном перетаскивании
      if (!isDraggingLeftNow && !isDraggingRightNow) {
        // console.log('[useEffect] SKIPPING send - no touch joystick is dragging');
        wasMovingRef.current = false;
        return;
      }
      wasMovingRef.current = true;
    } else {
      // Gamepad режим: проверяем переход из движения в центр
      if (bothCentered) {
        if (wasMovingRef.current) {
          // ПЕРЕХОД: был в движении, теперь в центре → отправить STOP команду ОДИН РАЗ
          // console.log('[useEffect] STOP transition detected - sending J:50,50,50,50 once');
          bluetoothService.sendData('J:50,50,50,50\n');
          lastCommandRef.current = 'J:50,50,50,50';
          lastSendTimeRef.current = Date.now();
          wasMovingRef.current = false;
        } else {
          // console.log('[useEffect] SKIPPING send - gamepad joysticks centered and not moving');
        }
        return;
      }
      wasMovingRef.current = true;
    }

    // console.log('[useEffect] WILL send - joystick movement detected');

    // Левый джойстик: LY (Left Y), LX (Left X)
    // Правый джойстик: RY (Right Y), RX (Right X)

    // Преобразуем из диапазона -1...1 в 0...100
    // Y оси: -1 (вверх) -> 100, 0 (центр) -> 50, +1 (вниз) -> 0
    // X оси: -1 (влево) -> 0, 0 (центр) -> 50, +1 (вправо) -> 100

    // ИСПОЛЬЗУЕМ REFS для синхронного чтения позиций
    const currentLeftPos = leftJoystickPosRef.current;
    const currentRightPos = rightJoystickPosRef.current;

    // Левый джойстик
    const lyValue = Math.round(50 - currentLeftPos.y * 50); // Вверх = 100, вниз = 0
    const lxValue = Math.round(50 + currentLeftPos.x * 50); // Вправо = 100, влево = 0

    // Правый джойстик
    const ryValue = Math.round(50 - currentRightPos.y * 50); // Вверх = 100, вниз = 0
    const rxValue = Math.round(50 + currentRightPos.x * 50); // Вправо = 100, влево = 0

    // Ограничиваем значения в диапазоне 0-100
    const ly = Math.max(0, Math.min(100, lyValue));
    const lx = Math.max(0, Math.min(100, lxValue));
    const ry = Math.max(0, Math.min(100, ryValue));
    const rx = Math.max(0, Math.min(100, rxValue));

    // Формируем команду джойстиков: "J:LY,LX,RY,RX\n"
    const joystickCommand = `J:${ly},${lx},${ry},${rx}`;

    // Throttling для джойстиков: отправляем каждые 50ms (20 раз в секунду)
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTimeRef.current;
    const JOYSTICK_INTERVAL = 50; // 50ms = 20 раз в секунду

    // Отправляем джойстики только если изменились И прошло достаточно времени
    if (joystickCommand !== lastCommandRef.current && timeSinceLastSend >= JOYSTICK_INTERVAL) {
      // console.log(`[JOYSTICK] Sending: ${joystickCommand}, Left: {x:${currentLeftPos.x.toFixed(3)}, y:${currentLeftPos.y.toFixed(3)}}, Right: {x:${currentRightPos.x.toFixed(3)}, y:${currentRightPos.y.toFixed(3)}}`);
      bluetoothService.sendData(joystickCommand + '\n');
      lastCommandRef.current = joystickCommand;
      lastSendTimeRef.current = now;
    } else if (joystickCommand !== lastCommandRef.current) {
      // Обновляем lastCommandRef для отображения
      lastCommandRef.current = joystickCommand;
    }

    // Проверяем изменения кнопок и отправляем только изменившиеся
    // Маппинг кнопок на символы:
    // 0=X→'X', 1=O→'O', 2=□→'S', 3=△→'T', 4=L1→'L', 5=R1→'R',
    // 8=Share→'H', 9=Options→'P', 10=L3→'l', 11=R3→'r',
    // 12=Up→'U', 13=Down→'D', 14=Left→'<', 15=Right→'>', 16=PS→'M', 17=Touchpad→'C'
    const buttonMap = ['X', 'O', 'S', 'T', 'L', 'R', '2', '3', 'H', 'P', 'l', 'r', 'U', 'D', '<', '>', 'M', 'C'];

    for (let i = 0; i < 18; i++) {
      // Пропускаем L2/R2 (индексы 6,7) - обрабатываем отдельно
      if (i === 6 || i === 7) continue;

      // Если кнопка изменила состояние
      if (buttons[i] !== prevButtonsRef.current[i]) {
        if (buttons[i]) {
          // Кнопка нажата - отправляем символ
          bluetoothService.sendData(`B:${buttonMap[i]}\n`);
          appSettings.vibrate(30); // Вибрация при нажатии кнопки
        }
        // При отпускании не отправляем (можно добавить если нужно)
      }
    }

    // L2/R2 триггеры - отправляем только при изменении значения
    if (l2Value !== prevL2ValueRef.current) {
      if (l2Value > 0) {
        bluetoothService.sendData(`B:2:${l2Value}\n`); // L2 с аналоговым значением
        if (prevL2ValueRef.current === 0) {
          appSettings.vibrate(30); // Вибрация только при первом нажатии
        }
      }
      prevL2ValueRef.current = l2Value;
    }

    if (r2Value !== prevR2ValueRef.current) {
      if (r2Value > 0) {
        bluetoothService.sendData(`B:3:${r2Value}\n`); // R2 с аналоговым значением
        if (prevR2ValueRef.current === 0) {
          appSettings.vibrate(30); // Вибрация только при первом нажатии
        }
      }
      prevR2ValueRef.current = r2Value;
    }

    // Сохраняем текущее состояние кнопок
    prevButtonsRef.current = [...buttons];

  }, [leftJoystickPos, rightJoystickPos, buttons, l2Value, r2Value, isConnected]);

  // Нативные touch события для джойстиков с { passive: false }
  useEffect(() => {
    const leftBg = leftJoystickBgRef.current;
    const leftStick = leftJoystickStickRef.current;
    const rightBg = rightJoystickBgRef.current;
    const rightStick = rightJoystickStickRef.current;

    console.log('[JOYSTICK EFFECT] Setting up event listeners, refs:', { leftBg: !!leftBg, leftStick: !!leftStick, rightBg: !!rightBg, rightStick: !!rightStick });

    if (!leftBg || !leftStick || !rightBg || !rightStick) {
      console.error('[JOYSTICK EFFECT] Missing refs!');
      return;
    }

    // Обработчики для левого джойстика
    const leftStartHandler = (e: TouchEvent) => handleJoystickTouchStart(e, true);
    const leftMoveHandler = (e: TouchEvent) => handleJoystickTouchMove(e, true);

    // Обработчики для правого джойстика
    const rightStartHandler = (e: TouchEvent) => handleJoystickTouchStart(e, false);
    const rightMoveHandler = (e: TouchEvent) => handleJoystickTouchMove(e, false);

    // Глобальный обработчик touchend/touchcancel для гарантии отпускания джойстиков
    const globalTouchEnd = (e: TouchEvent) => {
      // console.log('[GLOBAL] TouchEnd event fired, changedTouches:', e.changedTouches.length, 'Left ID:', leftTouchIdRef.current, 'Right ID:', rightTouchIdRef.current);

      // Проверяем какой джойстик отслеживает этот touch ID
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // console.log(`[GLOBAL] Checking touch ${i}: identifier=${touch.identifier}`);

        if (leftTouchIdRef.current === touch.identifier) {
          // console.log('[GLOBAL] Matched LEFT joystick, calling handleJoystickTouchEnd(true)');
          handleJoystickTouchEnd(true);
        }
        if (rightTouchIdRef.current === touch.identifier) {
          // console.log('[GLOBAL] Matched RIGHT joystick, calling handleJoystickTouchEnd(false)');
          handleJoystickTouchEnd(false);
        }
      }
    };

    const options = { passive: false };

    // Левый джойстик - фон
    leftBg.addEventListener('touchstart', leftStartHandler, options);
    leftBg.addEventListener('touchmove', leftMoveHandler, options);

    // Левый джойстик - стик
    leftStick.addEventListener('touchstart', leftStartHandler, options);
    leftStick.addEventListener('touchmove', leftMoveHandler, options);

    // Правый джойстик - фон
    rightBg.addEventListener('touchstart', rightStartHandler, options);
    rightBg.addEventListener('touchmove', rightMoveHandler, options);

    // Правый джойстик - стик
    rightStick.addEventListener('touchstart', rightStartHandler, options);
    rightStick.addEventListener('touchmove', rightMoveHandler, options);

    // Глобальные слушатели для touchend/touchcancel (чтобы джойстик вернулся в центр даже если палец ушел за пределы)
    document.addEventListener('touchend', globalTouchEnd);
    document.addEventListener('touchcancel', globalTouchEnd);

    console.log('[JOYSTICK EFFECT] Event listeners set up successfully');

    return () => {
      // Cleanup - левый джойстик
      leftBg.removeEventListener('touchstart', leftStartHandler);
      leftBg.removeEventListener('touchmove', leftMoveHandler);

      leftStick.removeEventListener('touchstart', leftStartHandler);
      leftStick.removeEventListener('touchmove', leftMoveHandler);

      // Cleanup - правый джойстик
      rightBg.removeEventListener('touchstart', rightStartHandler);
      rightBg.removeEventListener('touchmove', rightMoveHandler);

      rightStick.removeEventListener('touchstart', rightStartHandler);
      rightStick.removeEventListener('touchmove', rightMoveHandler);

      // Cleanup - глобальные слушатели
      document.removeEventListener('touchend', globalTouchEnd);
      document.removeEventListener('touchcancel', globalTouchEnd);
    };
  }, []); // Пустые зависимости - listeners создаются один раз при монтировании

  // Обработчик виртуальных кликов по кнопкам
  const handleButtonClick = (buttonIndex: number) => {
    if (!isConnected || gamepadConnected) return;

    appSettings.vibrate(30); // Усиленная вибрация для мобильных

    // Для L2/R2 (индексы 6 и 7) устанавливаем полное значение
    if (buttonIndex === 6) {
      setL2Value(100);
      setTimeout(() => setL2Value(0), 150);
      return;
    }
    if (buttonIndex === 7) {
      setR2Value(100);
      setTimeout(() => setR2Value(0), 150);
      return;
    }

    // Для остальных кнопок - простое включение/выключение
    const newButtons = [...buttons];
    newButtons[buttonIndex] = true;
    setButtons(newButtons);

    // Через 150мс деактивируем
    setTimeout(() => {
      const resetButtons = [...buttons];
      resetButtons[buttonIndex] = false;
      setButtons(resetButtons);
    }, 150);
  };

  // Обработчик для touch событий (предотвращает клик дважды)
  const handleButtonTouch = (e: React.TouchEvent, buttonIndex: number) => {
    // Убрали preventDefault() чтобы избежать ошибок с passive event listeners
    e.stopPropagation();
    handleButtonClick(buttonIndex);
  };

  // Обработчики для перетаскивания джойстиков на визуальном контроллере
  const handleJoystickTouchStart = useCallback((e: TouchEvent, isLeft: boolean) => {
    console.log(`[TOUCH START] ${isLeft ? 'LEFT' : 'RIGHT'} joystick, touches:`, e.touches.length, 'gamepad:', gamepadConnectedRef.current, 'connected:', isConnectedRef.current);
    if (gamepadConnectedRef.current || !isConnectedRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    // Если этот джойстик уже отслеживается, игнорируем новые касания
    const currentTouchId = isLeft ? leftTouchIdRef.current : rightTouchIdRef.current;
    if (currentTouchId !== null) return;

    // Найти новое касание (не отслеживаемое другим джойстиком)
    let touch: Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      const otherTouchId = isLeft ? rightTouchIdRef.current : leftTouchIdRef.current;
      if (t.identifier !== otherTouchId) {
        touch = t;
        break;
      }
    }

    if (!touch) return;

    // Сохраняем touch ID для этого джойстика
    if (isLeft) {
      leftTouchIdRef.current = touch.identifier;
    } else {
      rightTouchIdRef.current = touch.identifier;
    }

    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const centerX = isLeft ? 340 : 860; // Джойстики еще ближе к центру
    const centerY = 400; // Оба джойстика на одной высоте
    const maxDist = 60; // Радиус перемещения (увеличен)

    const deltaX = svgPt.x - centerX;
    const deltaY = svgPt.y - centerY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let normalizedX = deltaX / maxDist;
    let normalizedY = deltaY / maxDist;

    if (dist > maxDist) {
      normalizedX = (deltaX / dist);
      normalizedY = (deltaY / dist);
    }

    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));

    console.log(`[TOUCH START] Setting position: ${isLeft ? 'LEFT' : 'RIGHT'} x=${normalizedX.toFixed(2)}, y=${normalizedY.toFixed(2)}`);

    if (isLeft) {
      leftJoystickPosRef.current = { x: normalizedX, y: normalizedY };
      setLeftJoystickPos({ x: normalizedX, y: normalizedY });
      isDraggingLeftRef.current = true;
      setIsDraggingLeft(true);
    } else {
      rightJoystickPosRef.current = { x: normalizedX, y: normalizedY };
      setRightJoystickPos({ x: normalizedX, y: normalizedY });
      isDraggingRightRef.current = true;
      setIsDraggingRight(true);
    }
    appSettings.vibrate(10);
  }, []); // Пустые зависимости - функция не пересоздается

  const handleJoystickTouchMove = useCallback((e: TouchEvent, isLeft: boolean) => {
    if (gamepadConnectedRef.current || !isConnectedRef.current) return;
    if ((isLeft && !isDraggingLeftRef.current) || (!isLeft && !isDraggingRightRef.current)) return;

    e.preventDefault();
    e.stopPropagation();

    // Найти касание по сохраненному ID
    const touchId = isLeft ? leftTouchIdRef.current : rightTouchIdRef.current;
    if (touchId === null) return;

    let touch: Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === touchId) {
        touch = e.touches[i];
        break;
      }
    }

    if (!touch) return;

    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const centerX = isLeft ? 340 : 860; // Джойстики еще ближе к центру
    const centerY = 400;
    const maxDist = 60; // Радиус перемещения (увеличен)

    const deltaX = svgPt.x - centerX;
    const deltaY = svgPt.y - centerY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let normalizedX = deltaX / maxDist;
    let normalizedY = deltaY / maxDist;

    if (dist > maxDist) {
      normalizedX = (deltaX / dist);
      normalizedY = (deltaY / dist);
    }

    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));

    if (isLeft) {
      setLeftJoystickPos({ x: normalizedX, y: normalizedY });
    } else {
      setRightJoystickPos({ x: normalizedX, y: normalizedY });
    }
  }, []); // Пустые зависимости - функция не пересоздается

  const handleJoystickTouchEnd = useCallback((isLeft: boolean) => {
    if (gamepadConnectedRef.current) return;

    // console.log(`[JOYSTICK] TouchEnd: ${isLeft ? 'LEFT' : 'RIGHT'}`);

    if (isLeft) {
      // console.log('[JOYSTICK] Resetting left joystick to center');
      // ВАЖНО: Обновляем refs СИНХРОННО перед setState чтобы useEffect увидел новые значения
      isDraggingLeftRef.current = false;
      leftJoystickPosRef.current = { x: 0, y: 0 };
      leftTouchIdRef.current = null; // Очищаем touch ID
      // Теперь обновляем state для UI
      setIsDraggingLeft(false);
      setLeftJoystickPos({ x: 0, y: 0 });
    } else {
      // console.log('[JOYSTICK] Resetting right joystick to center');
      // ВАЖНО: Обновляем refs СИНХРОННО перед setState чтобы useEffect увидел новые значения
      isDraggingRightRef.current = false;
      rightJoystickPosRef.current = { x: 0, y: 0 };
      rightTouchIdRef.current = null; // Очищаем touch ID
      // Теперь обновляем state для UI
      setIsDraggingRight(false);
      setRightJoystickPos({ x: 0, y: 0 });
    }

    // ВАЖНО: Отправляем stop-команду СРАЗУ (обход throttling)
    // Используем фиксированные значения 50 (центр) для отпущенного джойстика
    // Для другого джойстика берем текущие значения
    let ly, lx, ry, rx;

    if (isLeft) {
      // Левый джойстик отпущен - центр (50,50)
      ly = 50;
      lx = 50;
      // Правый джойстик - текущая позиция (читаем из ref)
      ry = Math.max(0, Math.min(100, Math.round(50 - rightJoystickPosRef.current.y * 50)));
      rx = Math.max(0, Math.min(100, Math.round(50 + rightJoystickPosRef.current.x * 50)));
    } else {
      // Левый джойстик - текущая позиция (читаем из ref)
      ly = Math.max(0, Math.min(100, Math.round(50 - leftJoystickPosRef.current.y * 50)));
      lx = Math.max(0, Math.min(100, Math.round(50 + leftJoystickPosRef.current.x * 50)));
      // Правый джойстик отпущен - центр (50,50)
      ry = 50;
      rx = 50;
    }

    const stopCommand = `J:${ly},${lx},${ry},${rx}`;
    // console.log(`[JOYSTICK] Sending STOP command immediately: ${stopCommand}`);

    if (isConnectedRef.current) {
      bluetoothService.sendData(stopCommand + '\n');
      lastCommandRef.current = stopCommand;
      lastSendTimeRef.current = Date.now();
    }

    appSettings.vibrate(15);
  }, []); // Пустые зависимости - функция не пересоздается

  // Mouse обработчики для десктопа
  const handleJoystickMouseDown = (e: React.MouseEvent<SVGCircleElement>, isLeft: boolean) => {
    if (gamepadConnected || !isConnected) return;
    e.preventDefault();

    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    const centerX = isLeft ? 340 : 860;
    const centerY = 400;
    const maxDist = 60;

    const deltaX = svgPt.x - centerX;
    const deltaY = svgPt.y - centerY;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let normalizedX = deltaX / maxDist;
    let normalizedY = deltaY / maxDist;

    if (dist > maxDist) {
      normalizedX = (deltaX / dist);
      normalizedY = (deltaY / dist);
    }

    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));

    if (isLeft) {
      leftJoystickPosRef.current = { x: normalizedX, y: normalizedY };
      setLeftJoystickPos({ x: normalizedX, y: normalizedY });
      isDraggingLeftRef.current = true;
      setIsDraggingLeft(true);
    } else {
      rightJoystickPosRef.current = { x: normalizedX, y: normalizedY };
      setRightJoystickPos({ x: normalizedX, y: normalizedY });
      isDraggingRightRef.current = true;
      setIsDraggingRight(true);
    }
  };

  const handleJoystickMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (gamepadConnected || !isConnected) return;
    if (!isDraggingLeft && !isDraggingRight) return;

    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    if (isDraggingLeft) {
      const centerX = 340;
      const centerY = 400;
      const maxDist = 60;

      const deltaX = svgPt.x - centerX;
      const deltaY = svgPt.y - centerY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let normalizedX = deltaX / maxDist;
      let normalizedY = deltaY / maxDist;

      if (dist > maxDist) {
        normalizedX = (deltaX / dist);
        normalizedY = (deltaY / dist);
      }

      normalizedX = Math.max(-1, Math.min(1, normalizedX));
      normalizedY = Math.max(-1, Math.min(1, normalizedY));

      leftJoystickPosRef.current = { x: normalizedX, y: normalizedY };
      setLeftJoystickPos({ x: normalizedX, y: normalizedY });
    }

    if (isDraggingRight) {
      const centerX = 860;
      const centerY = 400;
      const maxDist = 60;

      const deltaX = svgPt.x - centerX;
      const deltaY = svgPt.y - centerY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let normalizedX = deltaX / maxDist;
      let normalizedY = deltaY / maxDist;

      if (dist > maxDist) {
        normalizedX = (deltaX / dist);
        normalizedY = (deltaY / dist);
      }

      normalizedX = Math.max(-1, Math.min(1, normalizedX));
      normalizedY = Math.max(-1, Math.min(1, normalizedY));

      rightJoystickPosRef.current = { x: normalizedX, y: normalizedY };
      setRightJoystickPos({ x: normalizedX, y: normalizedY });
    }
  };

  const handleJoystickMouseUp = () => {
    if (gamepadConnected) return;

    if (isDraggingLeft) {
      handleJoystickTouchEnd(true);
    }
    if (isDraggingRight) {
      handleJoystickTouchEnd(false);
    }
  };

  const handleBackClick = () => {
    appSettings.vibrate(30);
    onBack();
  };

  const handleSettingsClick = () => {
    appSettings.vibrate(30);
    onOpenSettings();
  };


  const handleBluetoothClick = async () => {
    appSettings.vibrate(30);

    if (isConnected) {
      if (confirm(localization.t('disconnect') + '?')) {
        try {
          await bluetoothService.disconnect();
        } catch (error) {
          appSettings.vibrate([50, 50, 50]);
        }
      }
    } else {
      if (Capacitor.isNativePlatform()) {
        // На iOS/Android показываем кастомный список устройств
        setShowDeviceModal(true);
      } else {
        // В браузере используем системный диалог
        try {
          await bluetoothService.connect();
        } catch (error) {
          appSettings.vibrate([50, 50, 50]);
        }
      }
    }
  };

  if (isPortrait) {
    return (
      <>
      <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center p-4 select-none">
        <div className="text-center">
          <svg className="w-20 h-20 text-purple-400 mx-auto mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z M12 16h.01" />
          </svg>
          <h2 className="text-white text-2xl font-bold mb-3">Поверните устройство</h2>
          <p className="text-gray-400 text-base mb-6">Joystick доступен только в горизонтальном режиме</p>
          <button
            onClick={() => {
              appSettings.vibrate(30);
              onBack();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Вернуться на главную
          </button>
        </div>
      </div>

      {/* Device selection modal */}
      {showDeviceModal && (
        <BleDeviceListModal
          onConnected={() => setShowDeviceModal(false)}
          onCancel={() => setShowDeviceModal(false)}
          onError={(error) => {
            setShowDeviceModal(false);
            console.error('Connection error:', error);
            appSettings.vibrate([50, 50, 50]);
          }}
        />
      )}
      </>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-indigo-600 flex flex-col select-none" style={{ touchAction: 'none', overscrollBehavior: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
      {/* Верхний бар - очень компактный для мобилки */}
      <div className="bg-white/10 backdrop-blur-sm pt-12 px-1 pb-1 sm:px-2 sm:py-1.5 shadow-lg">
        <div className="flex items-center justify-between gap-0.5 sm:gap-1">
          {/* Кнопка назад */}
          <button
            onClick={handleBackClick}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-md flex items-center justify-center transition flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Статус подключения */}
          <div className="flex-1 flex justify-center gap-0.5 sm:gap-1 min-w-0">
            <button
              onClick={handleBluetoothClick}
              className="bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1 sm:gap-1.5 hover:bg-white/30 transition min-w-0"
            >
              <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white/30 rounded-full flex items-center justify-center flex-shrink-0 ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`}>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
                </svg>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${
                  connectionStatus === 'connected'
                    ? 'bg-green-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                }`}></div>
                <span className="text-white text-[9px] sm:text-[10px] truncate">
                  {connectionStatus === 'connected' ? 'OK' : connectionStatus === 'connecting' ? '...' : 'OFF'}
                </span>
              </div>
            </button>

            {/* Индикатор физического геймпада */}
            {gamepadConnected && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-[9px] sm:text-[10px] font-semibold hidden sm:inline">GP</span>
              </div>
            )}
          </div>

          {/* Кнопка GitHub */}
          <button
            onClick={() => {
              appSettings.vibrate(30);
              window.open('https://github.com/Alash-electronics/bluetoothWebApp/tree/main/ble-controller/arduino-examples', '_blank');
            }}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-md flex items-center justify-center transition flex-shrink-0"
            title="Arduino примеры на GitHub"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </button>

          {/* Кнопка настроек */}
          <button
            onClick={handleSettingsClick}
            className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-md flex items-center justify-center transition flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Основной контент - полноэкранный PS4 контроллер */}
      <div className="flex-1 flex flex-col items-center justify-start px-2">
        <div className="relative w-full h-full flex flex-col items-center justify-start">
          {/* Визуальный PS4 контроллер (максимально увеличенный) */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 40 1200 500"
                className="w-full h-full"
                style={{
                  filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))',
                  maxHeight: '100vh',
                  maxWidth: '100vw'
                }}
                preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleJoystickMouseMove}
                onMouseUp={handleJoystickMouseUp}
                onMouseLeave={handleJoystickMouseUp}
              >
                {/* Индикатор команд внутри корпуса контроллера */}
                <rect x="490" y="90" width="220" height="20" rx="10" fill="rgba(0,0,0,0.5)" />
                <text x="600" y="103" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle" opacity="0.9">
                  📡 {lastCommandRef.current || 'Ready'}
                </text>

                {/* Корпус контроллера - расширен по высоте */}
                <path
                  d="M 100 80 L 1100 80 C 1160 80 1180 100 1180 130 L 1180 440 C 1180 470 1160 490 1100 490 L 750 490 C 720 490 690 500 650 515 L 550 515 C 510 500 480 490 450 490 L 100 490 C 40 490 20 470 20 440 L 20 130 C 20 100 40 80 100 80 Z"
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3"
                />

                {/* L2/R2 Triggers (верх) - увеличенные, ближе к центру */}
                <g>
                  {/* L2 - слева */}
                  <rect
                    x="55" y="50" width="185" height="53" rx="12"
                    fill={l2Value > 0 ? '#9333ea' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(6)}
                    onTouchStart={(e) => handleButtonTouch(e, 6)}
                    className="cursor-pointer touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  />
                  <rect x="60" y="56" width={l2Value * 1.75} height="41" rx="10" fill="#9333ea" opacity={l2Value / 100} pointerEvents="none" />
                  <text x="147.5" y="83" fill="white" fontSize="21" fontWeight="bold" textAnchor="middle" pointerEvents="none">L2:{l2Value}</text>

                  {/* R2 - справа (симметрично) */}
                  <rect
                    x="960" y="50" width="185" height="53" rx="12"
                    fill={r2Value > 0 ? '#9333ea' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(7)}
                    onTouchStart={(e) => handleButtonTouch(e, 7)}
                    className="cursor-pointer touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  />
                  <rect x="965" y="56" width={r2Value * 1.75} height="41" rx="10" fill="#9333ea" opacity={r2Value / 100} pointerEvents="none" />
                  <text x="1052.5" y="83" fill="white" fontSize="21" fontWeight="bold" textAnchor="middle" pointerEvents="none">R2:{r2Value}</text>
                </g>

                {/* L1/R1 Bumpers - увеличенные, ближе к центру */}
                <g>
                  {/* L1 - слева */}
                  <rect
                    x="55" y="108" width="185" height="47" rx="10"
                    fill={buttons[4] ? '#a855f7' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(4)}
                    onTouchStart={(e) => handleButtonTouch(e, 4)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="147.5" y="137" fill="white" fontSize="21" fontWeight="bold" textAnchor="middle" pointerEvents="none">L1</text>

                  {/* R1 - справа (симметрично) */}
                  <rect
                    x="960" y="108" width="185" height="47" rx="10"
                    fill={buttons[5] ? '#a855f7' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(5)}
                    onTouchStart={(e) => handleButtonTouch(e, 5)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="1052.5" y="137" fill="white" fontSize="21" fontWeight="bold" textAnchor="middle" pointerEvents="none">R1</text>
                </g>

                {/* D-Pad (слева) - значительно увеличенный */}
                <g transform="translate(60, 220)">
                  {/* Вверх */}
                  <path
                    d="M 10 0 L 97 0 L 97 40 L 53.5 80 L 10 40 Z"
                    fill={buttons[12] ? '#eab308' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(12)}
                    onTouchStart={(e) => handleButtonTouch(e, 12)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="53.5" y="35" fill="white" fontSize="35" fontWeight="bold" textAnchor="middle" pointerEvents="none">↑</text>

                  {/* Вниз */}
                  <path
                    d="M 10 160 L 97 160 L 97 120 L 53.5 80 L 10 120 Z"
                    fill={buttons[13] ? '#eab308' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(13)}
                    onTouchStart={(e) => handleButtonTouch(e, 13)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="53.5" y="140" fill="white" fontSize="35" fontWeight="bold" textAnchor="middle" pointerEvents="none">↓</text>

                  {/* Влево - раздвинут влево и увеличен */}
                  <path
                    d="M -40 40 L -40 120 L 0 120 L 45 80 L 0 40 Z"
                    fill={buttons[14] ? '#eab308' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(14)}
                    onTouchStart={(e) => handleButtonTouch(e, 14)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="-2" y="88" fill="white" fontSize="38" fontWeight="bold" textAnchor="middle" pointerEvents="none">←</text>

                  {/* Вправо - раздвинут вправо и увеличен */}
                  <path
                    d="M 147 40 L 147 120 L 107 120 L 62 80 L 107 40 Z"
                    fill={buttons[15] ? '#eab308' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(15)}
                    onTouchStart={(e) => handleButtonTouch(e, 15)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="109" y="88" fill="white" fontSize="38" fontWeight="bold" textAnchor="middle" pointerEvents="none">→</text>

                  <circle cx="53.5" cy="80" r="15" fill="rgba(0,0,0,0.3)" pointerEvents="none" />
                </g>

                {/* Кнопки действия (справа) - значительно увеличенные */}
                <g transform="translate(1000, 220)">
                  {/* Triangle - вверх */}
                  <circle
                    cx="60" cy="10" r="46"
                    fill={buttons[3] ? '#22c55e' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(3)}
                    onTouchStart={(e) => handleButtonTouch(e, 3)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="60" y="25" fill="white" fontSize="35" fontWeight="bold" textAnchor="middle" pointerEvents="none">△</text>

                  {/* Circle - справа */}
                  <circle
                    cx="130" cy="75" r="46"
                    fill={buttons[1] ? '#ef4444' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(1)}
                    onTouchStart={(e) => handleButtonTouch(e, 1)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="130" y="90" fill="white" fontSize="35" fontWeight="bold" textAnchor="middle" pointerEvents="none">○</text>

                  {/* X - вниз */}
                  <circle
                    cx="60" cy="140" r="46"
                    fill={buttons[0] ? '#3b82f6' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(0)}
                    onTouchStart={(e) => handleButtonTouch(e, 0)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="60" y="155" fill="white" fontSize="35" fontWeight="bold" textAnchor="middle" pointerEvents="none">✕</text>

                  {/* Square - слева */}
                  <circle
                    cx="-10" cy="75" r="46"
                    fill={buttons[2] ? '#ec4899' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(2)}
                    onTouchStart={(e) => handleButtonTouch(e, 2)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="-10" y="90" fill="white" fontSize="35" fontWeight="bold" textAnchor="middle" pointerEvents="none">□</text>
                </g>

                {/* Левый джойстик - увеличенный и еще ближе к центру */}
                <g>
                  {/* Фоновый круг - зона для drag */}
                  <circle
                    ref={leftJoystickBgRef}
                    cx="340" cy="400" r="85"
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    className="touch-manipulation"
                    style={{ touchAction: 'none' }}
                    onMouseDown={(e) => handleJoystickMouseDown(e, true)}
                  />

                  {/* Движущийся стик */}
                  <g transform={`translate(${340 + leftJoystickPos.x * 60}, ${400 + leftJoystickPos.y * 60})`}>
                    <circle
                      ref={leftJoystickStickRef}
                      cx="0" cy="0" r="64"
                      fill="rgba(255,255,255,0.4)"
                      className="cursor-pointer touch-manipulation"
                      style={{ touchAction: 'none' }}
                      onMouseDown={(e) => handleJoystickMouseDown(e, true)}
                    />
                    <circle cx="0" cy="0" r="46" fill="rgba(100,100,255,0.3)" pointerEvents="none" />
                    <text x="0" y="10" fill="white" fontSize="24" fontWeight="bold" textAnchor="middle" pointerEvents="none">L</text>
                  </g>
                </g>

                {/* L3 Button - слева от PS кнопки */}
                <circle
                  cx="520" cy="335" r="24"
                  fill={buttons[10] ? '#6366f1' : 'rgba(255,255,255,0.2)'}
                  onClick={() => handleButtonClick(10)}
                  onTouchStart={(e) => handleButtonTouch(e, 10)}
                  className="cursor-pointer touch-manipulation"
                />
                <text x="520" y="343" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" pointerEvents="none">L3</text>

                {/* Правый джойстик - увеличенный и еще ближе к центру */}
                <g>
                  {/* Фоновый круг - зона для drag */}
                  <circle
                    ref={rightJoystickBgRef}
                    cx="860" cy="400" r="85"
                    fill="rgba(255,255,255,0.05)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="3"
                    className="touch-manipulation"
                    style={{ touchAction: 'none' }}
                    onMouseDown={(e) => handleJoystickMouseDown(e, false)}
                  />

                  {/* Движущийся стик */}
                  <g transform={`translate(${860 + rightJoystickPos.x * 60}, ${400 + rightJoystickPos.y * 60})`}>
                    <circle
                      ref={rightJoystickStickRef}
                      cx="0" cy="0" r="64"
                      fill="rgba(255,255,255,0.4)"
                      className="cursor-pointer touch-manipulation"
                      style={{ touchAction: 'none' }}
                      onMouseDown={(e) => handleJoystickMouseDown(e, false)}
                    />
                    <circle cx="0" cy="0" r="46" fill="rgba(100,100,255,0.3)" pointerEvents="none" />
                    <text x="0" y="10" fill="white" fontSize="24" fontWeight="bold" textAnchor="middle" pointerEvents="none">R</text>
                  </g>
                </g>

                {/* R3 Button - справа от PS кнопки */}
                <circle
                  cx="680" cy="335" r="24"
                  fill={buttons[11] ? '#6366f1' : 'rgba(255,255,255,0.2)'}
                  onClick={() => handleButtonClick(11)}
                  onTouchStart={(e) => handleButtonTouch(e, 11)}
                  className="cursor-pointer touch-manipulation"
                />
                <text x="680" y="343" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" pointerEvents="none">R3</text>

                {/* Touchpad - поднят наверх, увеличен */}
                <rect
                  x="385" y="170" width="430" height="70" rx="15"
                  fill={buttons[17] ? '#06b6d4' : 'rgba(255,255,255,0.15)'}
                  onClick={() => handleButtonClick(17)}
                  onTouchStart={(e) => handleButtonTouch(e, 17)}
                  className="cursor-pointer transition-all touch-manipulation"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
                <text x="600" y="212" fill="white" fontSize="20" opacity="0.7" textAnchor="middle" pointerEvents="none">Touchpad</text>

                {/* Центральные кнопки - увеличенные */}
                <g>
                  {/* Share - слева, возле Touchpad */}
                  <rect
                    x="225" y="175" width="115" height="42" rx="21"
                    fill={buttons[8] ? '#6b7280' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(8)}
                    onTouchStart={(e) => handleButtonTouch(e, 8)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="282.5" y="202" fill="white" fontSize="17" fontWeight="bold" textAnchor="middle" pointerEvents="none">Share</text>

                  {/* PS Button - центр, опущен вниз, увеличен */}
                  <circle
                    cx="600" cy="335" r="34"
                    fill={buttons[16] ? '#2563eb' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(16)}
                    onTouchStart={(e) => handleButtonTouch(e, 16)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="600" y="348" fill="white" fontSize="23" fontWeight="bold" textAnchor="middle" pointerEvents="none">PS</text>

                  {/* Options - справа, возле Touchpad */}
                  <rect
                    x="860" y="175" width="115" height="42" rx="21"
                    fill={buttons[9] ? '#6b7280' : 'rgba(255,255,255,0.2)'}
                    onClick={() => handleButtonClick(9)}
                    onTouchStart={(e) => handleButtonTouch(e, 9)}
                    className="cursor-pointer touch-manipulation"
                  />
                  <text x="917.5" y="202" fill="white" fontSize="17" fontWeight="bold" textAnchor="middle" pointerEvents="none">Options</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Лого внизу слева - скрыт на мобильных */}
      <div className="fixed bottom-2 left-2 hidden sm:block">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="h-12 sm:h-16 opacity-30" />
      </div>
    </div>

    {/* Device selection modal */}
    {showDeviceModal && (
      <BleDeviceListModal
        onConnected={() => setShowDeviceModal(false)}
        onCancel={() => setShowDeviceModal(false)}
        onError={(error) => {
          setShowDeviceModal(false);
          console.error('Connection error:', error);
          appSettings.vibrate([50, 50, 50]);
        }}
      />
    )}
    </>
  );
};
