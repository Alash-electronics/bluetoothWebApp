/*
 * ESP32 BLE Phobo Master - Full Robot Control
 * Адаптировано для ESP32 с встроенным BLE
 *
 * Возможности:
 * - Bluetooth управление через приложение Alashed BLE
 * - 3 автономных режима (линия, препятствия, следование за рукой)
 * - Векторное управление (8 направлений)
 * - Переключение режимов кнопками 1, 2, 3
 * - Экстренный останов кнопкой 4 (Y)
 *
 * Подключение ESP32:
 * Моторы (L298N):
 *   Motor B (левый): IN3=18, IN4=19, ENB=21 (PWM)
 *   Motor A (правый): IN1=4, IN2=5, ENA=22 (PWM)
 * Servo: GPIO 23
 * Ultrasonic RCWL-9610A: Trig=15, Echo=2
 * Датчики линии: Left=34, Center=35, Right=32 (Analog)
 *
 * ВАЖНО: ESP32 имеет встроенный BLE, не требует внешний модуль HM-10!
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h>

// ==================== НАСТРОЙКИ BLUETOOTH ====================
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;

// ==================== НАСТРОЙКИ МОТОРОВ ====================
// Левый мотор (Motor B)
#define MOTOR_L_IN3 18
#define MOTOR_L_IN4 19
#define MOTOR_L_ENB 21

// Правый мотор (Motor A)
#define MOTOR_R_IN1 4
#define MOTOR_R_IN2 5
#define MOTOR_R_ENA 22

// PWM настройки для ESP32
#define PWM_FREQ 1000
#define PWM_RESOLUTION 8  // 0-255

// Скорости
const int SPEED_NORMAL = 100;
const int SPEED_SLOW = 60;
const int SPEED_TURN = 65;
const int FORWARD_SPEED = 70;
const int TURN_SPEED = 80;
const int REVERSE_SPEED = 60;

// ==================== НАСТРОЙКИ ДАТЧИКОВ ====================
// Ультразвуковой датчик
#define TRIG_PIN 15
#define ECHO_PIN 2

// Сервопривод для сканирования
#define SERVO_PIN 23
#define SERVO_CENTER 90
Servo scanServo;

// Датчики линии (аналоговые пины ESP32)
#define LINE_LEFT 34
#define LINE_CENTER 35
#define LINE_RIGHT 32

// Калибровка датчиков линии (настройте под ваши датчики)
const int LEFT_WHITE = 100, LEFT_BLACK = 300;
const int CENTER_WHITE = 100, CENTER_BLACK = 300;
const int RIGHT_WHITE = 100, RIGHT_BLACK = 300;

const int LEFT_THRESHOLD = (LEFT_WHITE + LEFT_BLACK) / 2;
const int CENTER_THRESHOLD = (CENTER_WHITE + CENTER_BLACK) / 2;
const int RIGHT_THRESHOLD = (RIGHT_WHITE + RIGHT_BLACK) / 2;

const bool INVERTED = (LEFT_BLACK > LEFT_WHITE);

// ==================== РЕЖИМЫ РАБОТЫ ====================
enum Mode {
  MODE_MANUAL,
  MODE_LINE_FOLLOWING,
  MODE_OBSTACLE_AVOIDANCE,
  MODE_HAND_FOLLOWING
};

Mode currentMode = MODE_MANUAL;

// Параметры для автономных режимов
const int DISTANCE_TOO_CLOSE = 10;
const int DISTANCE_PERFECT = 20;
const int DISTANCE_TOO_FAR = 40;
const int OBSTACLE_DISTANCE = 30;

// Forward declarations
void processCommand(char cmd);
void stopMotors();
void moveForward();
void moveBackward();
void turnLeft();
void turnRight();
void moveForwardLeft();
void moveForwardRight();
void moveBackwardLeft();
void moveBackwardRight();
void followLine();
void avoidObstacles();
void followHand();
bool isOnLine(int value, int threshold);
int scanDirection(int angle);
float getDistance();

// ==================== BLE CALLBACKS ====================
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Client Connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client Disconnected");
      stopMotors();
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String rxValue = pCharacteristic->getValue().c_str();

      if (rxValue.length() > 0) {
        char cmd = rxValue[0];
        processCommand(cmd);
      }
    }
};

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);

  // Настройка пинов моторов
  pinMode(MOTOR_L_IN3, OUTPUT);
  pinMode(MOTOR_L_IN4, OUTPUT);
  pinMode(MOTOR_R_IN1, OUTPUT);
  pinMode(MOTOR_R_IN2, OUTPUT);

  // Настройка PWM для моторов
  ledcAttach(MOTOR_L_ENB, PWM_FREQ, PWM_RESOLUTION);
  ledcAttach(MOTOR_R_ENA, PWM_FREQ, PWM_RESOLUTION);

  // Настройка ультразвукового датчика
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Настройка сервопривода
  scanServo.attach(SERVO_PIN);
  scanServo.write(SERVO_CENTER);
  delay(500);
  scanServo.detach();

  // Настройка датчиков линии
  pinMode(LINE_LEFT, INPUT);
  pinMode(LINE_CENTER, INPUT);
  pinMode(LINE_RIGHT, INPUT);

  Serial.println("ESP32 Phobo Master v2.0");
  Serial.println("Initializing BLE...");

  // Инициализация BLE
  BLEDevice::init("HM-10");

  // Создание BLE сервера
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Создание BLE сервиса
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Создание BLE характеристики
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_READ   |
                        BLECharacteristic::PROPERTY_WRITE  |
                        BLECharacteristic::PROPERTY_WRITE_NR |
                        BLECharacteristic::PROPERTY_NOTIFY |
                        BLECharacteristic::PROPERTY_INDICATE
                      );

  pTxCharacteristic->addDescriptor(new BLE2902());
  pTxCharacteristic->setCallbacks(new MyCallbacks());

  // Запуск сервиса
  pService->start();

  // Запуск рекламы
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("Phobo Ready! Waiting for connection...");
  stopMotors();
}

// ==================== MAIN LOOP ====================
void loop() {
  // Выполняем действия в зависимости от режима
  switch (currentMode) {
    case MODE_MANUAL:
      // В ручном режиме команды обрабатываются в processCommand()
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

  delay(10);
}

// ==================== ОБРАБОТКА КОМАНД ====================
void processCommand(char cmd) {
  // Переключение режимов
  if (cmd == '1') {
    currentMode = MODE_LINE_FOLLOWING;
    stopMotors();
    Serial.println("[BT] Mode: LINE FOLLOW");
    if (deviceConnected) {
      pTxCharacteristic->setValue("Line Mode");
      pTxCharacteristic->notify();
    }
    return;
  }

  if (cmd == '2') {
    currentMode = MODE_OBSTACLE_AVOIDANCE;
    stopMotors();
    Serial.println("[BT] Mode: AVOID");
    if (deviceConnected) {
      pTxCharacteristic->setValue("Avoid Mode");
      pTxCharacteristic->notify();
    }
    return;
  }

  if (cmd == '3') {
    currentMode = MODE_HAND_FOLLOWING;
    stopMotors();
    Serial.println("[BT] Mode: HAND FOLLOW");
    if (deviceConnected) {
      pTxCharacteristic->setValue("Follow Mode");
      pTxCharacteristic->notify();
    }
    return;
  }

  if (cmd == '4') {
    currentMode = MODE_MANUAL;
    stopMotors();
    Serial.println("[BT] E-STOP -> MANUAL");
    if (deviceConnected) {
      pTxCharacteristic->setValue("STOP!");
      pTxCharacteristic->notify();
    }
    return;
  }

  // Ручное управление (только в ручном режиме)
  if (currentMode == MODE_MANUAL) {
    switch (cmd) {
      case 'F': moveForward(); Serial.println("[BT] FWD"); break;
      case 'f': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'B': moveBackward(); Serial.println("[BT] BACK"); break;
      case 'b': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'L': turnLeft(); Serial.println("[BT] LEFT"); break;
      case 'l': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'R': turnRight(); Serial.println("[BT] RIGHT"); break;
      case 'r': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'Y': moveForwardLeft(); Serial.println("[BT] FWD-LEFT"); break;
      case 'y': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'U': moveForwardRight(); Serial.println("[BT] FWD-RIGHT"); break;
      case 'u': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'H': moveBackwardLeft(); Serial.println("[BT] BACK-LEFT"); break;
      case 'h': stopMotors(); Serial.println("[BT] STOP"); break;
      case 'J': moveBackwardRight(); Serial.println("[BT] BACK-RIGHT"); break;
      case 'j': stopMotors(); Serial.println("[BT] STOP"); break;
    }
  }
}

// ==================== ФУНКЦИИ ДВИЖЕНИЯ ====================
void setLeftMotor(int speed) {
  if (speed == 0) {
    digitalWrite(MOTOR_L_IN3, LOW);
    digitalWrite(MOTOR_L_IN4, LOW);
    ledcWrite(MOTOR_L_ENB, 0);
  } else if (speed > 0) {
    digitalWrite(MOTOR_L_IN3, HIGH);
    digitalWrite(MOTOR_L_IN4, LOW);
    ledcWrite(MOTOR_L_ENB, speed);
  } else {
    digitalWrite(MOTOR_L_IN3, LOW);
    digitalWrite(MOTOR_L_IN4, HIGH);
    ledcWrite(MOTOR_L_ENB, abs(speed));
  }
}

void setRightMotor(int speed) {
  if (speed == 0) {
    digitalWrite(MOTOR_R_IN1, LOW);
    digitalWrite(MOTOR_R_IN2, LOW);
    ledcWrite(MOTOR_R_ENA, 0);
  } else if (speed > 0) {
    digitalWrite(MOTOR_R_IN1, HIGH);
    digitalWrite(MOTOR_R_IN2, LOW);
    ledcWrite(MOTOR_R_ENA, speed);
  } else {
    digitalWrite(MOTOR_R_IN1, LOW);
    digitalWrite(MOTOR_R_IN2, HIGH);
    ledcWrite(MOTOR_R_ENA, abs(speed));
  }
}

void moveForward() {
  setLeftMotor(SPEED_NORMAL);
  setRightMotor(SPEED_NORMAL);
}

void moveBackward() {
  setLeftMotor(-SPEED_NORMAL);
  setRightMotor(-SPEED_NORMAL);
}

void turnLeft() {
  setLeftMotor(-SPEED_TURN);
  setRightMotor(SPEED_TURN);
}

void turnRight() {
  setLeftMotor(SPEED_TURN);
  setRightMotor(-SPEED_TURN);
}

void stopMotors() {
  setLeftMotor(0);
  setRightMotor(0);
}

void moveForwardLeft() {
  setLeftMotor(0);
  setRightMotor(SPEED_NORMAL);
}

void moveForwardRight() {
  setLeftMotor(SPEED_NORMAL);
  setRightMotor(0);
}

void moveBackwardLeft() {
  setLeftMotor(0);
  setRightMotor(-SPEED_NORMAL);
}

void moveBackwardRight() {
  setLeftMotor(-SPEED_NORMAL);
  setRightMotor(0);
}

// ==================== УЛЬТРАЗВУКОВОЙ ДАТЧИК ====================
float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout
  if (duration == 0) return 0;

  float distance = duration * 0.034 / 2;
  return distance;
}

// ==================== ФУНКЦИЯ ПРОВЕРКИ ЛИНИИ ====================
bool isOnLine(int value, int threshold) {
  if (INVERTED) {
    return value > threshold;
  } else {
    return value < threshold;
  }
}

// ==================== РЕЖИМ 1: СЛЕДОВАНИЕ ПО ЛИНИИ ====================
void followLine() {
  int leftValue = analogRead(LINE_LEFT);
  int centerValue = analogRead(LINE_CENTER);
  int rightValue = analogRead(LINE_RIGHT);

  bool L = isOnLine(leftValue, LEFT_THRESHOLD);
  bool C = isOnLine(centerValue, CENTER_THRESHOLD);
  bool R = isOnLine(rightValue, RIGHT_THRESHOLD);

  // Агрессивная логика с реверсом
  if (!L && C && !R) {
    // Центр на линии - прямо
    setLeftMotor(FORWARD_SPEED);
    setRightMotor(FORWARD_SPEED);
  }
  else if (L) {
    // Левый датчик на линии - резкий поворот налево с реверсом
    setLeftMotor(-REVERSE_SPEED);
    setRightMotor(TURN_SPEED);
  }
  else if (R) {
    // Правый датчик на линии - резкий поворот направо с реверсом
    setLeftMotor(TURN_SPEED);
    setRightMotor(-REVERSE_SPEED);
  }
  else {
    // Линия потеряна - медленно вперёд
    setLeftMotor(FORWARD_SPEED / 2);
    setRightMotor(FORWARD_SPEED / 2);
  }
}

// ==================== РЕЖИМ 2: ОБЪЕЗД ПРЕПЯТСТВИЙ ====================
void avoidObstacles() {
  static enum {INIT, MOVING, SCANNING, TURNING} state = INIT;
  static unsigned long stateTimer = 0;
  static int distLeft = 0, distRight = 0;

  switch (state) {
    case INIT:
      scanServo.attach(SERVO_PIN);
      scanServo.write(SERVO_CENTER);
      delay(500);
      scanServo.detach();
      state = MOVING;
      break;

    case MOVING:
      {
        float distance = getDistance();
        if (distance < OBSTACLE_DISTANCE && distance > 0) {
          stopMotors();
          state = SCANNING;
          stateTimer = millis();
        } else {
          moveForward();
        }
      }
      break;

    case SCANNING:
      if (millis() - stateTimer > 300) {
        distLeft = scanDirection(150);
        delay(200);
        distRight = scanDirection(30);
        delay(200);
        scanDirection(SERVO_CENTER);

        if (distLeft > distRight) {
          turnLeft();
        } else {
          turnRight();
        }
        stateTimer = millis();
        state = TURNING;
      }
      break;

    case TURNING:
      if (millis() - stateTimer > 500) {
        stopMotors();
        delay(200);
        state = MOVING;
      }
      break;
  }
}

int scanDirection(int angle) {
  scanServo.attach(SERVO_PIN);
  scanServo.write(angle);
  delay(300);

  float dist = getDistance();

  scanServo.detach();
  return (int)dist;
}

// ==================== РЕЖИМ 3: СЛЕДОВАНИЕ ЗА РУКОЙ ====================
void followHand() {
  static enum {INIT, READY} initState = INIT;

  if (initState == INIT) {
    scanServo.attach(SERVO_PIN);
    scanServo.write(SERVO_CENTER);
    delay(500);
    scanServo.detach();
    initState = READY;
    return;
  }

  float distance = getDistance();

  if (distance > 0 && distance < 200) {
    if (distance < DISTANCE_TOO_CLOSE) {
      moveBackward();
    }
    else if (distance > DISTANCE_TOO_FAR) {
      moveForward();
    }
    else {
      stopMotors();
    }
  } else {
    stopMotors();
  }
}
