export interface RoomConfig {
  id: string;
  name: string;
  icon: string;
}

export const DEFAULT_ROOMS: RoomConfig[] = [
  { id: 'room1', name: 'Living Room', icon: '🛋️' },
  { id: 'room2', name: 'Bedroom', icon: '🛏️' },
  { id: 'room3', name: 'Kitchen', icon: '🍳' },
];

class RoomSettingsService {
  private storageKey = 'smartHomeRooms';

  getRooms(): RoomConfig[] {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing room settings:', error);
        return DEFAULT_ROOMS;
      }
    }
    return DEFAULT_ROOMS;
  }

  saveRooms(rooms: RoomConfig[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(rooms));
  }

  addRoom(room: RoomConfig): void {
    const rooms = this.getRooms();
    if (rooms.length < 6) {
      rooms.push(room);
      this.saveRooms(rooms);
    }
  }

  updateRoom(id: string, updates: Partial<RoomConfig>): void {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...updates };
      this.saveRooms(rooms);
    }
  }

  deleteRoom(id: string): void {
    const rooms = this.getRooms();
    const filtered = rooms.filter(r => r.id !== id);
    this.saveRooms(filtered);
  }

  getRoom(id: string): RoomConfig | undefined {
    return this.getRooms().find(r => r.id === id);
  }

  resetToDefaults(): void {
    this.saveRooms(DEFAULT_ROOMS);
  }
}

export const roomSettings = new RoomSettingsService();
