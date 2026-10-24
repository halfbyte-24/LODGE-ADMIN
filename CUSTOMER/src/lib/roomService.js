import { ROOMS, ROOM_TYPES, PHYSICAL_ROOMS } from '../data/hotelData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Helper to build enriched room types using live database rates
 */
function enrichRoomTypesWithDb(roomsList) {
  if (!roomsList || roomsList.length === 0) return ROOM_TYPES;

  return ROOM_TYPES.map(rt => {
    const matchingRooms = roomsList.filter(r => {
      const cat = (r.category || r.room_type || '').toLowerCase();
      if (rt.id === 'standard-room') return cat.includes('standard');
      if (rt.id === 'deluxe-room') return cat.includes('deluxe') && !cat.includes('super');
      if (rt.id === 'super-deluxe-room') return cat.includes('super');
      return false;
    });

    const prices = matchingRooms
      .map(r => Number(r.price_per_night || r.price))
      .filter(p => !isNaN(p) && p > 0);

    const livePrice = prices.length > 0 ? Math.min(...prices) : rt.price;
    const availableCount = matchingRooms.filter(r => r.status === 'available' && r.is_active !== false).length;
    const customImage = matchingRooms.find(r => r.image_url)?.image_url;

    return {
      ...rt,
      image: customImage || rt.image,
      price: livePrice,
      pricePerNight: livePrice,
      availableRoomsCount: availableCount > 0 ? availableCount : rt.availableRoomsCount
    };
  });
}

let roomsCache = null;
let roomsCacheTimestamp = 0;
const ROOMS_CACHE_TTL_MS = 60000; // 60 seconds in-memory cache

/**
 * Get all public room types with single source of truth from Supabase
 */
export async function getAllRooms(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && roomsCache && (now - roomsCacheTimestamp < ROOMS_CACHE_TTL_MS)) {
    return { data: roomsCache, source: 'cache' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (!error && data && data.length > 0) {
        const enriched = enrichRoomTypesWithDb(data);
        roomsCache = enriched;
        roomsCacheTimestamp = now;
        return { data: enriched, source: 'supabase' };
      }
    } catch (err) {
      console.warn('[roomService] Failed to fetch live room types from Supabase:', err);
    }
  }
  return { data: roomsCache || ROOM_TYPES, source: 'local' };
}

export async function getAllRoomTypes() {
  return getAllRooms();
}

/**
 * Get room by ID (supports Supabase room UUID, room_number, or category slug)
 */
export async function getRoomById(id) {
  if (!id) return { data: null, source: 'local' };
  const rawId = String(id).trim();
  const normalized = rawId.toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try finding a physical room by UUID or room number
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
      let query = supabase.from('rooms').select('*');
      if (isUuid) {
        query = query.eq('id', rawId);
      } else if (/^\d+$/.test(rawId)) {
        query = query.eq('room_number', rawId);
      }

      if (isUuid || /^\d+$/.test(rawId)) {
        const { data: roomRow, error } = await query.maybeSingle();
        if (!error && roomRow) {
          const typeKey = (roomRow.category || roomRow.room_type || '').toLowerCase();
          const matchedType = ROOM_TYPES.find(rt =>
            typeKey.includes('super') ? rt.id === 'super-deluxe-room'
            : typeKey.includes('deluxe') ? rt.id === 'deluxe-room'
            : rt.id === 'standard-room'
          ) || ROOM_TYPES[0];

          const enriched = {
            ...matchedType,
            ...roomRow,
            id: roomRow.id,
            room_number: roomRow.room_number,
            floor: roomRow.floor,
            name: `Room ${roomRow.room_number} (${roomRow.category || matchedType.name})`,
            categoryName: roomRow.category || matchedType.name,
            price: Number(roomRow.price_per_night),
            pricePerNight: Number(roomRow.price_per_night),
            image: roomRow.image_url || matchedType.image,
            description: roomRow.description || matchedType.description
          };
          return { data: enriched, source: 'supabase' };
        }
      }

      // 2. If it's a category slug (e.g. standard-room)
      const allRes = await getAllRooms();
      const matched = allRes.data.find(r =>
        r.id === normalized ||
        r.typeId === normalized ||
        r.category === normalized ||
        r.name.toLowerCase().replace(/\s+/g, '-') === normalized
      );
      if (matched) {
        return { data: matched, source: allRes.source };
      }
    } catch (err) {
      console.warn('[roomService] getRoomById DB query error:', err);
    }
  }

  // Local fallback
  const room = ROOM_TYPES.find((r) => 
    r.id === normalized || 
    r.typeId === normalized || 
    r.category === normalized ||
    r.name.toLowerCase().replace(/\s+/g, '-') === normalized
  ) || null;

  return { data: room, source: 'local' };
}

/**
 * Get rooms by category
 */
export async function getRoomsByCategory(category) {
  const allRes = await getAllRooms();
  if (!category || category === 'all') {
    return allRes;
  }
  const filtered = allRes.data.filter((r) => r.id === category || r.category === category);
  return { data: filtered, source: allRes.source };
}

/**
 * Get all 9 physical rooms across the 3 floors from Supabase
 */
export async function getPhysicalRooms() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped = data.map(r => {
          const cat = (r.category || r.room_type || '').toLowerCase();
          const typeId = cat.includes('super') ? 'super-deluxe-room'
            : cat.includes('deluxe') ? 'deluxe-room'
            : 'standard-room';

          return {
            id: r.id,
            room_number: String(r.room_number),
            floor: parseInt(r.floor, 10) || (String(r.room_number).startsWith('1') ? 1 : String(r.room_number).startsWith('2') ? 2 : 3),
            room_type_id: typeId,
            category: r.category || (typeId === 'standard-room' ? 'Standard' : typeId === 'deluxe-room' ? 'Deluxe' : 'Super Deluxe'),
            price: Number(r.price_per_night),
            price_per_night: Number(r.price_per_night),
            status: r.status || 'available',
            is_active: r.is_active !== false,
            ac_type: r.ac_type,
            bed_type: r.bed_type,
            max_occupancy: r.max_occupancy,
            description: r.description,
            image_url: r.image_url
          };
        });
        return { data: mapped, source: 'supabase' };
      }
    } catch (err) {
      console.warn('[roomService] getPhysicalRooms DB error, using fallback:', err);
    }
  }
  return { data: PHYSICAL_ROOMS, source: 'local' };
}

/**
 * Get physical rooms by floor number (1, 2, or 3)
 */
export async function getPhysicalRoomsByFloor(floor) {
  const all = await getPhysicalRooms();
  const floorNum = parseInt(floor, 10);
  const rooms = all.data.filter((r) => r.floor === floorNum);
  return { data: rooms, source: all.source };
}

/**
 * Get physical rooms by room type ID
 */
export async function getPhysicalRoomsByType(typeId) {
  const all = await getPhysicalRooms();
  const rooms = all.data.filter((r) => r.room_type_id === typeId);
  return { data: rooms, source: all.source };
}
