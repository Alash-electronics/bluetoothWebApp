/*
 * Проект 14: Мастер-режим - полнофункциональный робот Фобо
 * Управление: ALASH Electronics (Android) ИЛИ ИК-пульт
 *
 * Возможности:
 * - Векторное управление (8 направлений: вверх/вниз/влево/вправо + диагонали)
 * - Bluetooth джойстик (плавное управление) или ИК-пульт (4 направления)
 * - 3 автономных режима (линия, препятствия, следование)
 * - Переключение режимов кнопками 1, 2, 3 (Bluetooth или IR)
 * - Экстренный останов кнопкой Y (Bluetooth) или OK (IR)
 * - Телеметрия на экран телефона
 * - Передача данных датчиков (ультразвук + линия) в приложение каждые 100мс
 * - Мгновенная остановка (Bluetooth) или auto-stop 200мс (IR)
 *
 * Формат данных датчиков (отправляется через Bluetooth):
 * - S1:<distance> - Ультразвуковой датчик (расстояние в см, 0-400)
 * - S2:<value> - Датчик линии слева (аналоговое значение 0-1023)
 * - S3:<value> - Датчик линии центр (аналоговое значение 0-1023)
 * - S4:<value> - Датчик линии справа (аналоговое значение 0-1023)
 *
 * Подключение (оптимизировано для избежания конфликта таймеров):
 * - HM-10 Bluetooth: RX=D10, TX=D11
 * - IR приёмник VS1838B: A3
 * - Моторы L298N:
 *   Motor B (левый): IN3=D12, IN4=D8, ENB=D6 (PWM на Timer0)
 *   Motor A (правый): IN1=D4, IN2=D2, ENA=D5 (PWM на Timer0)
 * - Servo: D9 (использует Timer1 - нет конфликта с PWM моторов)
 * - RCWL-9610A: Trig=D3, Echo=D7
 * - Датчики линии: Left=A0, Center=A1, Right=A2
 *
 * ВАЖНО: Данная конфигурация пинов исключает конфликты между таймерами Arduino.
 * PWM для моторов (D5, D6) работает на Timer0, Servo (D9) работает на Timer1.
 */

#include <SoftwareSerial.h>
#include <Servo.h>
#include <AlashUltrasonic.h>
#include <AlashMotorControlLite.h>
#include <AlashIRControlRX.h>

// ==================== НАСТРОЙКИ BLUETOOTH ====================
const uint8_t BT_RX = 10;
const uint8_t BT_TX = 11;
SoftwareSerial bluetooth(BT_RX, BT_TX);

// ==================== НАСТРОЙКИ ИК-ПУЛЬТА ====================
const uint8_t IR_PIN = A3;
AlashIRControlRX irReceiver(IR_PIN);

// Коды кнопок пульта (ВАЖНО: Проверьте свои коды в Проекте 10!)
const unsigned long BTN_UP = 0xFF18E7;      // ▲ Вперёд
const unsigned long BTN_DOWN = 0xFF4AB5;    // ▼ Назад
const unsigned long BTN_LEFT = 0xFF10EF;    // ◄ Налево
const unsigned long BTN_RIGHT = 0xFF5AA5;   // ► Направо
const unsigned long BTN_OK = 0xFF38C7;      // OK - Экстренный останов
const unsigned long BTN_1 = 0xFFA25D;       // 1 - Режим линии
const unsigned long BTN_2 = 0xFF629D;       // 2 - Режим препятствий
const unsigned long BTN_3 = 0xFFE21D;       // 3 - Режим следования
const unsigned long BTN_REPEAT = 0xFFFFFFFF; // Код повтора (игнорировать)

unsigned long lastIRSignalTime = 0;  // Время последнего IR сигнала (для auto-stop)
const int IR_TIMEOUT = 200;  // Таймаут для IR (мс) - робот останавливается если сигнал не приходит

