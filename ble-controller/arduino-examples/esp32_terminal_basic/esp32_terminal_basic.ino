/*
 * ESP32 BLE Terminal Basic Example
 *
 * This sketch demonstrates basic BLE communication with ESP32's built-in Bluetooth.
 * It receives commands from the web app and sends responses back.
 *
 * Hardware: ESP32 Dev Board (no external module needed!)
 *
 * Note: ESP32 uses BLE (Bluetooth Low Energy) which is compatible with the web app.
 * The device will appear as "BLE Controller" in the Bluetooth device list.
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// UUIDs for HM-10 compatible UART service
#define SERVICE_UUID           "0000ffe0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000ffe1-0000-1000-8000-00805f9b34fb"

BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
bool oldDeviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Client Connected");
      digitalWrite(LED_BUILTIN, HIGH);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Client Disconnected");
      digitalWrite(LED_BUILTIN, LOW);
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();

      if (rxValue.length() > 0) {
        char command = rxValue[0];

        Serial.print("Received: ");
        Serial.println(command);

        handleCommand(command);
      }
    }
};

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println("ESP32 BLE Terminal Starting...");

  // Create the BLE Device
  BLEDevice::init("BLE Controller");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_READ   |
                        BLECharacteristic::PROPERTY_WRITE  |
                        BLECharacteristic::PROPERTY_NOTIFY |
                        BLECharacteristic::PROPERTY_INDICATE
                      );

  pTxCharacteristic->addDescriptor(new BLE2902());
  pTxCharacteristic->setCallbacks(new MyCallbacks());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE Terminal Ready!");
  Serial.println("Waiting for connection...");
}

void loop() {
  // Reconnection logic
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  delay(10);
}

void handleCommand(char cmd) {
  String response;

  switch(cmd) {
    case '1':
      // Turn on LED
      digitalWrite(LED_BUILTIN, HIGH);
      response = "LED ON";
      break;

    case '2':
      // Turn off LED
      digitalWrite(LED_BUILTIN, LOW);
      response = "LED OFF";
      break;

    case '3':
      // Blink LED
      for(int i = 0; i < 5; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(100);
        digitalWrite(LED_BUILTIN, LOW);
        delay(100);
      }
      response = "BLINK DONE";
      break;

    case 'A':
    case 'a':
      response = "Command A received";
      break;

    case 'B':
    case 'b':
      response = "Command B received";
      break;

    default:
      response = "Unknown: " + String(cmd);
      break;
  }

  // Send response back via BLE
  if(deviceConnected) {
    pTxCharacteristic->setValue(response.c_str());
    pTxCharacteristic->notify();
    Serial.println("Sent: " + response);
  }
}
