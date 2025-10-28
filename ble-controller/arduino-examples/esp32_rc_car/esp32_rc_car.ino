/*
 * ESP32 BLE RC Car Control Example
 *
 * This sketch demonstrates motor control using ESP32's built-in BLE.
 * Compatible with the Control Panel mode in Alashed BLE app.
 *
 * Features:
 * - WASD controls (left buttons) - press/release support
 * - Arrow keys (right joystick) - U/L/R/B
 * - 3 action buttons with feedback
 * - LED status indicator
 *
 * Commands:
 * - W/w: Forward / Stop
 * - A/a: Left / Stop
 * - S/s: Backward / Stop
 * - D/d: Right / Stop
 * - U/L/R/B: Arrow keys (press)
 * - u/l/r/b: Arrow keys (release)
 * - 1: Speed boost
 * - 2: Horn (blink LED 3x)
 * - 3: Emergency stop
 *
 * Hardware connections:
 * L298N Motor Driver:
 *   IN1 -> GPIO 16
 *   IN2 -> GPIO 17
 *   IN3 -> GPIO 18
 *   IN4 -> GPIO 19
 *   ENA -> GPIO 25 (PWM for motor A speed)
 *   ENB -> GPIO 26 (PWM for motor B speed)
 *
 * LED: GPIO 2 (built-in)
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Motor driver pins
#define MOTOR_A_IN1 16
#define MOTOR_A_IN2 17
#define MOTOR_B_IN3 18
#define MOTOR_B_IN4 19
#define MOTOR_A_EN  25  // PWM
#define MOTOR_B_EN  26  // PWM

// PWM settings
#define PWM_FREQ 5000
#define PWM_RESOLUTION 8
#define PWM_CHANNEL_A 0
#define PWM_CHANNEL_B 1

// Motor speed (0-255)
int motorSpeed = 200;

// LED pin (GPIO 2 for most ESP32 boards)
#define LED_PIN 2

// UUIDs for HM-10 compatible UART service
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;

// Forward declarations
void stopMotors();
void handleCommand(char cmd);
void moveForward();
void moveBackward();
void turnLeft();
void turnRight();
void blinkLED(int times);

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Client Connected");
      digitalWrite(LED_PIN, HIGH);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client Disconnected");
      stopMotors();
      digitalWrite(LED_PIN, LOW);
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String rxValue = pCharacteristic->getValue().c_str();

      if (rxValue.length() > 0) {
        char command = rxValue[0];
        Serial.print("Command: ");
        Serial.println(command);
        handleCommand(command);
      }
    }
};

void setup() {
  Serial.begin(115200);

  // Setup motor pins
  pinMode(MOTOR_A_IN1, OUTPUT);
  pinMode(MOTOR_A_IN2, OUTPUT);
  pinMode(MOTOR_B_IN3, OUTPUT);
  pinMode(MOTOR_B_IN4, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Setup PWM (ESP32 Arduino 3.x API)
  ledcAttach(MOTOR_A_EN, PWM_FREQ, PWM_RESOLUTION);
  ledcAttach(MOTOR_B_EN, PWM_FREQ, PWM_RESOLUTION);

  stopMotors();

  Serial.println("ESP32 BLE RC Car Starting...");

  // Create BLE Device
  BLEDevice::init("HM-10");  // Name compatible with app filters

  // Create BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristic
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

  // Start service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("RC Car Ready! Waiting for connection...");
}

void loop() {
  delay(10);
}

void handleCommand(char cmd) {
  switch(cmd) {
    // WASD controls (left buttons) - UPPERCASE = press, lowercase = release
    case 'W':
      moveForward();
      break;

    case 'w':
      stopMotors();
      break;

    case 'A':
      turnLeft();
      break;

    case 'a':
      stopMotors();
      break;

    case 'S':
      moveBackward();
      break;

    case 's':
      stopMotors();
      break;

    case 'D':
      turnRight();
      break;

    case 'd':
      stopMotors();
      break;

    // Arrow keys (right joystick)
    case 'U':  // Up
      moveForward();
      break;

    case 'u':
      stopMotors();
      break;

    case 'L':  // Left
      turnLeft();
      break;

    case 'l':
      stopMotors();
      break;

    case 'R':  // Right
      turnRight();
      break;

    case 'r':
      stopMotors();
      break;

    case 'B':  // Down/Back
      moveBackward();
      break;

    case 'b':
      stopMotors();
      break;

    // Button 1 - Speed boost
    case '1':
      if (deviceConnected) {
        pTxCharacteristic->setValue("Speed Boost ON");
        pTxCharacteristic->notify();
      }
      digitalWrite(LED_PIN, HIGH);
      Serial.println("Button 1: Speed Boost");
      break;

    // Button 2 - Horn/Light
    case '2':
      if (deviceConnected) {
        pTxCharacteristic->setValue("Horn!");
        pTxCharacteristic->notify();
      }
      blinkLED(3);
      Serial.println("Button 2: Horn");
      break;

    // Button 3 - Emergency stop
    case '3':
      stopMotors();
      if (deviceConnected) {
        pTxCharacteristic->setValue("Emergency Stop");
        pTxCharacteristic->notify();
      }
      Serial.println("Button 3: Emergency Stop");
      break;

    default:
      Serial.print("Unknown command: ");
      Serial.println(cmd);
      break;
  }
}

void moveForward() {
  Serial.println("Forward");
  digitalWrite(MOTOR_A_IN1, HIGH);
  digitalWrite(MOTOR_A_IN2, LOW);
  digitalWrite(MOTOR_B_IN3, HIGH);
  digitalWrite(MOTOR_B_IN4, LOW);
  ledcWrite(MOTOR_A_EN, motorSpeed);
  ledcWrite(MOTOR_B_EN, motorSpeed);
}

void moveBackward() {
  Serial.println("Backward");
  digitalWrite(MOTOR_A_IN1, LOW);
  digitalWrite(MOTOR_A_IN2, HIGH);
  digitalWrite(MOTOR_B_IN3, LOW);
  digitalWrite(MOTOR_B_IN4, HIGH);
  ledcWrite(MOTOR_A_EN, motorSpeed);
  ledcWrite(MOTOR_B_EN, motorSpeed);
}

void turnLeft() {
  Serial.println("Turn Left");
  digitalWrite(MOTOR_A_IN1, LOW);
  digitalWrite(MOTOR_A_IN2, HIGH);
  digitalWrite(MOTOR_B_IN3, HIGH);
  digitalWrite(MOTOR_B_IN4, LOW);
  ledcWrite(MOTOR_A_EN, motorSpeed);
  ledcWrite(MOTOR_B_EN, motorSpeed);
}

void turnRight() {
  Serial.println("Turn Right");
  digitalWrite(MOTOR_A_IN1, HIGH);
  digitalWrite(MOTOR_A_IN2, LOW);
  digitalWrite(MOTOR_B_IN3, LOW);
  digitalWrite(MOTOR_B_IN4, HIGH);
  ledcWrite(MOTOR_A_EN, motorSpeed);
  ledcWrite(MOTOR_B_EN, motorSpeed);
}

void stopMotors() {
  Serial.println("Stop");
  digitalWrite(MOTOR_A_IN1, LOW);
  digitalWrite(MOTOR_A_IN2, LOW);
  digitalWrite(MOTOR_B_IN3, LOW);
  digitalWrite(MOTOR_B_IN4, LOW);
  ledcWrite(MOTOR_A_EN, 0);
  ledcWrite(MOTOR_B_EN, 0);
  digitalWrite(LED_PIN, LOW);
}

void blinkLED(int times) {
  for(int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}
