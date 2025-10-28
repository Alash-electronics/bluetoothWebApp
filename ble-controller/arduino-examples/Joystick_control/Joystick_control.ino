#include <SoftwareSerial.h>
#include <AlashMotorControlLite.h>

// Bluetooth пины
#define BT_RX_PIN 10
#define BT_TX_PIN 11

// Моторы (НЕ МЕНЯТЬ!)
const uint8_t MOTOR_L_IN3 = 8;
const uint8_t MOTOR_L_IN4 = 12;
const uint8_t MOTOR_L_ENB = 6;
const uint8_t MOTOR_R_IN1 = 4;
const uint8_t MOTOR_R_IN2 = 2;
const uint8_t MOTOR_R_ENA = 5;

AlashMotorControlLite motorLeft(DIR_DIR_PWM, MOTOR_L_IN3, MOTOR_L_IN4, MOTOR_L_ENB);
AlashMotorControlLite motorRight(DIR_DIR_PWM, MOTOR_R_IN1, MOTOR_R_IN2, MOTOR_R_ENA);
SoftwareSerial bluetooth(BT_RX_PIN, BT_TX_PIN);

// Данные джойстиков
int LY = 50, LX = 50, RY = 50, RX = 50;
int leftSpeed = 0, rightSpeed = 0;

void setup() {
  Serial.begin(115200);
  bluetooth.begin(9600);
  
  motorLeft.stop();
  motorRight.stop();
  
  Serial.println("=== DEBUG MODE ===");
  Serial.println("Show me what happens when you:");
  Serial.println("1. Move joystick forward");
  Serial.println("2. Release joystick");
  Serial.println("==================");
}

void loop() {
  if (bluetooth.available()) {
    String cmd = bluetooth.readStringUntil('\n');
    
    // Показываем ВСЁ что приходит
    Serial.print("RAW: [");
    Serial.print(cmd);
    Serial.println("]");
    
    // Проверяем команду джойстика
    if (cmd.startsWith("J:")) {
      String data = cmd.substring(2);
      Serial.print("JOYSTICK DATA: [");
      Serial.print(data);
      Serial.println("]");
      
      // Парсим значения
      int values[4];
      int index = 0;
      int start = 0;
      
      for (int i = 0; i <= data.length(); i++) {
        if (i == data.length() || data[i] == ',') {
          if (index < 4) {
            String val = data.substring(start, i);
            values[index] = val.toInt();
            Serial.print("Value ");
            Serial.print(index);
            Serial.print(": [");
            Serial.print(val);
            Serial.print("] = ");
            Serial.println(values[index]);
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
        
        // Управление
        int throttle = LY - 50;
        int steering = LX - 50;
        
        Serial.print("CONTROL: throttle=");
        Serial.print(throttle);
        Serial.print(" steering=");
        Serial.println(steering);
        
        // С минимальной deadzone для теста
        if (abs(throttle) < 3) throttle = 0;
        if (abs(steering) < 3) steering = 0;
        
        // Расчет скоростей
        if (throttle == 0 && steering == 0) {
          Serial.println(">>> SHOULD STOP!");
          leftSpeed = 0;
          rightSpeed = 0;
        } else {
          int base = map(abs(throttle), 0, 50, 0, 200);
          if (throttle > 0) {
            leftSpeed = -base;
            rightSpeed = -base;
          } else if (throttle < 0) {
            leftSpeed = base;
            rightSpeed = base;
          }
          Serial.print(">>> SHOULD MOVE: L=");
          Serial.print(leftSpeed);
          Serial.print(" R=");
          Serial.println(rightSpeed);
        }
        
        // Применяем к моторам
        if (leftSpeed == 0 && rightSpeed == 0) {
          motorLeft.stop();
          motorRight.stop();
          Serial.println("*** MOTORS STOPPED ***");
        } else {
          motorLeft.setSpeed(leftSpeed);
          motorRight.setSpeed(rightSpeed);
          Serial.println("*** MOTORS RUNNING ***");
        }
      } else {
        Serial.print("ERROR: Got ");
        Serial.print(index);
        Serial.println(" values instead of 4");
      }
    }
    
    Serial.println("-------------------");
  }
}