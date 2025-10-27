/*
 * HM-10 Terminal Basic Example
 *
 * This sketch demonstrates basic communication with the HM-10 Bluetooth module.
 * It receives commands from the web app and sends responses back.
 *
 * Hardware connections:
 * HM-10 TX -> Arduino Pin 10 (RX)
 * HM-10 RX -> Arduino Pin 11 (TX) via voltage divider
 * HM-10 VCC -> 5V (or 3.3V)
 * HM-10 GND -> GND
 */

#include <SoftwareSerial.h>

// HM-10 pins
#define BT_RX 10  // Connect to HM-10 TX
#define BT_TX 11  // Connect to HM-10 RX (via voltage divider for 5V boards)

SoftwareSerial bluetooth(BT_RX, BT_TX);

void setup() {
  // Start serial communication
  Serial.begin(9600);
  bluetooth.begin(9600);

  Serial.println("HM-10 Terminal Ready");
  Serial.println("Waiting for Bluetooth connection...");

  // Built-in LED for status
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}

void loop() {
  // Check for data from HM-10
  if (bluetooth.available()) {
    char command = bluetooth.read();

    // Echo to Serial Monitor
    Serial.print("Received: ");
    Serial.println(command);

    // Process command
    handleCommand(command);
  }

  // Check for data from Serial Monitor (for testing)
  if (Serial.available()) {
    char c = Serial.read();
    bluetooth.write(c);
  }
}

void handleCommand(char cmd) {
  switch(cmd) {
    case '1':
      // Turn on LED
      digitalWrite(LED_BUILTIN, HIGH);
      bluetooth.println("LED ON");
      break;

    case '2':
      // Turn off LED
      digitalWrite(LED_BUILTIN, LOW);
      bluetooth.println("LED OFF");
      break;

    case '3':
      // Blink LED
      for(int i = 0; i < 5; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(100);
        digitalWrite(LED_BUILTIN, LOW);
        delay(100);
      }
      bluetooth.println("BLINK DONE");
      break;

    case 'A':
    case 'a':
      bluetooth.println("Command A received");
      break;

    case 'B':
    case 'b':
      bluetooth.println("Command B received");
      break;

    default:
      // Echo unknown command
      bluetooth.print("Unknown: ");
      bluetooth.println(cmd);
      break;
  }
}
