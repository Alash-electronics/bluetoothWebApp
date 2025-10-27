# BLE Controller

A universal web-based Bluetooth controller application for Arduino and embedded devices. Supports HC-06, HC-05, HM-10, ESP32 and other Bluetooth/BLE modules. Control your projects directly from your browser using the Web Bluetooth API.

## Features

### Multiple Control Modes

- **Terminal Mode** - Full-featured serial terminal with customizable macro buttons for quick command execution
- **RC Car Control** - Gamepad-style interface for controlling remote-controlled vehicles
- **Joystick Mode** - Dual joystick interface inspired by PlayStation controllers for precise analog control
- **Smart Home Control** - Room-based device management with support for lights, sensors, AC units, and more

### Advanced Capabilities

- Real-time bidirectional Bluetooth communication with HM-10 BLE modules
- Multi-language support (English, Russian, Kazakh)
- Persistent settings storage using localStorage
- Mobile-optimized responsive design with orientation lock support
- Fullscreen mode for immersive control experience
- Haptic feedback on supported devices
- Customizable device configurations and command macros
- Light and dark theme support

## Live Demo

Visit the live application: **https://alash-electronics.github.io/bluetoothWebApp/**

## Platform Compatibility

### Web (PWA)
The Web Bluetooth API is required for this application to function:

- ✅ Chrome 56+ (desktop & Android)
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ **Not supported:** Firefox, Safari, iOS browsers

### Native Apps (via Capacitor)
Full Bluetooth support on mobile platforms:

- ✅ **iOS** - Native app via Capacitor (requires Xcode to build)
- ✅ **Android** - Native app via Capacitor (can be built on any OS)

**Note:** The app automatically detects the platform and uses the appropriate Bluetooth API:
- Web Bluetooth API for browsers
- Capacitor Bluetooth LE for native iOS/Android apps

See [CAPACITOR_GUIDE.md](./CAPACITOR_GUIDE.md) for building native apps.

## Hardware Requirements

### Supported Bluetooth Modules

- **HM-10** - BLE 4.0 module (recommended for low power)
- **HC-06** - Classic Bluetooth 2.0 SPP module
- **HC-05** - Classic Bluetooth 2.0 master/slave module
- **ESP32** - Built-in BLE and Classic Bluetooth
- **Arduino BLE modules** - BLE Nano, Arduino Nano 33 BLE, etc.
- **Other UART modules** - Any module with UART-over-Bluetooth

### Microcontrollers

- Arduino Uno, Nano, Mega, Leonardo
- ESP32, ESP8266
- STM32, Raspberry Pi Pico
- Any board with UART/Serial support

### Power Requirements

- 3.3V-5V depending on module
- HC-05/HC-06: 3.6V-6V (5V tolerant)
- HM-10: 3.3V (use voltage divider on 5V boards)
- ESP32: 3.3V

**Important:** Always check your module's voltage requirements. Use voltage dividers for 3.3V modules when connecting to 5V Arduino boards.

## Quick Start

### For End Users