// ==================== ПАРАМЕТРЫ ПЕРЕДАЧИ ДАННЫХ ДАТЧИКОВ ====================
unsigned long lastSensorSend = 0;
const int SENSOR_SEND_INTERVAL = 200;  // Отправка данных датчиков каждые 200мс (уменьшена нагрузка)

// ==================== НАСТРОЙКИ МОТОРОВ ====================
// Левый мотор (Motor B: D6, D8, D12)
const uint8_t MOTOR_L_IN3 = 8;
const uint8_t MOTOR_L_IN4 = 12;
const uint8_t MOTOR_L_ENB = 6;
// Правый мотор (Motor A: D2, D4, D5)
const uint8_t MOTOR_R_IN1 = 4;
const uint8_t MOTOR_R_IN2 = 2;
const uint8_t MOTOR_R_ENA = 5;

AlashMotorControlLite motorLeft(DIR_DIR_PWM, MOTOR_L_IN3, MOTOR_L_IN4, MOTOR_L_ENB);
AlashMotorControlLite motorRight(DIR_DIR_PWM, MOTOR_R_IN1, MOTOR_R_IN2, MOTOR_R_ENA);

// Константы скорости для ручного управления
const int SPEED_NORMAL = 100;
const int SPEED_SLOW = 60;
const int SPEED_TURN = 65;          // Скорость поворота на месте (оптимально для резких поворотов)

// Константы скорости для АГРЕССИВНОГО следования по линии (Проект 9)
// ВАЖНО: Эти значения оптимизированы для резких поворотов с реверсом!
const int FORWARD_SPEED = 70;    // Скорость прямо (умеренная для стабильности)
const int TURN_SPEED = 80;       // Скорость внешнего колеса при повороте
const int REVERSE_SPEED = -60;   // РЕВЕРС внутреннего колеса (минус = назад!)

// ==================== НАСТРОЙКИ ДАТЧИКОВ ====================
// Ультразвуковой датчик
const uint8_t TRIG_PIN = 3;
const uint8_t ECHO_PIN = 7;
AlashUltrasonic ultrasonic(TRIG_PIN, ECHO_PIN);

// Сервопривод для сканирования
const uint8_t SERVO_PIN = 9;
const int SERVO_CENTER = 100;  // Калибровка центра серво (90 = стандарт, настройте под ваш серво)
Servo scanServo;

// Датчики линии (аналоговые)
const uint8_t LINE_LEFT = A0;
const uint8_t LINE_CENTER = A1;
const uint8_t LINE_RIGHT = A2;

// КАЛИБРОВКА ДАТЧИКОВ ЛИНИИ (инвертированные датчики!)
const int LEFT_WHITE = 28, LEFT_BLACK = 38;
const int CENTER_WHITE = 29, CENTER_BLACK = 41;
const int RIGHT_WHITE = 26, RIGHT_BLACK = 36;

// Индивидуальные пороги для каждого датчика
const int LEFT_THRESHOLD = (LEFT_WHITE + LEFT_BLACK) / 2;      // 33
const int CENTER_THRESHOLD = (CENTER_WHITE + CENTER_BLACK) / 2; // 35
const int RIGHT_THRESHOLD = (RIGHT_WHITE + RIGHT_BLACK) / 2;    // 31

// Определяем, инвертированные ли датчики (высокие значения = черное)
const bool INVERTED = (LEFT_BLACK > LEFT_WHITE);  // true для этих датчиков

// ==================== РЕЖИМЫ РАБОТЫ ====================
enum Mode {
  MODE_MANUAL,              // 0: Ручное управление джойстиком
  MODE_LINE_FOLLOWING,      // 1: Следование по линии
  MODE_OBSTACLE_AVOIDANCE,  // 2: Объезд препятствий
  MODE_HAND_FOLLOWING       // 3: Следование за рукой
};

Mode currentMode = MODE_MANUAL;

