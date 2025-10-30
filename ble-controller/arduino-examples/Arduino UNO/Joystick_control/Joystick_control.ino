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
        
        // Векторное управление двумя джойстиками
        // Левый джойстик Y (LY) → throttle (вперед/назад)
        // Правый джойстик X (RX) → steering (поворот)

        int throttle = LY - 50;  // Левый Y: -50..50
        int steering = RX - 50;  // Правый X: -50..50

        Serial.print("CONTROL RAW: throttle=");
        Serial.print(throttle);
        Serial.print(" steering=");
        Serial.println(steering);

        // Применяем deadzone
        if (abs(throttle) < 10) throttle = 0;
        if (abs(steering) < 10) steering = 0;

        Serial.print("CONTROL AFTER DEADZONE: throttle=");
        Serial.print(throttle);
        Serial.print(" steering=");
        Serial.println(steering);

        // Векторное управление с микшированием
        if (throttle == 0 && steering == 0) {
          Serial.println(">>> SHOULD STOP!");
          leftSpeed = 0;
          rightSpeed = 0;
        } else {
          // Константы для моторов (AlashMotorControlLite принимает -100..100)
          const int MIN_MOTOR_SPEED = 50;   // Минимальная скорость для движения
          const int MAX_MOTOR_SPEED = 100;  // Максимальная скорость 100%

          // Масштабируем входы с учетом MIN_MOTOR_SPEED
          float throttleF, steeringF;

          if (throttle > 0) {
            throttleF = map(throttle, 10, 50, MIN_MOTOR_SPEED, MAX_MOTOR_SPEED);
          } else if (throttle < 0) {
            throttleF = map(throttle, -50, -10, -MAX_MOTOR_SPEED, -MIN_MOTOR_SPEED);
          } else {
            throttleF = 0;
          }

          if (steering > 0) {
            steeringF = map(steering, 10, 50, MIN_MOTOR_SPEED/2, MAX_MOTOR_SPEED);
          } else if (steering < 0) {
            steeringF = map(steering, -50, -10, -MAX_MOTOR_SPEED, -MIN_MOTOR_SPEED/2);
          } else {
            steeringF = 0;
          }

          // Векторное микширование (arcade drive)
          float leftF = throttleF + steeringF;
          float rightF = throttleF - steeringF;

          // Нормализация если превышает диапазон
          float maxMagnitude = max(abs(leftF), abs(rightF));
          if (maxMagnitude > MAX_MOTOR_SPEED) {
            leftF = leftF / maxMagnitude * MAX_MOTOR_SPEED;
            rightF = rightF / maxMagnitude * MAX_MOTOR_SPEED;
          }

          leftSpeed = (int)leftF;
          rightSpeed = (int)rightF;

          // Применяем минимальный порог
          if (abs(leftSpeed) > 0 && abs(leftSpeed) < MIN_MOTOR_SPEED) {
            leftSpeed = leftSpeed > 0 ? MIN_MOTOR_SPEED : -MIN_MOTOR_SPEED;
          }
          if (abs(rightSpeed) > 0 && abs(rightSpeed) < MIN_MOTOR_SPEED) {
            rightSpeed = rightSpeed > 0 ? MIN_MOTOR_SPEED : -MIN_MOTOR_SPEED;
          }

          // Ограничиваем диапазон -100..100 (требование библиотеки)
          leftSpeed = constrain(leftSpeed, -MAX_MOTOR_SPEED, MAX_MOTOR_SPEED);
          rightSpeed = constrain(rightSpeed, -MAX_MOTOR_SPEED, MAX_MOTOR_SPEED);

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