Simply visit the [live demo](https://alash-electronics.github.io/bluetoothWebApp/) on a compatible browser and click "Connect" to pair with your BLE device.

### For Developers

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bluetoothWebApp.git
cd bluetoothWebApp/ble-controller

# Install dependencies
npm install

# Start development server (HTTPS required for Web Bluetooth API)
npm run dev
```

The development server will start at `https://localhost:5173/` with a self-signed SSL certificate (accept the browser warning to proceed).

#### Build for Production

```bash
# Build the application
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Project Structure

```
bluetoothWebApp/
├── ble-controller/              # Main application directory
│   ├── src/
│   │   ├── components/          # React UI components
│   │   │   ├── DeviceSelection.tsx    # Device type selection screen
│   │   │   ├── ControlPanel.tsx       # RC car gamepad interface
│   │   │   ├── JoystickPanel.tsx      # Dual joystick interface
│   │   │   ├── TerminalPanel.tsx      # Serial terminal interface
│   │   │   ├── SmartHomePanel.tsx     # Smart home room selection
│   │   │   └── SettingsPanel.tsx      # Configuration modal
│   │   ├── services/            # Business logic and state management
│   │   │   ├── bluetoothService.ts    # Core BLE communication
│   │   │   ├── appSettings.ts         # App-wide settings
│   │   │   ├── localization.ts        # Multi-language support
│   │   │   └── [other settings]       # Feature-specific configs
│   │   ├── hooks/               # React custom hooks
│   │   │   └── useFullscreen.ts       # Fullscreen API hook
│   │   └── App.tsx              # Root component with routing
│   ├── arduino-examples/        # Arduino sketch examples
│   │   ├── terminal_basic/      # Echo example
│   │   ├── rc_car_control/      # Motor control example
│   │   ├── smart_home_basic/    # Device control example
│   │   └── README.md            # Hardware setup guide
│   └── package.json
└── README.md                    # This file
```

## Arduino Examples

The `ble-controller/arduino-examples/` directory contains reference implementations:

- **terminal_basic** - Simple echo server for testing terminal mode
- **rc_car_control** - Motor driver control for RC vehicles
- **smart_home_basic** - Relay and LED control for home automation

Each example includes:
- Complete Arduino sketch
- Wiring diagrams
- Pin configuration details
- Communication protocol documentation

See `arduino-examples/README.md` for detailed setup instructions.

## Technology Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 3
- **Bluetooth Communication:** Web Bluetooth API
- **State Management:** Singleton services with React hooks
- **Storage:** Browser localStorage
- **Deployment:** GitHub Pages

## Communication Protocol

### UART over BLE

- **Service UUID:** `0000ffe0-0000-1000-8000-00805f9b34fb`
- **Characteristic UUID:** `0000ffe1-0000-1000-8000-00805f9b34fb`
- **Data Format:** UTF-8 text strings
- **Command Length:** Single character to 20 bytes per packet
- **Baud Rate:** 9600 (Arduino default)

### Command Examples

```
Terminal Mode:
  Any text string + Enter

RC Car Mode:
  'F' - Forward
  'B' - Backward
  'L' - Left
  'R' - Right
  'S' - Stop

Smart Home Mode:
  'L' - LED On
  'l' - LED Off
  'K' - AC On
  'k' - AC Off
  'T24' - Set temperature to 24°C
  [Customizable in settings]
```

## Configuration

### Customizing Control Commands

All command mappings are configurable through the Settings panel:

1. Click the gear icon in any control mode
2. Navigate to the appropriate settings tab
3. Modify commands, labels, or parameters
4. Changes are saved automatically to localStorage

### Adding New Rooms (Smart Home Mode)

1. Open Settings in Smart Home mode
2. Navigate to "Rooms" tab
3. Add up to 6 custom rooms with icons
4. Configure devices and sensors per room

## Development Guide

### Architecture Overview

The application uses a **singleton service pattern** for state management:

1. **Services** manage business logic and persist to localStorage
2. **Components** subscribe to service updates via callbacks
3. **React hooks** synchronize service state with component state

### Key Services

- `bluetoothService` - BLE connection and data transfer
- `localization` - Multi-language text management
- `appSettings` - Theme, vibration, language preferences
- `[mode]Settings` - Mode-specific configurations

### Adding a New Control Mode

1. Create component in `src/components/[ModeName]Panel.tsx`
2. Add view mode to `App.tsx` ViewMode type
3. Implement navigation logic in `DeviceSelection.tsx`
4. Create settings service if needed
5. Add localization keys for all UI text

See `CLAUDE.md` for detailed architectural documentation.

## Deployment

### GitHub Pages

The project includes automated deployment to GitHub Pages:

```bash
npm run deploy
```

This command:
1. Builds the production bundle
2. Deploys to the `gh-pages` branch
3. Updates the live site automatically

### Custom Domain

To deploy to a custom domain:

1. Update `base` in `vite.config.ts`
2. Add CNAME file to `public/` directory
3. Configure DNS settings with your provider
4. Run `npm run deploy`

## Troubleshooting

### Connection Issues

- **Module not found:** Ensure HM-10 is powered and within range
- **Connection failed:** Check that module name starts with "HM"
- **No response:** Verify RX/TX wiring and voltage levels
- **Random disconnects:** Check power supply stability

### Browser Issues

- **Bluetooth not available:** Use Chrome, Edge, or Opera
- **HTTPS required:** Development server includes SSL by default
- **Permission denied:** Ensure Bluetooth is enabled in OS settings

### Hardware Issues

- **RX pin damage:** HM-10 RX requires 3.3V (use voltage divider on 5V boards)
- **No serial output:** Verify baud rate matches (9600 default)
- **Module not responding:** Power cycle the module and Arduino

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

- Run `npm run lint` before committing
- Test on mobile and desktop browsers
- Verify Bluetooth functionality with real hardware
- Update documentation for new features

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with React and Vite
- Styled with Tailwind CSS
- Icons from system emoji set
- Inspired by modern mobile control interfaces

## Contact

For questions, issues, or feature requests:
- Open an issue on GitHub
- Visit the discussions page
- Check existing documentation in `CLAUDE.md`

## Platform Support

### Web (PWA) ✅
- Installable Progressive Web App
- Offline functionality with Service Worker
- Auto-updates when online
- Works on Chrome/Edge/Opera (Desktop & Android)
- See [PWA_INSTALL_GUIDE.md](./PWA_INSTALL_GUIDE.md) for installation instructions

### iOS Native App ✅
- Full Bluetooth support via Capacitor
- Available through App Store (or build yourself)
- See [CAPACITOR_GUIDE.md](./CAPACITOR_GUIDE.md) for build instructions

### Android Native App ✅
- Full Bluetooth support via Capacitor
- Available through Google Play Store (or build yourself)
- See [CAPACITOR_GUIDE.md](./CAPACITOR_GUIDE.md) for build instructions

## Roadmap

Future enhancements planned:

- [ ] Custom joystick sensitivity controls
- [ ] Macro recording and playback
- [ ] Multiple device connection support
- [ ] Cloud settings synchronization
- [ ] Additional Arduino examples
- [ ] Video tutorials and documentation
- [x] ~~PWA support for offline functionality~~ ✅ Completed
- [x] ~~iOS support~~ ✅ Completed via Capacitor

---

**Built with by Alash Electronics**

Made with React, TypeScript, and the Web Bluetooth API.
