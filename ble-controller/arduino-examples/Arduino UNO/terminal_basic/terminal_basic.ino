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
    // Read complete command string (e.g., "M1", "M2", "1", "A", etc.)
    String command = "";
    while (bluetooth.available()) {
      char c = bluetooth.read();

      // Ignore newline and carriage return characters
      if (c == '\n' || c == '\r') {
        break;
      }

      command += c;
      delay(5);  // Small delay to receive complete command
    }

    // Skip empty commands
    if (command.length() == 0) {
      return;
    }

    // Echo to Serial Monitor
    Serial.print("Received: ");
    Serial.println(command);

    // Process command
    handleCommand(command);
  }

  // Note: Serial Monitor echo removed to prevent garbage characters
  // If you need to test via Serial Monitor, uncomment below:
  // if (Serial.available()) {
  //   char c = Serial.read();
  //   bluetooth.write(c);
  // }
}

void handleCommand(String cmd) {
  // Single character commands
  if (cmd == "1") {
    // Turn on LED
    digitalWrite(LED_BUILTIN, HIGH);
    bluetooth.println("LED ON");
  }
  else if (cmd == "2") {
    // Turn off LED
    digitalWrite(LED_BUILTIN, LOW);
    bluetooth.println("LED OFF");
  }
  else if (cmd == "3") {
    // Blink LED
    for(int i = 0; i < 5; i++) {
      digitalWrite(LED_BUILTIN, HIGH);
      delay(100);
      digitalWrite(LED_BUILTIN, LOW);
      delay(100);
    }
    bluetooth.println("BLINK DONE");
  }
  else if (cmd == "A" || cmd == "a") {
    bluetooth.println("Command A received");
  }
  else if (cmd == "B" || cmd == "b") {
    bluetooth.println("Command B received");
  }

  // Multi-character commands (M1-M6)
  else if (cmd == "M1") {
    bluetooth.println("Mode 1 activated");
  }
  else if (cmd == "M2") {
    bluetooth.println("Mode 2 activated");
  }
  else if (cmd == "M3") {
    bluetooth.println("Mode 3 activated");
  }
  else if (cmd == "M4") {
    bluetooth.println("Mode 4 activated");
  }
  else if (cmd == "M5") {
    bluetooth.println("Mode 5 activated");
  }
  else if (cmd == "M6") {
    bluetooth.println("Mode 6 activated");
  }

  else {
    // Echo unknown command
    bluetooth.print("Unknown echo: ");
    bluetooth.println(cmd);
  }
}
