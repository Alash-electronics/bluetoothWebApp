/*
 * ESP32 BLE Smart Home Control Example with Multi-Room Support
 *
 * This sketch demonstrates home automation control using ESP32's built-in BLE.
 * Compatible with the Smart Home panel in the web app.
 *
 * MULTI-ROOM SUPPORT:
 * - Supports up to 6 rooms (configurable pin arrays below)
 * - App sends room number (1-6) when switching rooms
 * - All commands (L/l, W/w, etc.) apply to current active room
 *
 * HOW TO CONFIGURE:
 * 1. Edit the pin arrays below for each room's devices
 * 2. Connect relays/LEDs to the specified pins
 * 3. Connect sensors (shared across all rooms or separate per room)
 * 4. Upload to ESP32 and connect from the app
 *
 * EXAMPLE SETUP (Room 1):
 * LEDs / Relays:
 *   LED (Light)    -> GPIO 2  (built-in LED)
 *   Window Relay   -> GPIO 4
 *   Music Relay    -> GPIO 5
 *   Door Lock      -> GPIO 18
 *   Fan Relay      -> GPIO 19
 *   AC Relay       -> GPIO 21
 *
 * Sensors (shared for all rooms):
 *   Motion Sensor  -> GPIO 34 (input only)
 *   Gas Sensor     -> GPIO 35 (input only)
 *   Rain Sensor    -> GPIO 32
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ===== MULTI-ROOM CONFIGURATION =====
// Current active room (1-6)
int currentRoom = 1;

// Pin arrays for each room (6 rooms max)
// Format: {LED, Window, Music, Door, Fan, AC}
const int roomPins[6][6] = {
  // Room 1
  {2, 4, 5, 18, 19, 21},
  // Room 2 (configure your pins here)
  {12, 13, 14, 25, 26, 27},
  // Room 3 (configure your pins here)
  {15, 16, 17, 22, 23, 33},
  // Room 4 (configure your pins here)
  {2, 4, 5, 18, 19, 21},  // Example: same as Room 1
  // Room 5 (configure your pins here)
  {2, 4, 5, 18, 19, 21},  // Example: same as Room 1
  // Room 6 (configure your pins here)
  {2, 4, 5, 18, 19, 21},  // Example: same as Room 1
};

// Pin indices
#define PIN_LED    0
#define PIN_WINDOW 1
#define PIN_MUSIC  2
#define PIN_DOOR   3
#define PIN_FAN    4
#define PIN_AC     5

// Sensor pins (shared for all rooms, or configure per-room if needed)
#define MOTION_PIN   34
#define GAS_PIN      35
#define RAIN_PIN     32

// Device states per room
bool ledState[6] = {false};
bool windowState[6] = {false};
bool musicState[6] = {false};
bool doorLocked[6] = {true, true, true, true, true, true};
bool fanState[6] = {false};
bool acState[6] = {false};
int acTemp[6] = {24, 24, 24, 24, 24, 24};  // Default AC temperature per room

// UUIDs for HM-10 compatible UART service
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
unsigned long lastSensorCheck = 0;

// Forward declarations
void handleCommand(char cmd);
void checkSensors();

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

  // Setup device pins for ALL rooms
  for (int room = 0; room < 6; room++) {
    pinMode(roomPins[room][PIN_LED], OUTPUT);
    pinMode(roomPins[room][PIN_WINDOW], OUTPUT);
    pinMode(roomPins[room][PIN_MUSIC], OUTPUT);
    pinMode(roomPins[room][PIN_DOOR], OUTPUT);
    pinMode(roomPins[room][PIN_FAN], OUTPUT);
    pinMode(roomPins[room][PIN_AC], OUTPUT);

    // Initial states (all OFF, doors LOCKED)
    digitalWrite(roomPins[room][PIN_LED], LOW);
    digitalWrite(roomPins[room][PIN_WINDOW], LOW);
    digitalWrite(roomPins[room][PIN_MUSIC], LOW);
    digitalWrite(roomPins[room][PIN_DOOR], HIGH);  // Door locked
    digitalWrite(roomPins[room][PIN_FAN], LOW);
    digitalWrite(roomPins[room][PIN_AC], LOW);
  }

  // Setup sensor pins
  pinMode(MOTION_PIN, INPUT);
  pinMode(GAS_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);

  Serial.println("ESP32 BLE Smart Home (Multi-Room) Starting...");
  Serial.println("Configured for 6 rooms");

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

  Serial.println("Smart Home Ready! Waiting for connection...");
  Serial.print("Default room: ");
  Serial.println(currentRoom);
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
  int room = currentRoom - 1;  // Convert to 0-indexed array

  switch(cmd) {
    // Room selection (1-6)
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      currentRoom = cmd - '0';  // Convert char to int
      Serial.print("Switched to Room ");
      Serial.println(currentRoom);
      break;

    // LED control
    case 'L':  // LED ON
      ledState[room] = true;
      digitalWrite(roomPins[room][PIN_LED], HIGH);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": LED ON");
      break;

    case 'l':  // LED OFF
      ledState[room] = false;
      digitalWrite(roomPins[room][PIN_LED], LOW);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": LED OFF");
      break;

    // Window control
    case 'W':  // Window OPEN
      windowState[room] = true;
      digitalWrite(roomPins[room][PIN_WINDOW], HIGH);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Window OPEN");
      break;

    case 'w':  // Window CLOSE
      windowState[room] = false;
      digitalWrite(roomPins[room][PIN_WINDOW], LOW);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Window CLOSE");
      break;

    // Music control
    case 'M':  // Music ON
      musicState[room] = true;
      digitalWrite(roomPins[room][PIN_MUSIC], HIGH);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Music PLAY");
      break;

    case 'm':  // Music OFF
      musicState[room] = false;
      digitalWrite(roomPins[room][PIN_MUSIC], LOW);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Music STOP");
      break;

    // Door control
    case 'D':  // Door UNLOCK
      doorLocked[room] = false;
      digitalWrite(roomPins[room][PIN_DOOR], LOW);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Door UNLOCKED");
      break;

    case 'd':  // Door LOCK
      doorLocked[room] = true;
      digitalWrite(roomPins[room][PIN_DOOR], HIGH);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Door LOCKED");
      break;

    // Fan control
    case 'F':  // Fan ON
      fanState[room] = true;
      digitalWrite(roomPins[room][PIN_FAN], HIGH);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Fan ON");
      break;

    case 'f':  // Fan OFF
      fanState[room] = false;
      digitalWrite(roomPins[room][PIN_FAN], LOW);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": Fan OFF");
      break;

    // AC control
    case 'K':  // AC ON
      acState[room] = true;
      digitalWrite(roomPins[room][PIN_AC], HIGH);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC ON");
      break;

    case 'k':  // AC OFF
      acState[room] = false;
      digitalWrite(roomPins[room][PIN_AC], LOW);
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC OFF");
      break;

    case 'H':  // AC Heat mode
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC Heat Mode");
      break;

    case 'C':  // AC Cool mode
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC Cool Mode");
      break;

    case 'Y':  // AC Dry mode
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC Dry Mode");
      break;

    case 'N':  // AC Fan mode
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC Fan Mode");
      break;

    case 'Z':  // Temperature UP
      if (acTemp[room] < 30) {
        acTemp[room]++;
        Serial.print("Room ");
        Serial.print(currentRoom);
        Serial.print(": AC Temp: ");
        Serial.println(acTemp[room]);
      }
      break;

    case 'V':  // Temperature DOWN
      if (acTemp[room] > 16) {
        acTemp[room]--;
        Serial.print("Room ");
        Serial.print(currentRoom);
        Serial.print(": AC Temp: ");
        Serial.println(acTemp[room]);
      }
      break;

    // Temperature set (T16-T30)
    case 'T':
      // Next bytes would be temperature value
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.println(": AC Temp Set");
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
    String msg = motion ? "P" : "p";  // P = motion detected, p = no motion
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.print("Motion: ");
    Serial.println(msg);
  }

  // Check gas sensor
  bool gas = digitalRead(GAS_PIN);
  if (gas != lastGas && deviceConnected) {
    lastGas = gas;
    String msg = gas ? "G" : "g";  // G = gas detected, g = no gas
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.print("Gas: ");
    Serial.println(msg);
  }

  // Check rain sensor
  bool rain = digitalRead(RAIN_PIN);
  if (rain != lastRain && deviceConnected) {
    lastRain = rain;
    String msg = rain ? "R" : "r";  // R = rain detected, r = no rain
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.print("Rain: ");
    Serial.println(msg);
  }
}