// ==================== ПАРАМЕТРЫ ДЛЯ АВТОНОМНЫХ РЕЖИМОВ ====================
// Следование за рукой
const int DISTANCE_TOO_CLOSE = 10;
const int DISTANCE_PERFECT = 20;
const int DISTANCE_TOO_FAR = 40;

// Объезд препятствий
const int OBSTACLE_DISTANCE = 30;  // Порог обнаружения препятствия (см)

// ==================== КОНСТАНТЫ ЗАДЕРЖЕК ====================
// Задержки для управления питанием моторов и серво
const int MOTOR_STOP_DELAY = 50;        // Задержка после остановки моторов (мс)
const int MOTOR_PIN_SWITCH_DELAY = 50;  // Задержка при переключении режима пинов (мс)
const int SERVO_ATTACH_DELAY = 20;      // Задержка после attach серво (мс)
const int SERVO_STABILIZE_DELAY = 300;  // Задержка стабилизации серво после поворота (мс)
const int SERVO_DETACH_DELAY = 20;      // Задержка после detach серво (мс)
const int INIT_SERVO_WAIT = 500;        // Задержка инициализации серво в автономных режимах (мс)
const int SETUP_INIT_DELAY = 500;       // Задержка в конце setup() (мс)

// ==================== ПАРАМЕТРЫ РУЧНОГО УПРАВЛЕНИЯ ====================
// Safety timeout отключен - робот останавливается ТОЛЬКО при команде отпускания
// unsigned long lastManualCommand = 0;
// const int MANUAL_TIMEOUT = 5000;
// bool isMoving = false;

// ==================== SETUP ====================
void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);
  irReceiver.begin();

  ultrasonic.begin();

  // Настройка пинов моторов как OUTPUT


  pinMode(LINE_LEFT, INPUT);
  pinMode(LINE_CENTER, INPUT);
  pinMode(LINE_RIGHT, INPUT);

  Serial.println(F("PHOBO v2.0 - BT+IR"));
  Serial.println(F("Ready!"));

  bluetooth.println(F("Phobo Ready!"));
  bluetooth.println(F("BT or IR control"));

  stopMotors();
  delay(SETUP_INIT_DELAY);
}

// ==================== MAIN LOOP ====================
void loop() {
  // === ЧИТАЕМ ВСЕ КОМАНДЫ ИЗ БУФЕРА BLUETOOTH ===
  // Важно: читаем все доступные команды за один цикл, чтобы буфер не переполнялся
  while (bluetooth.available()) {
    char cmd = bluetooth.read();
    processCommand(cmd);
  }

  // === ПРОВЕРЯЕМ КОМАНДЫ ОТ ИК-ПУЛЬТА ===
  // Параметр true разрешает обработку кодов повтора (удержание кнопки)
  if (irReceiver.check(true)) {
    unsigned long irCode = irReceiver.data;
    processIRCommand(irCode);
  }

  // === TIMEOUT ДЛЯ IR УПРАВЛЕНИЯ ===
  // Автоматически останавливаем робот, если IR сигнал не приходит более IR_TIMEOUT мс
  // (Bluetooth не нуждается в timeout, т.к. отправляет команды отпускания)
  if (currentMode == MODE_MANUAL && lastIRSignalTime > 0) {
    if (millis() - lastIRSignalTime > IR_TIMEOUT) {
      stopMotors();
      lastIRSignalTime = 0;  // Сбрасываем таймер
    }
  }

  // === ВЫПОЛНЯЕМ ДЕЙСТВИЯ В ЗАВИСИМОСТИ ОТ РЕЖИМА ===
  switch (currentMode) {
    case MODE_MANUAL:
      // В ручном режиме робот управляется только джойстиком
      // Команды уже обработаны в processCommand()
      break;

    case MODE_LINE_FOLLOWING:
      followLine();
      break;

    case MODE_OBSTACLE_AVOIDANCE:
      avoidObstacles();
      break;

    case MODE_HAND_FOLLOWING:
      followHand();
      break;
  }

  // === ОТПРАВКА ДАННЫХ ДАТЧИКОВ ===
  sendSensorData();
}

