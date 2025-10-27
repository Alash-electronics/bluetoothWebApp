# Contributing to BLE Controller

Thank you for your interest in contributing to BLE Controller! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Browser and device information
- Screenshots or error messages (if applicable)
- Hardware setup details (Arduino board, BLE module model)

### Suggesting Features

Feature requests are welcome! Please include:

- Clear description of the feature
- Use case and benefits
- Mockups or examples (if applicable)
- Any technical considerations

### Pull Requests

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Set up the development environment**
   ```bash
   cd ble-controller
   npm install
   npm run dev
   ```

3. **Make your changes**
   - Write clear, readable code
   - Follow existing code style and conventions
   - Add comments for complex logic
   - Test on multiple browsers and devices

4. **Test thoroughly**
   - Test with real BLE hardware
   - Verify on mobile and desktop browsers
   - Check both portrait and landscape orientations
   - Test all affected control modes

5. **Run linting**
   ```bash
   npm run lint
   ```

6. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference issue numbers if applicable
   ```bash
   git commit -m "feat: Add dual joystick sensitivity controls"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference related issues
   - Include screenshots/videos for UI changes
   - Describe testing performed

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Use functional components over class components
- Prefer const over let, avoid var
- Use meaningful variable and function names
- Keep functions small and focused

### Component Structure

```typescript
// Import order: React, third-party, local
import { useState, useEffect } from 'react';
import { bluetoothService } from '../services/bluetoothService';

// Component props interface
interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// Component definition
export function MyComponent({ value, onChange }: MyComponentProps) {
  // State declarations
  const [state, setState] = useState<string>('');

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Event handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Service Pattern

- Services are singletons exported as instances
- Use localStorage for persistence
- Provide callback mechanisms for state changes
- Include clear error handling

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Support both light and dark themes
- Ensure touch-friendly sizes (min 44x44px)

### Localization

- Add all user-facing text to `src/services/localization.ts`
- Provide translations for Russian, English, and Kazakh
- Use `localization.t('key')` in components

## Architecture Overview

### Key Patterns

1. **Singleton Services** - Business logic and state management
2. **React Hooks** - Component state synchronization
3. **localStorage** - Settings persistence
4. **Callback Pattern** - Service-to-component communication

### File Organization

```
src/
├── components/     # UI components
├── services/       # Business logic singletons
├── hooks/          # Custom React hooks
└── App.tsx         # Root component with routing
```

### Communication Flow

```
User Interaction → Component Handler → Service Method → localStorage
                                     ↓
Service Callback ← Component useEffect ← State Update
```

## Testing Guidelines

### Before Submitting PR

- [ ] Code runs without errors in development mode
- [ ] Production build completes successfully
- [ ] Linting passes without warnings
- [ ] Feature works on Chrome/Edge (desktop)
- [ ] Feature works on Chrome (Android)
- [ ] UI is responsive on different screen sizes
- [ ] Works in both portrait and landscape
- [ ] Bluetooth connection and communication verified
- [ ] Settings persist correctly
- [ ] All languages display correctly
- [ ] No console errors or warnings

### Hardware Testing

If your changes affect Bluetooth communication:

- [ ] Test with HM-10 module
- [ ] Verify Arduino sketch compatibility
- [ ] Check data transmission reliability
- [ ] Test connection/disconnection flow
- [ ] Verify error handling

## Documentation

- Update README.md for new features
- Update CLAUDE.md for architectural changes
- Add comments for complex algorithms
- Include Arduino examples for new protocols
- Update this CONTRIBUTING.md if process changes

## Commit Message Convention

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: Add temperature control to smart home AC
fix: Resolve landscape orientation detection on iOS
docs: Update Arduino wiring diagram
refactor: Simplify bluetooth connection logic
```

## Getting Help

- Check existing issues and documentation
- Review CLAUDE.md for architectural details
- Ask questions in GitHub Discussions
- Examine Arduino examples for protocol reference

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for any questions about contributing!

---

Thank you for contributing to BLE Controller!
