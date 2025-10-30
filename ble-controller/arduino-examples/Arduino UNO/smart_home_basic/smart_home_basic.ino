/*
 * HM-10 Smart Home Multi-Room Example (Arduino Uno - 2 Rooms)
 *
 * This sketch demonstrates smart home control with MULTI-ROOM support.
 * Compatible with the Smart Home panel in the web app.
 *
 * HARDWARE REQUIREMENTS:
 * - Arduino Uno: Supports 2 rooms (limited pins)
 * - Arduino MEGA: For 6 rooms, see separate MEGA version in this folder
 *
 * MULTI-ROOM SUPPORT:
 * - Supports 2 rooms on Arduino Uno
 * - App sends room number (1-2) when switching rooms
 * - All commands (L/l, W/w, etc.) apply to current active room
 *
 * HOW TO CONFIGURE:
 * 1. Edit the pin arrays below for each room's devices
 * 2. Connect relays/LEDs to the specified pins
 * 3. Connect sensors (shared across all rooms)
 * 4. Upload to Arduino and connect from the app
 *
 * Hardware connections:
 * HM-10 TX -> Arduino Pin 10 (RX)
 * HM-10 RX -> Arduino Pin 11 (TX) via voltage divider
 *
 * Room 1 Setup:
 * LEDs / Relays:
 *   LED (Light)    -> Pin 2
 *   Window Relay   -> Pin 3
 *   Music Relay    -> Pin 4
 *   Door Lock      -> Pin 5
 *   Fan Relay      -> Pin 6
 *   AC Relay       -> Pin 7
 *
 * Room 2 Setup:
 * LEDs / Relays:
 *   LED (Light)    -> Pin 8
 *   Window Relay   -> Pin 9
 *   Music Relay    -> Pin 12
 *   Door Lock      -> Pin 13
 *   Fan Relay      -> Pin A3
 *   AC Relay       -> Pin A4
 *
 * Sensor Pins (shared for all rooms):
 *   Motion Sensor  -> Pin A0
 *   Gas Sensor     -> Pin A1
 *   Rain Sensor    -> Pin A2
 *
 * NOTE: For 6 rooms, use Arduino MEGA 2560 (70 digital pins available)
 */

#include <SoftwareSerial.h>

// HM-10 pins
#define BT_RX 10
#define BT_TX 11

// ===== MULTI-ROOM CONFIGURATION =====
// Current active room (1-2 for Arduino Uno)
int currentRoom = 1;

// Pin arrays for each room (2 rooms for Arduino Uno)
// Format: {LED, Window, Music, Door, Fan, AC}
const int roomPins[2][6] = {
  // Room 1
  {2, 3, 4, 5, 6, 7},
  // Room 2
  {8, 9, 12, 13, A3, A4},
};

// Pin indices
#define PIN_LED    0
#define PIN_WINDOW 1
#define PIN_MUSIC  2
#define PIN_DOOR   3
#define PIN_FAN    4
#define PIN_AC     5

// Sensor pins (shared for all rooms)
#define MOTION_PIN A0
#define GAS_PIN A1
#define RAIN_PIN A2

// Device states per room (2 rooms)
bool ledState[2] = {false};
bool windowState[2] = {false};
bool musicState[2] = {false};
bool doorLocked[2] = {true, true};
bool fanState[2] = {false};
bool acState[2] = {false};
int acTemp[2] = {24, 24};  // Default AC temperature per room

SoftwareSerial bluetooth(BT_RX, BT_TX);

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);

  // Setup device pins for 2 rooms
  for (int room = 0; room < 2; room++) {
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

  Serial.println("HM-10 Smart Home (Uno - 2 Rooms) Ready");
  Serial.println("For 6 rooms, use Arduino MEGA");
  bluetooth.println("Smart Home Online");
  bluetooth.println("2 Rooms Ready");
}

void loop() {
  // Check for commands
  if (bluetooth.available()) {
    String command = "";
    while (bluetooth.available()) {
      char c = bluetooth.read();
      command += c;
      delay(5);
    }
    command.trim();
    handleCommand(command);
  }

  // Monitor sensors (send updates every 2 seconds)
  static unsigned long lastSensorCheck = 0;
  if (millis() - lastSensorCheck > 2000) {
    checkSensors();
    lastSensorCheck = millis();
  }
}

