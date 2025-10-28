#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ВАЖНО: Используем HM-10 совместимые UUID (как в веб-приложении!)
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

// LED пин (обычно GPIO 2 на большинстве ESP32, можете изменить на свой)
#define LED_PIN 2

BLEServer* pServer = NULL;
BLECharacteristic* pTxCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("✅ Client Connected!");
    digitalWrite(LED_PIN, HIGH);
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("❌ Client Disconnected");
    digitalWrite(LED_PIN, LOW);
  }
};

class MyCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String rxValue = pCharacteristic->getValue().c_str();

    if (rxValue.length() > 0) {
      Serial.print("📩 Received: ");
      Serial.println(rxValue);

      // Эхо обратно
      if (deviceConnected) {
        String response = "Echo: " + rxValue;
        pTxCharacteristic->setValue(response.c_str());
        pTxCharacteristic->notify();
        Serial.print("📤 Sent back: ");
        Serial.println(response);
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n\n🚀 Starting BLE Server...");

  // Создаем BLE устройство
  // ВАЖНО: Имя должно начинаться с "BT" или "HM" для фильтра в веб-приложении
  BLEDevice::init("BT05");

  Serial.println("✓ BLE Device created: BT05");

  // Создаем BLE сервер
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  Serial.println("✓ BLE Server created");

  // Создаем BLE сервис с HM-10 UUID
  BLEService *pService = pServer->createService(SERVICE_UUID);

  Serial.print("✓ BLE Service created with UUID: ");
  Serial.println(SERVICE_UUID);

  // Создаем характеристику (TX/RX в одной)
  // ВАЖНО: Нужны все свойства: READ, WRITE, WRITE_NR (no response), NOTIFY
  pTxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_TX,
    BLECharacteristic::PROPERTY_READ   |
    BLECharacteristic::PROPERTY_WRITE  |
    BLECharacteristic::PROPERTY_WRITE_NR |
    BLECharacteristic::PROPERTY_NOTIFY |
    BLECharacteristic::PROPERTY_INDICATE
  );

  // Добавляем дескриптор для notify
  pTxCharacteristic->addDescriptor(new BLE2902());

  // Устанавливаем callback для приема данных
  pTxCharacteristic->setCallbacks(new MyCallbacks());

  Serial.print("✓ Characteristic created with UUID: ");
  Serial.println(CHARACTERISTIC_UUID_TX);

  // Запускаем сервис
  pService->start();

  Serial.println("✓ Service started");

  // Настраиваем advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // для лучшей совместимости
  pAdvertising->setMinPreferred(0x12);

  // Запускаем advertising
  BLEDevice::startAdvertising();

  Serial.println("✓ Advertising started");
  Serial.println("\n🎉 BLE Server is ready!");
  Serial.println("📱 Open web app and connect to 'BT05'");
  Serial.println("⏳ Waiting for connection...\n");
}

void loop() {
  // Переподключение после отключения
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("🔄 Restarting advertising...");
    oldDeviceConnected = deviceConnected;
  }

  // Подключение установлено
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  delay(10);
}
