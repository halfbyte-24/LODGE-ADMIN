import { ROOMS, ROOM_TYPES, PHYSICAL_ROOMS } from '../data/hotelData';

/**
 * Get all public room types
 */
export function getAllRooms() {
  return Promise.resolve({ data: ROOM_TYPES, source: 'local' });
}

export function getAllRoomTypes() {
  return Promise.resolve({ data: ROOM_TYPES, source: 'local' });
}

/**
 * Get room type by ID (matches id, typeId, or normalized slug)
 */
export function getRoomById(id) {
  if (!id) return Promise.resolve({ data: null, source: 'local' });
  const normalized = String(id).toLowerCase().trim();
  const room = ROOM_TYPES.find((r) => 
    r.id === normalized || 
    r.typeId === normalized || 
    r.category === normalized ||
    r.name.toLowerCase().replace(/\s+/g, '-') === normalized
  ) || null;
  return Promise.resolve({ data: room, source: 'local' });
}

/**
 * Get rooms by category
 */
export function getRoomsByCategory(category) {
  if (!category || category === 'all') {
    return Promise.resolve({ data: ROOM_TYPES, source: 'local' });
  }
  const filtered = ROOM_TYPES.filter((r) => r.id === category || r.category === category);
  return Promise.resolve({ data: filtered, source: 'local' });
}

/**
 * Get all 9 physical rooms across the 3 floors
 */
export function getPhysicalRooms() {
  return Promise.resolve({ data: PHYSICAL_ROOMS, source: 'local' });
}

/**
 * Get physical rooms by floor number (1, 2, or 3)
 */
export function getPhysicalRoomsByFloor(floor) {
  const floorNum = parseInt(floor, 10);
  const rooms = PHYSICAL_ROOMS.filter((r) => r.floor === floorNum);
  return Promise.resolve({ data: rooms, source: 'local' });
}

/**
 * Get physical rooms by room type ID
 */
export function getPhysicalRoomsByType(typeId) {
  const rooms = PHYSICAL_ROOMS.filter((r) => r.room_type_id === typeId);
  return Promise.resolve({ data: rooms, source: 'local' });
}

