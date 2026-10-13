import { supabase } from '../lib/supabase';

export const menuService = {
  async getMenu() {
    // Fetch categories, items and services in parallel
    const [itemsRes, catsRes, servicesRes] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*, menu_categories(id, name, type)')
        .eq('is_available', true)
        .order('name', { ascending: true }),
      supabase
        .from('menu_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('services')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true })
    ]);

    if (itemsRes.error) {
      console.error('[menuService] Error loading items:', itemsRes.error);
      throw itemsRes.error;
    }

    const rawItems = itemsRes.data || [];
    const categories = catsRes.data || [];
    const services = servicesRes.data || [];

    // Map items with safe category properties
    const enrichedItems = rawItems.map(item => {
      const cat = item.menu_categories;
      return {
        ...item,
        category_id: item.category_id,
        category_name: cat?.name || 'General',
        category_type: cat?.type || 'food'
      };
    });

    const food = enrichedItems.filter(i => i.category_type !== 'drink');
    const drinks = enrichedItems.filter(i => i.category_type === 'drink');

    return { 
      items: enrichedItems,
      categories,
      food, 
      drinks, 
      services 
    };
  }
};
