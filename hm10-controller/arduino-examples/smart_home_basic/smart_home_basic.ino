/*
 * HM-10 Smart Home Basic Example
 *
 * This sketch demonstrates smart home control using the Smart Home Panel mode.
 * Controls LEDs, reads sensors, and manages device states.
 *
 * Hardware connections:
 * HM-10 TX -> Arduino Pin 10 (RX)
 * HM-10 RX -> Arduino Pin 11 (TX) via voltage divider
 *
 * Device Pins:
 * LED (Light) -> Pin 2
 * Window Motor -> Pins 3, 4
 * Music/Buzzer -> Pin 5
 * Door Lock -> Pin 6
 * Fan -> Pin 7
 * AC Relay -> Pin 8
 *
 * Sensor Pins:
 * Motion Sensor -> Pin A0
 * Gas Sensor -> Pin A1
 * Rain Sensor -> Pin A2
 */

#include <SoftwareSerial.h>

// HM-10 pins
#define BT_RX 10
#define BT_TX 11

// Device pins
#define LED_PIN 2
#define WINDOW_PIN1 3
#define WINDOW_PIN2 4
#define MUSIC_PIN 5
#define DOOR_PIN 6
#define FAN_PIN 7
#define AC_PIN 8

// Sensor pins
#define MOTION_PIN A0
#define GAS_PIN A1
#define RAIN_PIN A2

// AC settings
int acTemp = 24;
bool acOn = false;
String acMode = "cool";

SoftwareSerial bluetooth(BT_RX, BT_TX);

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);

  // Configure device pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(WINDOW_PIN1, OUTPUT);
  pinMode(WINDOW_PIN2, OUTPUT);
  pinMode(MUSIC_PIN, OUTPUT);
  pinMode(DOOR_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(AC_PIN, OUTPUT);

  // Configure sensor pins
  pinMode(MOTION_PIN, INPUT);
  pinMode(GAS_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);

  // Initialize all devices to OFF
  turnOffAllDevices();

  Serial.println("Smart Home Control Ready");
  bluetooth.println("Smart Home System Online");
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
  Serial.print("Command: ");
  Serial.println(cmd);

  // LED control (default: L=on, l=off)
  if (cmd == "L") {
    digitalWrite(LED_PIN, HIGH);
    bluetooth.println("LED ON");
  }
  else if (cmd == "l") {
    digitalWrite(LED_PIN, LOW);
    bluetooth.println("LED OFF");
  }

  // Window control (default: W=on, w=off)
  else if (cmd == "W") {
    digitalWrite(WINDOW_PIN1, HIGH);
    digitalWrite(WINDOW_PIN2, LOW);
    delay(1000);
    digitalWrite(WINDOW_PIN1, LOW);
    bluetooth.println("Window Open");
  }
  else if (cmd == "w") {
    digitalWrite(WINDOW_PIN1, LOW);
    digitalWrite(WINDOW_PIN2, HIGH);
    delay(1000);
    digitalWrite(WINDOW_PIN2, LOW);
    bluetooth.println("Window Closed");
  }

  // Music control (default: M=on, m=off)
  else if (cmd == "M") {
    digitalWrite(MUSIC_PIN, HIGH);
    bluetooth.println("Music ON");
  }
  else if (cmd == "m") {
    digitalWrite(MUSIC_PIN, LOW);
    bluetooth.println("Music OFF");
  }

  // Door control (default: D=on, d=off)
  else if (cmd == "D") {
    digitalWrite(DOOR_PIN, HIGH);
    bluetooth.println("Door Unlocked");
  }
  else if (cmd == "d") {
    digitalWrite(DOOR_PIN, LOW);
    bluetooth.println("Door Locked");
  }

  // Fan control (default: F=on, f=off)
  else if (cmd == "F") {
    digitalWrite(FAN_PIN, HIGH);
    bluetooth.println("Fan ON");
  }
  else if (cmd == "f") {
    digitalWrite(FAN_PIN, LOW);
    bluetooth.println("Fan OFF");
  }

  // AC control (default: K=on, L=off)
  else if (cmd == "K") {
    acOn = true;
    digitalWrite(AC_PIN, HIGH);
    bluetooth.print("AC ON - ");
    bluetooth.print(acTemp);
    bluetooth.println("°C");
  }
  else if (cmd == "L") {
    acOn = false;
    digitalWrite(AC_PIN, LOW);
    bluetooth.println("AC OFF");
  }

  // AC mode control
  else if (cmd == "H") {
    acMode = "heat";
    bluetooth.println("AC Mode: Heat");
  }
  else if (cmd == "C") {
    acMode = "cool";
    bluetooth.println("AC Mode: Cool");
  }
  else if (cmd == "Y") {
    acMode = "dry";
    bluetooth.println("AC Mode: Dry");
  }
  else if (cmd == "N") {
    acMode = "fan";
    bluetooth.println("AC Mode: Fan");
  }

  // AC temperature control
  else if (cmd == "Z") {  // Temp up
    if (acTemp < 30) {
      acTemp++;
      bluetooth.print("Temperature: ");
      bluetooth.print(acTemp);
      bluetooth.println("°C");
    }
  }
  else if (cmd == "V") {  // Temp down
    if (acTemp > 16) {
      acTemp--;
      bluetooth.print("Temperature: ");
      bluetooth.print(acTemp);
      bluetooth.println("°C");
    }
  }

  // Temperature set command (e.g., "T24" sets to 24°C)
  else if (cmd.startsWith("T")) {
    String tempStr = cmd.substring(1);
    int newTemp = tempStr.toInt();
    if (newTemp >= 16 && newTemp <= 30) {
      acTemp = newTemp;
      bluetooth.print("Temperature set to ");
      bluetooth.print(acTemp);
      bluetooth.println("°C");
    }
  }

  else {
    bluetooth.print("Unknown command: ");
    bluetooth.println(cmd);
  }
}

void checkSensors() {
  // Motion sensor
  int motion = digitalRead(MOTION_PIN);
  if (motion == HIGH) {
    bluetooth.println("SENSOR:MOTION:1");
  }

  // Gas sensor
  int gas = analogRead(GAS_PIN);
  if (gas > 500) {  // Threshold
    bluetooth.println("SENSOR:GAS:1");
    bluetooth.println("WARNING: Gas detected!");
  }

  // Rain sensor
  int rain = analogRead(RAIN_PIN);
  if (rain > 500) {  // Threshold
    bluetooth.println("SENSOR:RAIN:1");
  }
}

void turnOffAllDevices() {
  digitalWrite(LED_PIN, LOW);
  digitalWrite(WINDOW_PIN1, LOW);
  digitalWrite(WINDOW_PIN2, LOW);
  digitalWrite(MUSIC_PIN, LOW);
  digitalWrite(DOOR_PIN, LOW);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(AC_PIN, LOW);
}
