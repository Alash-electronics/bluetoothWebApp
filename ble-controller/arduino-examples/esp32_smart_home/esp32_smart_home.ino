/*
 * ESP32 BLE Smart Home Control Example
 *
 * This sketch demonstrates home automation control using ESP32's built-in BLE.
 * Compatible with the Smart Home panel in the web app.
 *
 * Hardware connections:
 * LEDs / Relays:
 *   LED (Light)    -> GPIO 2  (built-in LED)
 *   Window Relay   -> GPIO 4
 *   Music Relay    -> GPIO 5
 *   Door Lock      -> GPIO 18
 *   Fan Relay      -> GPIO 19
 *   AC Relay       -> GPIO 21
 *
 * Sensors:
 *   Motion Sensor  -> GPIO 34 (input only)
 *   Gas Sensor     -> GPIO 35 (input only)
 *   Rain Sensor    -> GPIO 32
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Device pins
#define LED_PIN      2   // Built-in LED
#define WINDOW_PIN   4
#define MUSIC_PIN    5
#define DOOR_PIN     18
#define FAN_PIN      19
#define AC_PIN       21

// Sensor pins
#define MOTION_PIN   34
#define GAS_PIN      35
#define RAIN_PIN     32

// Device states
bool ledState = false;
bool windowState = false;
bool musicState = false;
bool doorLocked = true;
bool fanState = false;
bool acState = false;
int acTemp = 24;  // Default AC temperature

// UUIDs for HM-10 compatible UART service
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
unsigned long lastSensorCheck = 0;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Client Connected");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client Disconnected");
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

  // Setup device pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(WINDOW_PIN, OUTPUT);
  pinMode(MUSIC_PIN, OUTPUT);
  pinMode(DOOR_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(AC_PIN, OUTPUT);

  // Setup sensor pins
  pinMode(MOTION_PIN, INPUT);
  pinMode(GAS_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);

  // Initial states
  digitalWrite(LED_PIN, LOW);
  digitalWrite(WINDOW_PIN, LOW);
  digitalWrite(MUSIC_PIN, LOW);
  digitalWrite(DOOR_PIN, HIGH);  // Door locked
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(AC_PIN, LOW);

  Serial.println("ESP32 BLE Smart Home Starting...");

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

  Serial.println("Smart Home Ready! Waiting for connection...");
}

void loop() {
  // Check sensors every 500ms
  if (millis() - lastSensorCheck > 500) {
    checkSensors();
    lastSensorCheck = millis();
  }

  delay(10);
}

void handleCommand(char cmd) {
  switch(cmd) {
    // LED control
    case 'L':  // LED ON
      ledState = true;
      digitalWrite(LED_PIN, HIGH);
      Serial.println("LED ON");
      break;

    case 'l':  // LED OFF
      ledState = false;
      digitalWrite(LED_PIN, LOW);
      Serial.println("LED OFF");
      break;

    // Window control
    case 'W':  // Window OPEN
      windowState = true;
      digitalWrite(WINDOW_PIN, HIGH);
      Serial.println("Window OPEN");
      break;

    case 'w':  // Window CLOSE
      windowState = false;
      digitalWrite(WINDOW_PIN, LOW);
      Serial.println("Window CLOSE");
      break;

    // Music control
    case 'M':  // Music ON
      musicState = true;
      digitalWrite(MUSIC_PIN, HIGH);
      Serial.println("Music PLAY");
      break;

    case 'm':  // Music OFF
      musicState = false;
      digitalWrite(MUSIC_PIN, LOW);
      Serial.println("Music STOP");
      break;

    // Door control
    case 'D':  // Door UNLOCK
      doorLocked = false;
      digitalWrite(DOOR_PIN, LOW);
      Serial.println("Door UNLOCKED");
      break;

    case 'd':  // Door LOCK
      doorLocked = true;
      digitalWrite(DOOR_PIN, HIGH);
      Serial.println("Door LOCKED");
      break;

    // Fan control
    case 'F':  // Fan ON
      fanState = true;
      digitalWrite(FAN_PIN, HIGH);
      Serial.println("Fan ON");
      break;

    case 'f':  // Fan OFF
      fanState = false;
      digitalWrite(FAN_PIN, LOW);
      Serial.println("Fan OFF");
      break;

    // AC control
    case 'K':  // AC ON
      acState = true;
      digitalWrite(AC_PIN, HIGH);
      Serial.println("AC ON");
      break;

    case 'k':  // AC OFF
      acState = false;
      digitalWrite(AC_PIN, LOW);
      Serial.println("AC OFF");
      break;

    case 'H':  // AC Heat mode
      Serial.println("AC: Heat Mode");
      break;

    case 'C':  // AC Cool mode
      Serial.println("AC: Cool Mode");
      break;

    case 'Y':  // AC Dry mode
      Serial.println("AC: Dry Mode");
      break;

    case 'N':  // AC Fan mode
      Serial.println("AC: Fan Mode");
      break;

    case 'Z':  // Temperature UP
      if (acTemp < 30) {
        acTemp++;
        Serial.print("AC Temp: ");
        Serial.println(acTemp);
      }
      break;

    case 'V':  // Temperature DOWN
      if (acTemp > 16) {
        acTemp--;
        Serial.print("AC Temp: ");
        Serial.println(acTemp);
      }
      break;

    // Temperature set (T16-T30)
    case 'T':
      // Next bytes would be temperature value
      break;

    default:
      Serial.print("Unknown command: ");
      Serial.println(cmd);
      break;
  }
}

void checkSensors() {
  static bool lastMotion = false;
  static bool lastGas = false;
  static bool lastRain = false;

  // Check motion sensor
  bool motion = digitalRead(MOTION_PIN);
  if (motion != lastMotion && deviceConnected) {
    lastMotion = motion;
    String msg = motion ? "MOTION:1" : "MOTION:0";
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.println(msg);
  }

  // Check gas sensor
  bool gas = digitalRead(GAS_PIN);
  if (gas != lastGas && deviceConnected) {
    lastGas = gas;
    String msg = gas ? "GAS:1" : "GAS:0";
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.println(msg);
  }

  // Check rain sensor
  bool rain = digitalRead(RAIN_PIN);
  if (rain != lastRain && deviceConnected) {
    lastRain = rain;
    String msg = rain ? "RAIN:1" : "RAIN:0";
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.println(msg);
  }
}