// ==================== ОБРАБОТКА КОМАНД BLUETOOTH ====================
void processCommand(char cmd) {
  // === ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ (кнопки 1, 2, 3) ===
  if (cmd == '1') {
    resetAutonomousModes();  // Сброс состояния перед входом в автономный режим
    currentMode = MODE_LINE_FOLLOWING;
    stopMotors();
    Serial.println(F("[BT] Mode: LINE FOLLOW"));
    bluetooth.println(F("Line Mode"));
    return;
  }

  if (cmd == '2') {
    resetAutonomousModes();  // Сброс состояния перед входом в автономный режим
    currentMode = MODE_OBSTACLE_AVOIDANCE;
    stopMotors();
    Serial.println(F("[BT] Mode: AVOID"));
    bluetooth.println(F("Avoid Mode"));
    return;
  }

  if (cmd == '3') {
    resetAutonomousModes();  // Сброс состояния перед входом в автономный режим
    currentMode = MODE_HAND_FOLLOWING;
    stopMotors();
    Serial.println(F("[BT] Mode: HAND FOLLOW"));
    bluetooth.println(F("Follow Mode"));
    return;
  }

  // === ЭКСТРЕННЫЙ ОСТАНОВ (кнопка Y) ===
  if (cmd == '4') {
    resetAutonomousModes();  // Полная очистка при переходе в ручной режим
    currentMode = MODE_MANUAL;
    stopMotors();
    Serial.println(F("[BT] E-STOP -> MANUAL"));
    bluetooth.println(F("STOP!"));
    return;
  }

  // === РУЧНОЕ УПРАВЛЕНИЕ (джойстик) ===
  // Работает ТОЛЬКО в ручном режиме
  if (currentMode == MODE_MANUAL) {
    switch (cmd) {
      // === ОСНОВНЫЕ НАПРАВЛЕНИЯ ===
      case 'F':
        moveForward();
        Serial.println(F("[BT] FWD"));
        break;

      case 'f':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      case 'B':
        moveBackward();
        Serial.println(F("[BT] BACK"));
        break;

      case 'b':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      case 'L':
        turnLeft();
        Serial.println(F("[BT] LEFT"));
        break;

      case 'l':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      case 'R':
        turnRight();
        Serial.println(F("[BT] RIGHT"));
        break;

      case 'r':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      // === ДИАГОНАЛЬНЫЕ НАПРАВЛЕНИЯ (векторное управление) ===
      case 'Y':  // Вперёд-Влево (Up-Left)
        moveForwardLeft();
        Serial.println(F("[BT] FWD-LEFT"));
        break;

      case 'y':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      case 'U':  // Вперёд-Вправо (Up-Right)
        moveForwardRight();
        Serial.println(F("[BT] FWD-RIGHT"));
        break;

      case 'u':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      case 'H':  // Назад-Влево (Down-Left)
        moveBackwardLeft();
        Serial.println(F("[BT] BACK-LEFT"));
        break;

      case 'h':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;

      case 'J':  // Назад-Вправо (Down-Right)
        moveBackwardRight();
        Serial.println(F("[BT] BACK-RIGHT"));
        break;

      case 'j':
        stopMotors();
        Serial.println(F("[BT] STOP"));
        break;
    }
  }
}

