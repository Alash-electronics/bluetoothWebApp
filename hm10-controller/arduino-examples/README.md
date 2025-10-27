# Arduino Examples for HM-10 Controller

This folder contains Arduino example sketches for working with the HM-10 Bluetooth Controller web app.

## Hardware Requirements

- Arduino board (Uno, Nano, Mega, ESP32, etc.)
- HM-10 Bluetooth Low Energy module
- LEDs, motors, or other components depending on the example

## HM-10 Connections

| HM-10 Pin | Arduino Pin |
|-----------|-------------|
| VCC       | 5V (or 3.3V for some boards) |
| GND       | GND |
| TXD       | RX (pin 10 in SoftwareSerial examples) |
| RXD       | TX (pin 11 in SoftwareSerial examples) |

**Note:** For 5V Arduino boards, use a voltage divider (1kΩ + 2kΩ resistors) on the RXD line to protect the HM-10 module.

## Available Examples

### 1. Basic Terminal (`terminal_basic/`)
Simple echo example that receives commands and sends responses back.

### 2. RC Car Control (`rc_car_control/`)
Control example with WASD movement commands and additional buttons.

### 3. Smart Home Control (`smart_home_basic/`)
Example for controlling home devices (LEDs, relays, sensors).

## How to Use

1. Open the desired example in Arduino IDE
2. Connect HM-10 module to your Arduino board
3. Upload the sketch
4. Open the HM-10 Controller web app
5. Connect to your HM-10 device
6. Start sending commands!

## Command Protocol

The web app sends single-character commands (A-Z, a-z, 0-9). Each example implements its own command set.

## Troubleshooting

- **Can't find device:** Make sure HM-10 is powered and name starts with "HM" or "BT"
- **No response:** Check baud rate (default 9600) and wiring
- **Garbled text:** Verify TX/RX aren't swapped
