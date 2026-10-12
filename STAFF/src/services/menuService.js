import { supabase } from '../lib/supabase';

export const menuService = {
  async getMenu() {
    // Fetch categories and items
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name, type)')
      .eq('is_available', true);

    if (itemsError) throw itemsError;

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('is_available', true);

    if (servicesError) throw servicesError;

    // Group items
    const food = items.filter(i => i.menu_categories.type === 'food').map(i => ({...i, category_name: i.menu_categories.name}));
    const drinks = items.filter(i => i.menu_categories.type === 'drink').map(i => ({...i, category_name: i.menu_categories.name}));

    return { food, drinks, services };
  }
};