// ==================== ОБРАБОТКА КОМАНД ИК-ПУЛЬТА ====================
void processIRCommand(unsigned long code) {
  // Логирование только для отладки (можно закомментировать для экономии памяти)
  // Serial.print(F("[IR] Code: 0x"));
  // Serial.println(code, HEX);

  // === ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ (кнопки 1, 2, 3) ===
  if (code == BTN_1) {
    resetAutonomousModes();  // Сброс состояния перед входом в автономный режим
    currentMode = MODE_LINE_FOLLOWING;
    stopMotors();
    Serial.println(F("[IR] Mode: LINE FOLLOW"));
    bluetooth.println(F("Line(IR)"));
    return;
  }

  if (code == BTN_2) {
    resetAutonomousModes();  // Сброс состояния перед входом в автономный режим
    currentMode = MODE_OBSTACLE_AVOIDANCE;
    stopMotors();
    Serial.println(F("[IR] Mode: AVOID"));
    bluetooth.println(F("Avoid(IR)"));
    return;
  }

  if (code == BTN_3) {
    resetAutonomousModes();  // Сброс состояния перед входом в автономный режим
    currentMode = MODE_HAND_FOLLOWING;
    stopMotors();
    Serial.println(F("[IR] Mode: HAND FOLLOW"));
    bluetooth.println(F("Follow(IR)"));
    return;
  }

  // === ЭКСТРЕННЫЙ ОСТАНОВ (кнопка OK) ===
  if (code == BTN_OK) {
    resetAutonomousModes();  // Полная очистка при переходе в ручной режим
    currentMode = MODE_MANUAL;
    stopMotors();
    Serial.println(F("[IR] E-STOP -> MANUAL"));
    bluetooth.println(F("STOP(IR)"));
    return;
  }

  // === РУЧНОЕ УПРАВЛЕНИЕ (стрелки) ===
  // Работает ТОЛЬКО в ручном режиме
  if (currentMode == MODE_MANUAL) {
    // Обновляем время последнего IR сигнала (для auto-stop)
    lastIRSignalTime = millis();

    switch (code) {
      case BTN_UP:
        moveForward();
        Serial.println(F("[IR] FWD"));
        break;

      case BTN_DOWN:
        moveBackward();
        Serial.println(F("[IR] BACK"));
        break;

      case BTN_LEFT:
        turnLeft();
        Serial.println(F("[IR] LEFT"));
        break;

      case BTN_RIGHT:
        turnRight();
        Serial.println(F("[IR] RIGHT"));
        break;
    }
  }
}

// ==================== ФУНКЦИЯ СБРОСА СОСТОЯНИЯ АВТОНОМНЫХ РЕЖИМОВ ====================
void resetAutonomousModes() {
  // Эта функция НЕ МОЖЕТ напрямую сбросить static переменные внутри функций,
  // но гарантирует, что моторы остановлены и серво отключён
  stopMotors();
  if (scanServo.attached()) {
    scanServo.detach();
  }
}

// ==================== ФУНКЦИИ ДВИЖЕНИЯ ====================
void moveForward() {
  motorLeft.setSpeed(SPEED_NORMAL);
  motorRight.setSpeed(SPEED_NORMAL);
}

void moveBackward() {
  motorLeft.setSpeed(-SPEED_NORMAL);
  motorRight.setSpeed(-SPEED_NORMAL);
}

void turnLeft() {
  motorLeft.setSpeed(-SPEED_TURN);
  motorRight.setSpeed(SPEED_TURN);
}

void turnRight() {
  motorLeft.setSpeed(SPEED_TURN);
  motorRight.setSpeed(-SPEED_TURN);
}

void stopMotors() {
  motorLeft.setSpeed(0);
  motorRight.setSpeed(0);
}

// === ДИАГОНАЛЬНЫЕ ДВИЖЕНИЯ (дифференциальное рулевое управление) ===
void moveForwardLeft() {
  // Вперёд-влево: правое колесо вперёд, левое СТОП
  motorLeft.setSpeed(0);               // Левое стоит на месте
  motorRight.setSpeed(-SPEED_NORMAL);  // Правое вперёд
}

void moveForwardRight() {
  // Вперёд-вправо: левое колесо вперёд, правое СТОП
  motorLeft.setSpeed(-SPEED_NORMAL);   // Левое вперёд
  motorRight.setSpeed(0);              // Правое стоит на месте
}

