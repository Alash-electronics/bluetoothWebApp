# Arduino Examples for BLE Controller

This folder contains Arduino and ESP32 example sketches for working with the BLE Controller web app.

## Hardware Options

### Option 1: Arduino + HM-10 Module
- Arduino board (Uno, Nano, Mega, etc.)
- HM-10 Bluetooth Low Energy module
- LEDs, motors, or other components depending on the example

### Option 2: ESP32 (Built-in BLE)
- ESP32 Dev Board (no external module needed!)
- Built-in Bluetooth Low Energy
- LEDs, motors, or other components depending on the example

## HM-10 Connections (for Arduino)

| HM-10 Pin | Arduino Pin |
|-----------|-------------|
| VCC       | 5V (or 3.3V for some boards) |
| GND       | GND |
| TXD       | RX (pin 10 in SoftwareSerial examples) |
| RXD       | TX (pin 11 in SoftwareSerial examples) |

**Note:** For 5V Arduino boards, use a voltage divider (1kΩ + 2kΩ resistors) on the RXD line to protect the HM-10 module.

## Available Examples

### Arduino + HM-10 Examples

#### 1. Basic Terminal (`terminal_basic/`)
Simple echo example that receives commands and sends responses back.

#### 2. RC Car Control (`rc_car_control/`)
Control example with WASD movement commands and additional buttons.

#### 3. Smart Home Control - 2 Rooms (`smart_home_basic/`)
Multi-room smart home for **Arduino Uno** (2 rooms max due to limited pins).
Controls LEDs, relays, sensors with room switching.

#### 4. Smart Home Control - 6 Rooms (`smart_home_mega/`)
Full 6-room smart home for **Arduino MEGA 2560** (70 digital pins).
Controls 36 relays (6 devices × 6 rooms) with independent states per room.

#### 5. Joystick Control (`Joystick_control/`)
PS4-style dual joystick control with **vectored arcade drive mixing**.

**Hardware Requirements:**
- Arduino Uno/Nano + HM-10 module
- 2x DC motors with motor driver (L298N or AlashMotorControlLite)
- Power supply for motors (7-12V recommended)

**Wiring:**
```
HM-10 → Arduino:
  VCC → 5V
  GND → GND
  TXD → Pin 10 (Arduino RX)
  RXD → Pin 11 (Arduino TX, через делитель напряжения!)

Motor Driver → Arduino:
  IN1 → Pin 5 (Left Motor Forward)
  IN2 → Pin 6 (Left Motor Backward)
  IN3 → Pin 9 (Right Motor Forward)
  IN4 → Pin 10 (Right Motor Backward)
```

**Protocol:**
- Format: `J:LY,LX,RY,RX\n`
- Values: 0-100 (50 = center)
- Example: `J:100,50,50,50` = Forward, `J:50,50,50,100` = Turn right

**Control Scheme:**
- **Left Joystick Y:** Throttle (forward/backward)
- **Right Joystick X:** Steering (left/right)
- Uses arcade drive mixing: `leftSpeed = throttle + steering`, `rightSpeed = throttle - steering`

**Features:**
- Deadzone: ±10 (prevents drift)
- MIN_MOTOR_SPEED: 50 (minimum speed for movement)
- MAX_MOTOR_SPEED: 100 (full speed)
- Auto-normalization if speeds exceed range
- Immediate stop when joysticks centered

### ESP32 Examples (No external module needed!)

#### 1. ESP32 Terminal (`esp32_terminal_basic/`)
Basic BLE terminal with ESP32's built-in Bluetooth. No HM-10 module required!

#### 2. ESP32 RC Car (`esp32_rc_car/`)
Complete RC car control with L298N motor driver. Uses ESP32's built-in BLE.

#### 3. ESP32 Smart Home (`esp32_smart_home/`)
Full smart home automation with devices and sensors. Uses ESP32's built-in BLE.

## How to Use

### For Arduino + HM-10:
1. Open the desired example in Arduino IDE
2. Connect HM-10 module to your Arduino board
3. Upload the sketch
4. Open the BLE Controller web app
5. Connect to your HM-10 device
6. Start sending commands!

### For ESP32:
1. Install ESP32 board support in Arduino IDE:
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs":
     `https://dl.espressif.com/dl/package_esp32_index.json`
   - Go to Tools → Board → Boards Manager
   - Search for "esp32" and install "ESP32 by Espressif Systems"

2. Open the desired ESP32 example in Arduino IDE
3. Select your ESP32 board (Tools → Board → ESP32 Dev Module)
4. Upload the sketch
5. Open the BLE Controller web app
6. Connect to your ESP32 device (will appear as "BT05", "HM-10", or "BLE Controller")
7. Start sending commands!

## Command Protocol

The web app sends commands via Bluetooth. Format depends on the control mode:

