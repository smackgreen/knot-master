import { MealPlan, MealItem } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// Add a new meal plan
export const addMealPlan = async (
  supabase: SupabaseClient,
  userId: string,
  mealPlan: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt' | 'mealItems'>
): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        client_id: mealPlan.clientId,
        name: mealPlan.name,
        event_date: mealPlan.eventDate,
        meal_type: mealPlan.mealType,
        guest_count: mealPlan.guestCount,
        budget_per_person: mealPlan.budgetPerPerson,
        location: mealPlan.location,
        season: mealPlan.season,
        cultural_requirements: mealPlan.culturalRequirements,
        preferences: mealPlan.preferences,
        notes: mealPlan.notes
      })
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error adding meal plan:', error);
    throw error;
  }
};

// Update an existing meal plan
export const updateMealPlan = async (
  supabase: SupabaseClient,
  userId: string,
  mealPlan: MealPlan
): Promise<void> => {
  try {
    // Convert from frontend model to database model
    const dbUpdates: any = {
      name: mealPlan.name,
      meal_type: mealPlan.mealType,
      event_date: mealPlan.eventDate,
      guest_count: mealPlan.guestCount,
      budget_per_person: mealPlan.budgetPerPerson,
      location: mealPlan.location,
      season: mealPlan.season,
      cultural_requirements: mealPlan.culturalRequirements,
      preferences: mealPlan.preferences,
      notes: mealPlan.notes,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('meal_plans')
      .update(dbUpdates)
      .eq('id', mealPlan.id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating meal plan:', error);
    throw error;
  }
};

// Delete a meal plan
export const deleteMealPlan = async (
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw error;
  }
};

// Add a new meal item
export const addMealItem = async (
  supabase: SupabaseClient,
  mealItem: Omit<MealItem, 'id' | 'createdAt'>
): Promise<void> => {
  try {
    // Create a base object with required fields
    const baseItem = {
      meal_plan_id: mealItem.mealPlanId,
      name: mealItem.name,
      description: mealItem.description,
      course: mealItem.course,
      is_vegetarian: mealItem.isVegetarian,
      is_vegan: mealItem.isVegan,
      is_gluten_free: mealItem.isGlutenFree,
      is_dairy_free: mealItem.isDairyFree,
      is_nut_free: mealItem.isNutFree,
      contains_alcohol: mealItem.containsAlcohol,
      estimated_cost_per_person: mealItem.estimatedCostPerPerson,
      notes: mealItem.notes
    };

    // Try inserting with all fields first
    try {
      const { error } = await supabase
        .from('meal_items')
        .insert({
          ...baseItem,
          image_url: mealItem.imageUrl,
          seasonality: mealItem.seasonality,
          region: mealItem.region
        });

      if (!error) return; // If successful, return early

      // If there's an error about missing columns, try without those columns
      if (error.message && error.message.includes('column')) {
        console.warn('Trying to insert without potentially missing columns:', error.message);

        // Try without image_url
        const { error: error2 } = await supabase
          .from('meal_items')
          .insert(baseItem);

        if (error2) throw error2;
      } else {
        throw error;
      }
    } catch (innerError) {
      throw innerError;
    }
  } catch (error) {
    console.error('Error adding meal item:', error);
    throw error;
  }
};

// Update an existing meal item
export const updateMealItem = async (
  supabase: SupabaseClient,
  id: string,
  mealItem: Partial<MealItem>
): Promise<void> => {
  try {
    // Convert from frontend model to database model - required fields only
    const baseUpdates: any = {};
    if (mealItem.name !== undefined) baseUpdates.name = mealItem.name;
    if (mealItem.description !== undefined) baseUpdates.description = mealItem.description;
    if (mealItem.course !== undefined) baseUpdates.course = mealItem.course;
    if (mealItem.isVegetarian !== undefined) baseUpdates.is_vegetarian = mealItem.isVegetarian;
    if (mealItem.isVegan !== undefined) baseUpdates.is_vegan = mealItem.isVegan;
    if (mealItem.isGlutenFree !== undefined) baseUpdates.is_gluten_free = mealItem.isGlutenFree;
    if (mealItem.isDairyFree !== undefined) baseUpdates.is_dairy_free = mealItem.isDairyFree;
    if (mealItem.isNutFree !== undefined) baseUpdates.is_nut_free = mealItem.isNutFree;
    if (mealItem.containsAlcohol !== undefined) baseUpdates.contains_alcohol = mealItem.containsAlcohol;
    if (mealItem.estimatedCostPerPerson !== undefined) baseUpdates.estimated_cost_per_person = mealItem.estimatedCostPerPerson;
    if (mealItem.notes !== undefined) baseUpdates.notes = mealItem.notes;

    // Try updating with all fields first
    try {
      // Create a full update object with potentially missing columns
      const fullUpdates = { ...baseUpdates };
      if (mealItem.imageUrl !== undefined) fullUpdates.image_url = mealItem.imageUrl;
      if (mealItem.seasonality !== undefined) fullUpdates.seasonality = mealItem.seasonality;
      if (mealItem.region !== undefined) fullUpdates.region = mealItem.region;

      const { error } = await supabase
        .from('meal_items')
        .update(fullUpdates)
        .eq('id', id);

      if (!error) return; // If successful, return early

      // If there's an error about missing columns, try without those columns
      if (error.message && error.message.includes('column')) {
        console.warn('Trying to update without potentially missing columns:', error.message);

        // Try with only the base updates
        const { error: error2 } = await supabase
          .from('meal_items')
          .update(baseUpdates)
          .eq('id', id);

        if (error2) throw error2;
      } else {
        throw error;
      }
    } catch (innerError) {
      throw innerError;
    }
  } catch (error) {
    console.error('Error updating meal item:', error);
    throw error;
  }
};

// Delete a meal item
export const deleteMealItem = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('meal_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting meal item:', error);
    throw error;
  }
};

