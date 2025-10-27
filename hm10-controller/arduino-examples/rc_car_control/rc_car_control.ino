/*
 * HM-10 RC Car Control Example
 *
 * This sketch demonstrates motor control for an RC car using the Control Panel mode.
 * Default commands match the web app's Control Panel button configuration.
 *
 * Hardware connections:
 * HM-10 TX -> Arduino Pin 10 (RX)
 * HM-10 RX -> Arduino Pin 11 (TX) via voltage divider
 * L298N or similar motor driver
 *
 * Motor Driver Connections:
 * IN1 -> Pin 5
 * IN2 -> Pin 6
 * IN3 -> Pin 9
 * IN4 -> Pin 3
 * ENA -> Pin 7 (PWM)
 * ENB -> Pin 8 (PWM)
 */

#include <SoftwareSerial.h>

// HM-10 pins
#define BT_RX 10
#define BT_TX 11

// Motor pins
#define MOTOR_LEFT_IN1 5
#define MOTOR_LEFT_IN2 6
#define MOTOR_RIGHT_IN1 9
#define MOTOR_RIGHT_IN2 3
#define MOTOR_LEFT_EN 7
#define MOTOR_RIGHT_EN 8

// Speed settings
#define NORMAL_SPEED 200
#define TURN_SPEED 150

SoftwareSerial bluetooth(BT_RX, BT_TX);

void setup() {
  Serial.begin(9600);
  bluetooth.begin(9600);

  // Configure motor pins
  pinMode(MOTOR_LEFT_IN1, OUTPUT);
  pinMode(MOTOR_LEFT_IN2, OUTPUT);
  pinMode(MOTOR_RIGHT_IN1, OUTPUT);
  pinMode(MOTOR_RIGHT_IN2, OUTPUT);
  pinMode(MOTOR_LEFT_EN, OUTPUT);
  pinMode(MOTOR_RIGHT_EN, OUTPUT);

  // LED for status
  pinMode(LED_BUILTIN, OUTPUT);

  stopMotors();
  Serial.println("RC Car Control Ready");
}

void loop() {
  if (bluetooth.available()) {
    char command = bluetooth.read();
    Serial.print("Command: ");
    Serial.println(command);
    handleCommand(command);
  }
}

void handleCommand(char cmd) {
  switch(cmd) {
    // WASD controls (left buttons)
    case 'W':
    case 'w':
      moveForward();
      break;

    case 'A':
    case 'a':
      turnLeft();
      break;

    case 'S':
    case 's':
      moveBackward();
      break;

    case 'D':
    case 'd':
      turnRight();
      break;

    // Arrow keys (right joystick)
    case 'U':  // Up
      moveForward();
      break;

    case 'L':  // Left
      turnLeft();
      break;

    case 'R':  // Right
      turnRight();
      break;

    case 'B':  // Down/Back
      moveBackward();
      break;

    // Release commands (stop)
    case 'w':
    case 'a':
    case 's':
    case 'd':
    case 'u':
    case 'l':
    case 'r':
    case 'b':
      stopMotors();
      break;

    // Button 1 - Speed boost
    case '1':
      bluetooth.println("Speed Boost ON");
      digitalWrite(LED_BUILTIN, HIGH);
      break;

    // Button 2 - Horn/Light
    case '2':
      bluetooth.println("Horn!");
      blinkLED(3);
      break;

    // Button 3 - Emergency stop
    case '3':
      stopMotors();
      bluetooth.println("Emergency Stop");
      break;

    default:
      bluetooth.print("Unknown: ");
      bluetooth.println(cmd);
      break;
  }
}

void moveForward() {
  digitalWrite(MOTOR_LEFT_IN1, HIGH);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN1, HIGH);
  digitalWrite(MOTOR_RIGHT_IN2, LOW);
  analogWrite(MOTOR_LEFT_EN, NORMAL_SPEED);
  analogWrite(MOTOR_RIGHT_EN, NORMAL_SPEED);
}

void moveBackward() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, HIGH);
  digitalWrite(MOTOR_RIGHT_IN1, LOW);
  digitalWrite(MOTOR_RIGHT_IN2, HIGH);
  analogWrite(MOTOR_LEFT_EN, NORMAL_SPEED);
  analogWrite(MOTOR_RIGHT_EN, NORMAL_SPEED);
}

void turnLeft() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, HIGH);
  digitalWrite(MOTOR_RIGHT_IN1, HIGH);
  digitalWrite(MOTOR_RIGHT_IN2, LOW);
  analogWrite(MOTOR_LEFT_EN, TURN_SPEED);
  analogWrite(MOTOR_RIGHT_EN, TURN_SPEED);
}

void turnRight() {
  digitalWrite(MOTOR_LEFT_IN1, HIGH);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN1, LOW);
  digitalWrite(MOTOR_RIGHT_IN2, HIGH);
  analogWrite(MOTOR_LEFT_EN, TURN_SPEED);
  analogWrite(MOTOR_RIGHT_EN, TURN_SPEED);
}

void stopMotors() {
  digitalWrite(MOTOR_LEFT_IN1, LOW);
  digitalWrite(MOTOR_LEFT_IN2, LOW);
  digitalWrite(MOTOR_RIGHT_IN1, LOW);
  digitalWrite(MOTOR_RIGHT_IN2, LOW);
  analogWrite(MOTOR_LEFT_EN, 0);
  analogWrite(MOTOR_RIGHT_EN, 0);
  digitalWrite(LED_BUILTIN, LOW);
}

void blinkLED(int times) {
  for(int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(100);
    digitalWrite(LED_BUILTIN, LOW);
    delay(100);
  }
}