### Single-Character Commands:
**Terminal Mode:** `1` (LED ON), `2` (LED OFF), `3` (Blink), `A`/`B` (test commands)

**RC Car Mode:** `W` (Forward), `S` (Backward), `A` (Left), `D` (Right), `X` (Stop)

**Smart Home Mode:**
- Room selection: `1`-`6` (switch room, `1`-`2` for Uno, `1`-`6` for MEGA)
- Devices: `L`/`l` (LED), `W`/`w` (Window), `M`/`m` (Music), `D`/`d` (Door), `F`/`f` (Fan), `K`/`k` (AC)
- AC control: `H` (Heat), `C` (Cool), `Y` (Dry), `N` (Fan), `Z` (Temp+), `V` (Temp-), `Txx` (Set temp, e.g., `T24`)

### Multi-Character Commands:

**Joystick Mode:** `J:LY,LX,RY,RX\n`
- Format: J + colon + 4 comma-separated values (0-100) + newline
- LY = Left Joystick Y (0=down, 50=center, 100=up)
- LX = Left Joystick X (0=left, 50=center, 100=right)
- RY = Right Joystick Y (0=down, 50=center, 100=up)
- RX = Right Joystick X (0=left, 50=center, 100=right)
- Examples:
  - `J:50,50,50,50\n` - Both centered (STOP)
  - `J:100,50,50,50\n` - Left up (Forward)
  - `J:0,50,50,50\n` - Left down (Backward)
  - `J:50,50,50,100\n` - Right right (Turn right)
  - `J:50,50,50,0\n` - Right left (Turn left)
- Update rate: 20 Hz (every 50ms) while moving
- Stop command sent immediately when joysticks released

## ESP32 Advantages

✅ **No external module needed** - Built-in BLE
✅ **More GPIO pins** - Perfect for complex projects
✅ **Faster processor** - Better performance
✅ **WiFi + BLE** - Dual connectivity
✅ **Lower cost** - No need to buy HM-10 module

## Motor Control Libraries

### AlashMotorControlLite
The Joystick_control example uses the **AlashMotorControlLite** library for motor control.

**Installation:**
```bash
# Install via Arduino Library Manager or manually:
git clone https://github.com/Alash-electronics/AlashMotorControlLite
```

**Key Features:**
- Simplified API: `setSpeed(-100..100)` for percentage-based control
- Accepts percentage values, NOT PWM (0-255)
- Handles direction switching automatically
- Built-in motor stop functionality

**Critical Values:**
- `MIN_MOTOR_SPEED = 50` - Minimum speed where robot starts moving (below 50, motors don't have enough torque)
- `MAX_MOTOR_SPEED = 100` - Full speed (100%)
- Range: -100 to 100 (-100 = full reverse, 0 = stop, 100 = full forward)

**Usage Example:**
```cpp
#include <AlashMotorControlLite.h>

AlashMotorControlLite motorLeft(5, 6);   // IN1, IN2
AlashMotorControlLite motorRight(9, 10); // IN3, IN4

void loop() {
  motorLeft.setSpeed(75);   // 75% forward
  motorRight.setSpeed(-50); // 50% reverse

  // Or stop:
  motorLeft.stop();
  motorRight.stop();
}
```

**Important Notes:**
- ⚠️ Do NOT use PWM values (0-255) - library expects percentages (-100 to 100)
- ⚠️ MIN_MOTOR_SPEED=50 is the minimum for most DC motors to overcome static friction
- ⚠️ Always normalize speeds if they exceed ±100 (see Joystick_control example)
- ✅ Library handles PWM conversion internally

## Troubleshooting

### Arduino + HM-10:
- **Can't find device:** Make sure HM-10 is powered and name starts with "HM" or "BT"
- **No response:** Check baud rate (default 9600) and wiring
- **Garbled text:** Verify TX/RX aren't swapped
- **RXD voltage:** Use voltage divider (1kΩ + 2kΩ) to step down 5V to 3.3V for HM-10 RXD pin

### ESP32:
- **Can't find device:** Make sure ESP32 is powered and sketch uploaded successfully
- **Upload failed:** Press and hold BOOT button while uploading
- **BLE not working:** Check Serial Monitor (115200 baud) for debug messages
- **Device name different:** Check the `BLEDevice::init()` line in code

### Joystick Control:
- **Robot doesn't move:** Check MIN_MOTOR_SPEED value (should be 50 for most motors)
- **Robot moves when joystick centered:** Increase deadzone value (default ±10)
- **Steering too sensitive/weak:** Adjust steering multiplier in code (default 1.0)
- **Motors jerky or weak:** Ensure motor power supply is adequate (7-12V recommended)
- **One motor faster than other:** Calibrate motor speeds in code or use PWM trim
- **Robot doesn't stop immediately:** Check that stop command `J:50,50,50,50` is being received (use Serial Monitor)