// Fetch meal plans for a user
export const fetchMealPlans = async (
  supabase: SupabaseClient,
  userId: string
): Promise<MealPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      clientId: item.client_id,
      name: item.name,
      eventDate: item.event_date,
      mealType: item.meal_type,
      guestCount: item.guest_count,
      budgetPerPerson: item.budget_per_person,
      location: item.location || '',
      season: item.season || '',
      culturalRequirements: item.cultural_requirements || '',
      preferences: item.preferences || '',
      notes: item.notes || '',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return [];
  }
};

// Fetch meal items for a user
export const fetchMealItems = async (
  supabase: SupabaseClient,
  userId: string
): Promise<MealItem[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_items')
      .select('meal_items.*, meal_plans.user_id')
      .join('meal_plans', 'meal_items.meal_plan_id', 'meal_plans.id')
      .eq('meal_plans.user_id', userId);

    if (error) throw error;

    return data.map((item: any) => {
      // Create a base meal item with required fields
      const mealItem: MealItem = {
        id: item.id,
        mealPlanId: item.meal_plan_id,
        name: item.name,
        description: item.description || '',
        course: item.course,
        isVegetarian: item.is_vegetarian,
        isVegan: item.is_vegan,
        isGlutenFree: item.is_gluten_free,
        isDairyFree: item.is_dairy_free,
        isNutFree: item.is_nut_free,
        containsAlcohol: item.contains_alcohol,
        estimatedCostPerPerson: item.estimated_cost_per_person,
        notes: item.notes || '',
        createdAt: item.created_at,
        // Set default values for potentially missing fields
        imageUrl: '',
        seasonality: [],
        region: ''
      };

      // Add optional fields if they exist in the database
      if ('image_url' in item) mealItem.imageUrl = item.image_url || '';
      if ('seasonality' in item) mealItem.seasonality = item.seasonality || [];
      if ('region' in item) mealItem.region = item.region || '';

      return mealItem;
    });
  } catch (error) {
    console.error('Error fetching meal items:', error);
    return [];
  }
};