void moveBackwardLeft() {
  // Назад-влево: правое колесо назад, левое СТОП
  motorLeft.setSpeed(0);               // Левое стоит на месте
  motorRight.setSpeed(SPEED_NORMAL);   // Правое назад
}

void moveBackwardRight() {
  // Назад-вправо: левое колесо назад, правое СТОП
  motorLeft.setSpeed(SPEED_NORMAL);    // Левое назад
  motorRight.setSpeed(0);              // Правое стоит на месте
}

// ==================== ФУНКЦИЯ ПРОВЕРКИ ЛИНИИ ====================
// Проверяет, находится ли датчик над чёрной линией
bool isOnLine(int value, int threshold) {
  if (INVERTED) {
    return value > threshold;  // Инвертированные: больше = чёрное
  } else {
    return value < threshold;  // Обычные: меньше = чёрное
  }
}

// ==================== РЕЖИМ 1: СЛЕДОВАНИЕ ПО ЛИНИИ (АГРЕССИВНЫЙ) ====================
void followLine() {
  // Чтение аналоговых значений (0-1023)
  int leftValue = analogRead(LINE_LEFT);
  int centerValue = analogRead(LINE_CENTER);
  int rightValue = analogRead(LINE_RIGHT);

  // Определяем, на линии ли каждый датчик
  bool L = isOnLine(leftValue, LEFT_THRESHOLD);
  bool C = isOnLine(centerValue, CENTER_THRESHOLD);
  bool R = isOnLine(rightValue, RIGHT_THRESHOLD);

  // ========== АГРЕССИВНАЯ ЛОГИКА С РЕВЕРСОМ ==========

  // Случай 1: Центр на линии (0-1-0) → ПРЯМО
  if (!L && C && !R) {
    motorLeft.setSpeed(-FORWARD_SPEED);
    motorRight.setSpeed(-FORWARD_SPEED);
  }

  // Случай 2: ЛЮБОЙ левый датчик видит линию → РЕЗКИЙ поворот налево с РЕВЕРСОМ
  else if (L) {
    // Левое колесо НАЗАД, правое колесо ВПЕРЁД
    motorLeft.setSpeed(-REVERSE_SPEED);   // Реверс (отрицательное значение)
    motorRight.setSpeed(-TURN_SPEED);     // Вперёд быстро
  }

  // Случай 3: ЛЮБОЙ правый датчик видит линию → РЕЗКИЙ поворот направо с РЕВЕРСОМ
  else if (R) {
    // Левое колесо ВПЕРЁД, правое колесо НАЗАД
    motorLeft.setSpeed(-TURN_SPEED);      // Вперёд быстро
    motorRight.setSpeed(-REVERSE_SPEED);  // Реверс (отрицательное значение)
  }

  // Случай 4: Линия потеряна (0-0-0) → медленно вперёд (поиск)
  else if (!L && !C && !R) {
    motorLeft.setSpeed(-FORWARD_SPEED / 2);
    motorRight.setSpeed(-FORWARD_SPEED / 2);
  }

  // НЕТ delay()! Цикл работает максимально быстро для мгновенной реакции
}