void handleCommand(String cmd) {
  int room = currentRoom - 1;  // Convert to 0-indexed array

  Serial.print("Command: ");
  Serial.println(cmd);

  // Room selection (1-2 for Arduino Uno)
  if (cmd == "1" || cmd == "2") {
    currentRoom = cmd.toInt();
    Serial.print("Switched to Room ");
    Serial.println(currentRoom);
    bluetooth.print("Room ");
    bluetooth.println(currentRoom);
    return;
  }

  // Ignore room 3-6 commands (not supported on Uno)
  if (cmd == "3" || cmd == "4" || cmd == "5" || cmd == "6") {
    Serial.println("Room 3-6: Use Arduino MEGA");
    bluetooth.println("Use MEGA for 6 rooms");
    return;
  }

  // LED control
  if (cmd == "L") {
    ledState[room] = true;
    digitalWrite(roomPins[room][PIN_LED], HIGH);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": LED ON");
    bluetooth.println("LED ON");
  }
  else if (cmd == "l") {
    ledState[room] = false;
    digitalWrite(roomPins[room][PIN_LED], LOW);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": LED OFF");
    bluetooth.println("LED OFF");
  }

  // Window control
  else if (cmd == "W") {
    windowState[room] = true;
    digitalWrite(roomPins[room][PIN_WINDOW], HIGH);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Window OPEN");
    bluetooth.println("Window Open");
  }
  else if (cmd == "w") {
    windowState[room] = false;
    digitalWrite(roomPins[room][PIN_WINDOW], LOW);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Window CLOSE");
    bluetooth.println("Window Closed");
  }

  // Music control
  else if (cmd == "M") {
    musicState[room] = true;
    digitalWrite(roomPins[room][PIN_MUSIC], HIGH);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Music PLAY");
    bluetooth.println("Music ON");
  }
  else if (cmd == "m") {
    musicState[room] = false;
    digitalWrite(roomPins[room][PIN_MUSIC], LOW);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Music STOP");
    bluetooth.println("Music OFF");
  }

  // Door control
  else if (cmd == "D") {
    doorLocked[room] = false;
    digitalWrite(roomPins[room][PIN_DOOR], LOW);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Door UNLOCKED");
    bluetooth.println("Door Unlocked");
  }
  else if (cmd == "d") {
    doorLocked[room] = true;
    digitalWrite(roomPins[room][PIN_DOOR], HIGH);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Door LOCKED");
    bluetooth.println("Door Locked");
  }

  // Fan control
  else if (cmd == "F") {
    fanState[room] = true;
    digitalWrite(roomPins[room][PIN_FAN], HIGH);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Fan ON");
    bluetooth.println("Fan ON");
  }
  else if (cmd == "f") {
    fanState[room] = false;
    digitalWrite(roomPins[room][PIN_FAN], LOW);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": Fan OFF");
    bluetooth.println("Fan OFF");
  }

  // AC control
  else if (cmd == "K") {
    acState[room] = true;
    digitalWrite(roomPins[room][PIN_AC], HIGH);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": AC ON");
    bluetooth.print("AC ON - ");
    bluetooth.print(acTemp[room]);
    bluetooth.println("°C");
  }
  else if (cmd == "k") {
    acState[room] = false;
    digitalWrite(roomPins[room][PIN_AC], LOW);
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": AC OFF");
    bluetooth.println("AC OFF");
  }

  // AC mode control
  else if (cmd == "H") {
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": AC Heat Mode");
    bluetooth.println("AC Mode: Heat");
  }
  else if (cmd == "C") {
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": AC Cool Mode");
    bluetooth.println("AC Mode: Cool");
  }
  else if (cmd == "Y") {
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": AC Dry Mode");
    bluetooth.println("AC Mode: Dry");
  }
  else if (cmd == "N") {
    Serial.print("Room ");
    Serial.print(currentRoom);
    Serial.println(": AC Fan Mode");
    bluetooth.println("AC Mode: Fan");
  }

  // AC temperature control
  else if (cmd == "Z") {  // Temp up
    if (acTemp[room] < 30) {
      acTemp[room]++;
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.print(": AC Temp: ");
      Serial.println(acTemp[room]);
      bluetooth.print("Temperature: ");
      bluetooth.print(acTemp[room]);
      bluetooth.println("°C");
    }
  }
  else if (cmd == "V") {  // Temp down
    if (acTemp[room] > 16) {
      acTemp[room]--;
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.print(": AC Temp: ");
      Serial.println(acTemp[room]);
      bluetooth.print("Temperature: ");
      bluetooth.print(acTemp[room]);
      bluetooth.println("°C");
    }
  }

  // Temperature set command (e.g., "T24" sets to 24°C)
  else if (cmd.startsWith("T")) {
    String tempStr = cmd.substring(1);
    int newTemp = tempStr.toInt();
    if (newTemp >= 16 && newTemp <= 30) {
      acTemp[room] = newTemp;
      Serial.print("Room ");
      Serial.print(currentRoom);
      Serial.print(": AC Temp Set: ");
      Serial.println(acTemp[room]);
      bluetooth.print("Temperature set to ");
      bluetooth.print(acTemp[room]);
      bluetooth.println("°C");
    }
  }

  else {
    Serial.print("Unknown command: ");
    Serial.println(cmd);
    bluetooth.print("Unknown: ");
    bluetooth.println(cmd);
  }
}

void checkSensors() {
  static bool lastMotion = false;
  static bool lastGas = false;
  static bool lastRain = false;

  // Motion sensor
  bool motion = digitalRead(MOTION_PIN);
  if (motion != lastMotion) {
    lastMotion = motion;
    if (motion) {
      bluetooth.println("P");  // P = motion detected
      Serial.println("Motion detected");
    } else {
      bluetooth.println("p");  // p = no motion
      Serial.println("No motion");
    }
  }

  // Gas sensor
  int gasValue = analogRead(GAS_PIN);
  bool gas = (gasValue > 500);
  if (gas != lastGas) {
    lastGas = gas;
    if (gas) {
      bluetooth.println("G");  // G = gas detected
      Serial.println("Gas detected!");
    } else {
      bluetooth.println("g");  // g = no gas
      Serial.println("Gas OK");
    }
  }

  // Rain sensor
  int rainValue = analogRead(RAIN_PIN);
  bool rain = (rainValue > 500);
  if (rain != lastRain) {
    lastRain = rain;
    if (rain) {
      bluetooth.println("R");  // R = rain detected
      Serial.println("Rain detected");
    } else {
      bluetooth.println("r");  // r = no rain
      Serial.println("No rain");
    }
  }
}
