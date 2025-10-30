/*
 * ESP32 BLE Joystick Control Example
 *
 * This sketch demonstrates dual joystick control using ESP32's built-in BLE.
 * Compatible with the Joystick panel in the web app.
 *
 * Hardware connections:
 * Motor Driver (L298N or similar):
 *   Left Motor:
 *     IN3  -> GPIO 18
 *     IN4  -> GPIO 19
 *     ENB  -> GPIO 21 (PWM)
 *   Right Motor:
 *     IN1  -> GPIO 4
 *     IN2  -> GPIO 5
 *     ENA  -> GPIO 22 (PWM)
 *
 * Joystick Data Format: "J:LY,LX,RY,RX"
 * - LY, LX: Left joystick (0-100, center = 50)
 * - RY, RX: Right joystick (0-100, center = 50)
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Motor pins
#define MOTOR_L_IN3 18
#define MOTOR_L_IN4 19
#define MOTOR_L_ENB 21

#define MOTOR_R_IN1 4
#define MOTOR_R_IN2 5
#define MOTOR_R_ENA 22

// PWM settings
#define PWM_FREQ 1000
#define PWM_RESOLUTION 8  // 0-255

// UUIDs for HM-10 compatible UART service
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;

// Joystick data
int LY = 50, LX = 50, RY = 50, RX = 50;
int leftSpeed = 0, rightSpeed = 0;

// Forward declarations
void handleCommand(String cmd);
void parseJoystickData(String data);
void controlMotors();
void setLeftMotor(int speed);
void setRightMotor(int speed);
void stopMotors();

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
        handleCommand(rxValue);
      }
    }
};

void setup() {
  Serial.begin(115200);

  // Setup motor pins
  pinMode(MOTOR_L_IN3, OUTPUT);
  pinMode(MOTOR_L_IN4, OUTPUT);
  pinMode(MOTOR_R_IN1, OUTPUT);
  pinMode(MOTOR_R_IN2, OUTPUT);

  // Setup PWM for motor speed control
  ledcAttach(MOTOR_L_ENB, PWM_FREQ, PWM_RESOLUTION);
  ledcAttach(MOTOR_R_ENA, PWM_FREQ, PWM_RESOLUTION);

  // Initial states
  stopMotors();

  Serial.println("ESP32 BLE Joystick Control Starting...");

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

  Serial.println("Joystick Ready! Waiting for connection...");
}

void loop() {
  delay(10);
}

void handleCommand(String cmd) {
  Serial.print("RAW: [");
  Serial.print(cmd);
  Serial.println("]");

  // Check for joystick command
  if (cmd.startsWith("J:")) {
    String data = cmd.substring(2);
    parseJoystickData(data);
  }
}

void parseJoystickData(String data) {
  Serial.print("JOYSTICK DATA: [");
  Serial.print(data);
  Serial.println("]");

  // Parse values: LY,LX,RY,RX
  int values[4];
  int index = 0;
  int start = 0;

  for (int i = 0; i <= data.length(); i++) {
    if (i == data.length() || data[i] == ',') {
      if (index < 4) {
        String val = data.substring(start, i);
        values[index] = val.toInt();
        index++;
        start = i + 1;
      }
    }
  }

  if (index == 4) {
    LY = values[0];
    LX = values[1];
    RY = values[2];
    RX = values[3];

    Serial.print("LY=");
    Serial.print(LY);
    Serial.print(" LX=");
    Serial.print(LX);
    Serial.print(" RY=");
    Serial.print(RY);
    Serial.print(" RX=");
    Serial.println(RX);

    controlMotors();
  } else {
    Serial.print("ERROR: Got ");
    Serial.print(index);
    Serial.println(" values instead of 4");
  }

  Serial.println("-------------------");
}

void controlMotors() {
  // Use left joystick for throttle and steering
  int throttle = LY - 50;  // -50 to +50
  int steering = LX - 50;  // -50 to +50

  Serial.print("CONTROL: throttle=");
  Serial.print(throttle);
  Serial.print(" steering=");
  Serial.println(steering);

  // Deadzone
  if (abs(throttle) < 3) throttle = 0;
  if (abs(steering) < 3) steering = 0;

  // Calculate motor speeds
  if (throttle == 0 && steering == 0) {
    Serial.println(">>> STOP");
    leftSpeed = 0;
    rightSpeed = 0;
  } else {
    // Tank drive: left joystick Y for forward/backward, X for turning
    int base = map(abs(throttle), 0, 50, 0, 255);

    if (throttle > 0) {
      // Forward
      leftSpeed = base;
      rightSpeed = base;

      // Add steering
      if (steering > 0) {
        // Turn right
        rightSpeed = map(steering, 0, 50, base, -base);
      } else if (steering < 0) {
        // Turn left
        leftSpeed = map(abs(steering), 0, 50, base, -base);
      }
    } else if (throttle < 0) {
      // Backward
      leftSpeed = -base;
      rightSpeed = -base;

      // Add steering
      if (steering > 0) {
        // Turn right
        rightSpeed = map(steering, 0, 50, -base, base);
      } else if (steering < 0) {
        // Turn left
        leftSpeed = map(abs(steering), 0, 50, -base, base);
      }
    } else {
      // Only steering (rotate in place)
      leftSpeed = map(steering, -50, 50, -255, 255);
      rightSpeed = -leftSpeed;
    }

    Serial.print(">>> MOVE: L=");
    Serial.print(leftSpeed);
    Serial.print(" R=");
    Serial.println(rightSpeed);
  }

  // Apply to motors
  setLeftMotor(leftSpeed);
  setRightMotor(rightSpeed);
}

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

void stopMotors() {
  digitalWrite(MOTOR_L_IN3, LOW);
  digitalWrite(MOTOR_L_IN4, LOW);
  digitalWrite(MOTOR_R_IN1, LOW);
  digitalWrite(MOTOR_R_IN2, LOW);
  ledcWrite(MOTOR_L_ENB, 0);
  ledcWrite(MOTOR_R_ENA, 0);
  Serial.println("*** MOTORS STOPPED ***");
}