// ==================== РЕЖИМ 2: ОБЪЕЗД ПРЕПЯТСТВИЙ ====================
void avoidObstacles() {
  // State machine для обработки препятствий БЕЗ delay()
  static enum {INIT_START, INIT_WAIT, MOVING, STOP_WAIT, SCAN_LEFT, SCAN_WAIT1, SCAN_RIGHT, SCAN_WAIT2, SCAN_CENTER, TURNING, TURN_WAIT} state = INIT_START;
  static unsigned long stateTimer = 0;
  static int distLeft = 0, distRight = 0;
  static unsigned long lastDebug = 0;

  // === ИНИЦИАЛИЗАЦИЯ: ЦЕНТРИРОВАНИЕ СЕРВО ПРИ ВХОДЕ В РЕЖИМ ===
  switch (state) {
    case INIT_START:
      Serial.println(F("[AVOID] Centering servo..."));
      // ПОЛНОСТЬЮ отключаем моторы
      motorLeft.stop();
      motorRight.stop();

      scanServo.attach(SERVO_PIN);
      delay(SERVO_ATTACH_DELAY);
      scanServo.write(SERVO_CENTER);  // Серво смотрит вперёд
      stateTimer = millis();
      state = INIT_WAIT;
      return;

    case INIT_WAIT:
      if (millis() - stateTimer > INIT_SERVO_WAIT) {
        scanServo.detach();

        // Восстанавливаем ВСЕ пины моторов

        Serial.println(F("[AVOID] Ready!"));
        state = MOVING;
      }
      return;
  }

  float distance = ultrasonic.getDistance();

  // Отладка каждые 500мс
  if (millis() - lastDebug > 500) {
    Serial.print(F("Avoid: D="));
    Serial.print(distance);
    Serial.println(F("cm"));
    lastDebug = millis();
  }

  // === STATE MACHINE ===
  switch (state) {
    case MOVING:
      // Едем вперёд, проверяем препятствия
      if (distance < OBSTACLE_DISTANCE && distance > 0) {
        Serial.println(F("-> OBSTACLE!"));
        stopMotors();
        stateTimer = millis();
        state = STOP_WAIT;
      } else {
        moveForward();
      }
      break;

    case STOP_WAIT:
      // Ждём 300мс после остановки
      if (millis() - stateTimer > 300) {
        Serial.println(F("-> Scanning..."));
        state = SCAN_LEFT;
      }
      break;

    case SCAN_LEFT:
      // Сканируем налево
      distLeft = scanDirection(150);
      Serial.print(F("Left="));
      Serial.print(distLeft);
      Serial.print(F("cm"));
      stateTimer = millis();
      state = SCAN_WAIT1;
      break;

    case SCAN_WAIT1:
      // Ждём 200мс между сканированиями
      if (millis() - stateTimer > 200) {
        state = SCAN_RIGHT;
      }
      break;

    case SCAN_RIGHT:
      // Сканируем направо
      distRight = scanDirection(30);
      Serial.print(F(" Right="));
      Serial.print(distRight);
      Serial.println(F("cm"));
      stateTimer = millis();
      state = SCAN_WAIT2;
      break;

    case SCAN_WAIT2:
      // Ждём 200мс перед возвратом серво в центр
      if (millis() - stateTimer > 200) {
        state = SCAN_CENTER;
      }
      break;

    case SCAN_CENTER:
      // Возвращаем серво в центр
      scanDirection(SERVO_CENTER);
      // Выбираем направление поворота
      if (distLeft > distRight) {
        Serial.println(F("-> Turn LEFT"));
        turnLeft();
      } else {
        Serial.println(F("-> Turn RIGHT"));
        turnRight();
      }
      stateTimer = millis();
      state = TURNING;
      break;

    case TURNING:
      // Поворачиваем 500мс
      if (millis() - stateTimer > 500) {
        stopMotors();
        stateTimer = millis();
        state = TURN_WAIT;
      }
      break;

    case TURN_WAIT:
      // Ждём 200мс после поворота
      if (millis() - stateTimer > 200) {
        state = MOVING;  // Возвращаемся к движению
      }
      break;
  }
}

// Функция сканирования (с ПОЛНЫМ отключением питания моторов)
int scanDirection(int angle) {
  // === КРИТИЧЕСКИ ВАЖНО: ПОЛНОСТЬЮ ОТКЛЮЧАЕМ МОТОРЫ ===
  // Останавливаем моторы через библиотеку
  motorLeft.stop();
  motorRight.stop();
  delay(MOTOR_STOP_DELAY);



  delay(MOTOR_PIN_SWITCH_DELAY);

  // === БЫСТРЫЙ ПОВОРОТ БЕЗ ПЛАВНОСТИ ===
  scanServo.attach(SERVO_PIN);
  delay(SERVO_ATTACH_DELAY);
  scanServo.write(angle);  // Прямой поворот на нужный угол
  delay(SERVO_STABILIZE_DELAY);

  float dist = ultrasonic.getDistance();

  scanServo.detach();  // Отключаем серво
  delay(SERVO_DETACH_DELAY);

  // === ВОССТАНАВЛИВАЕМ ВСЕ ПИНЫ МОТОРОВ ===


  return (int)dist;
}

