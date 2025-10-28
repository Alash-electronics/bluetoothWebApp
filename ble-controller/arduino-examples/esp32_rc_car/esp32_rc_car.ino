/*
 * ESP32 BLE RC Car Control Example
 *
 * This sketch demonstrates motor control using ESP32's built-in BLE.
 * Compatible with the RC Car Control panel in the web app.
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
 * LED (optional): GPIO 2 (built-in)
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
      std::string rxValue = pCharacteristic->getValue();

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

  // Setup PWM
  ledcSetup(PWM_CHANNEL_A, PWM_FREQ, PWM_RESOLUTION);
  ledcSetup(PWM_CHANNEL_B, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(MOTOR_A_EN, PWM_CHANNEL_A);
  ledcAttachPin(MOTOR_B_EN, PWM_CHANNEL_B);

  stopMotors();

  Serial.println("ESP32 BLE RC Car Starting...");

  // Create BLE Device
  BLEDevice::init("BT05");  // Name compatible with app filters

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
                        BLECharacteristic::PROPERTY_WRITE_NO_RESPONSE |
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
    // Movement commands
    case 'W':  // Forward
      moveForward();
      break;

    case 'S':  // Backward
      moveBackward();
      break;

    case 'A':  // Turn left
      turnLeft();
      break;

    case 'D':  // Turn right
      turnRight();
      break;

    case 'X':  // Stop
      stopMotors();
      break;

    // Speed control
    case '1':  // Slow
      motorSpeed = 150;
      Serial.println("Speed: Slow");
      break;

    case '2':  // Medium
      motorSpeed = 200;
      Serial.println("Speed: Medium");
      break;

    case '3':  // Fast
      motorSpeed = 255;
      Serial.println("Speed: Fast");
      break;

    // LED control
    case 'L':  // LED on
      digitalWrite(LED_PIN, HIGH);
      break;

    case 'l':  // LED off
      digitalWrite(LED_PIN, LOW);
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
  ledcWrite(PWM_CHANNEL_A, motorSpeed);
  ledcWrite(PWM_CHANNEL_B, motorSpeed);
}

void moveBackward() {
  Serial.println("Backward");
  digitalWrite(MOTOR_A_IN1, LOW);
  digitalWrite(MOTOR_A_IN2, HIGH);
  digitalWrite(MOTOR_B_IN3, LOW);
  digitalWrite(MOTOR_B_IN4, HIGH);
  ledcWrite(PWM_CHANNEL_A, motorSpeed);
  ledcWrite(PWM_CHANNEL_B, motorSpeed);
}

void turnLeft() {
  Serial.println("Turn Left");
  digitalWrite(MOTOR_A_IN1, LOW);
  digitalWrite(MOTOR_A_IN2, HIGH);
  digitalWrite(MOTOR_B_IN3, HIGH);
  digitalWrite(MOTOR_B_IN4, LOW);
  ledcWrite(PWM_CHANNEL_A, motorSpeed);
  ledcWrite(PWM_CHANNEL_B, motorSpeed);
}

void turnRight() {
  Serial.println("Turn Right");
  digitalWrite(MOTOR_A_IN1, HIGH);
  digitalWrite(MOTOR_A_IN2, LOW);
  digitalWrite(MOTOR_B_IN3, LOW);
  digitalWrite(MOTOR_B_IN4, HIGH);
  ledcWrite(PWM_CHANNEL_A, motorSpeed);
  ledcWrite(PWM_CHANNEL_B, motorSpeed);
}

void stopMotors() {
  Serial.println("Stop");
  digitalWrite(MOTOR_A_IN1, LOW);
  digitalWrite(MOTOR_A_IN2, LOW);
  digitalWrite(MOTOR_B_IN3, LOW);
  digitalWrite(MOTOR_B_IN4, LOW);
  ledcWrite(PWM_CHANNEL_A, 0);
  ledcWrite(PWM_CHANNEL_B, 0);
}