// ==================== РЕЖИМ 3: СЛЕДОВАНИЕ ЗА РУКОЙ ====================
void followHand() {
  // Инициализация серво БЕЗ блокирующего delay()
  static enum {INIT_START, INIT_WAIT, READY} initState = INIT_START;
  static unsigned long initTimer = 0;

  switch (initState) {
    case INIT_START:
      // ПОЛНОСТЬЮ отключаем моторы
      motorLeft.stop();
      motorRight.stop();



      scanServo.attach(SERVO_PIN);
      delay(SERVO_ATTACH_DELAY);
      scanServo.write(SERVO_CENTER);
      initTimer = millis();
      initState = INIT_WAIT;
      return;  // Выходим, продолжим в следующем цикле

    case INIT_WAIT:
      if (millis() - initTimer > INIT_SERVO_WAIT) {  // Ждём серво без блокировки
        scanServo.detach();

        // Восстанавливаем ВСЕ пины моторов


        initState = READY;
      }
      return;  // Продолжаем ждать

    case READY:
      break;  // Серво готов, продолжаем работу
  }

  float distance = ultrasonic.getDistance();

  // Отладка каждые 500мс
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 500) {
    Serial.print(F("Follow: D="));
    Serial.print(distance);
    Serial.print(F("cm"));
    lastDebug = millis();
  }

  if (distance > 0 && distance < 200) {
    if (distance < DISTANCE_TOO_CLOSE) {
      Serial.println(F(" -> TOO CLOSE"));
      moveBackward();
    }
    else if (distance > DISTANCE_TOO_FAR) {
      Serial.println(F(" -> TOO FAR"));
      moveForward();
    }
    else {
      Serial.println(F(" -> PERFECT"));
      stopMotors();
    }
  } else {
    Serial.println(F(" -> OUT OF RANGE"));
    stopMotors();
  }

  // НЕТ delay()! Цикл выполняется максимально быстро
}

// ==================== ОТПРАВКА ДАННЫХ ДАТЧИКОВ ====================
void sendSensorData() {
  // Отправляем данные датчиков только в ручном режиме, чтобы не мешать автономным режимам
  if (currentMode != MODE_MANUAL) return;

  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorSend >= SENSOR_SEND_INTERVAL) {
    lastSensorSend = currentMillis;

    // ВАЖНО: Проверяем входящие команды ПЕРЕД отправкой данных!
    // Это гарантирует, что команды остановки обрабатываются приоритетно
    while (bluetooth.available()) {
      char cmd = bluetooth.read();
      processCommand(cmd);
    }

    // Читаем датчики линии (быстрые аналоговые операции)
    int lineLeft = analogRead(LINE_LEFT);
    int lineCenter = analogRead(LINE_CENTER);
    int lineRight = analogRead(LINE_RIGHT);

    // Читаем ультразвуковой датчик (может быть медленным из-за pulseIn)
    // Используем короткий таймаут для getDistance()
    float distance = ultrasonic.getDistance();

    // Отправляем данные максимально компактно
    bluetooth.print(F("S1:"));
    bluetooth.print((int)distance);
    bluetooth.print(F("\nS2:"));
    bluetooth.print(lineLeft);
    bluetooth.print(F("\nS3:"));
    bluetooth.print(lineCenter);
    bluetooth.print(F("\nS4:"));
    bluetooth.println(lineRight);

    // Принудительно сбрасываем буфер для быстрой отправки
    bluetooth.flush();
  }
}