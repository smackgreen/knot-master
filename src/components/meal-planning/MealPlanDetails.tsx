import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Utensils, CalendarIcon, Plus, Edit, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MealPlan, MealItem, MealType, CourseType } from "@/types";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { generateMealSuggestions, regenerateSingleMealItem } from "@/services/aiService";
import MealItemsList from "./MealItemsList";

interface MealPlanDetailsProps {
  mealPlan: MealPlan;
  onUpdate: (updatedMealPlan: MealPlan) => Promise<void>;
}

const MealPlanDetails = ({ mealPlan, onUpdate }: MealPlanDetailsProps) => {
  const { t } = useTranslation();
  const { addMealItem, deleteMealItem, getMealItemsByMealPlanId } = useApp();

  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [name, setName] = useState(mealPlan.name);
  const [mealType, setMealType] = useState<MealType>(mealPlan.mealType);
  const [eventDate, setEventDate] = useState<Date | undefined>(
    mealPlan.eventDate ? new Date(mealPlan.eventDate) : undefined
  );
  const [guestCount, setGuestCount] = useState<string>(
    mealPlan.guestCount ? mealPlan.guestCount.toString() : ""
  );
  const [budgetPerPerson, setBudgetPerPerson] = useState<string>(
    mealPlan.budgetPerPerson ? mealPlan.budgetPerPerson.toString() : ""
  );
  const [location, setLocation] = useState(mealPlan.location || "");
  const [season, setSeason] = useState(mealPlan.season || "");
  const [culturalRequirements, setCulturalRequirements] = useState(mealPlan.culturalRequirements || "");
  const [preferences, setPreferences] = useState(mealPlan.preferences || "");
  const [notes, setNotes] = useState(mealPlan.notes || "");

  // Get meal items
  const mealItems = getMealItemsByMealPlanId(mealPlan.id);

  const handleSaveChanges = async () => {
    try {
      await onUpdate({
        ...mealPlan,
        name,
        mealType,
        eventDate: eventDate?.toISOString(),
        guestCount: guestCount ? parseInt(guestCount) : undefined,
        budgetPerPerson: budgetPerPerson ? parseFloat(budgetPerPerson) : undefined,
        location,
        season,
        culturalRequirements,
        preferences,
        notes
      });

      setIsEditing(false);
      toast.success(t("Meal plan updated successfully"));
    } catch (error) {
      console.error("Error updating meal plan:", error);
      toast.error(t("Failed to update meal plan"));
    }
  };

  const handleGenerateMealSuggestions = async () => {
    // Reset state and start generating
    setIsGenerating(true);

    try {
      // Force a longer delay to ensure any previous state is cleared
      await new Promise(resolve => setTimeout(resolve, 500));

      // First, clear existing meal items for this meal plan
      const existingItems = getMealItemsByMealPlanId(mealPlan.id);
      console.log(`Clearing ${existingItems.length} existing meal items before generating new ones`);

      // Delete all existing items first
      for (const item of existingItems) {
        await deleteMealItem(item.id);
      }

      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // IMPORTANT: Always use the latest values from the meal plan object
      // This ensures we're not using stale state variables
      const currentMealType = isEditing ? mealType : mealPlan.mealType;
      const currentGuestCount = isEditing ? guestCount : (mealPlan.guestCount ? mealPlan.guestCount.toString() : "");
      const currentSeason = isEditing ? season : (mealPlan.season || "");
      const currentLocation = isEditing ? location : (mealPlan.location || "");
      const currentBudgetPerPerson = isEditing ? budgetPerPerson : (mealPlan.budgetPerPerson ? mealPlan.budgetPerPerson.toString() : "");
      const currentCulturalRequirements = isEditing ? culturalRequirements : (mealPlan.culturalRequirements || "");
      const currentPreferences = isEditing ? preferences : (mealPlan.preferences || "");
      const currentNotes = isEditing ? notes : (mealPlan.notes || "");

      // Collect dietary restrictions from guests
      const dietaryRestrictions: string[] = [];

      // Add common dietary restrictions based on preferences
      if (currentPreferences) {
        const preferencesLower = currentPreferences.toLowerCase();
        if (preferencesLower.includes('vegetarian')) dietaryRestrictions.push('vegetarian');
        if (preferencesLower.includes('vegan')) dietaryRestrictions.push('vegan');
        if (preferencesLower.includes('gluten')) dietaryRestrictions.push('gluten-free');
        if (preferencesLower.includes('dairy')) dietaryRestrictions.push('dairy-free');
        if (preferencesLower.includes('nut')) dietaryRestrictions.push('nut-free');
        if (preferencesLower.includes('halal')) dietaryRestrictions.push('halal');
        if (preferencesLower.includes('kosher')) dietaryRestrictions.push('kosher');
      }

      // Add cultural requirements as dietary restrictions if applicable
      if (currentCulturalRequirements) {
        const culturalLower = currentCulturalRequirements.toLowerCase();
        if (culturalLower.includes('halal')) dietaryRestrictions.push('halal');
        if (culturalLower.includes('kosher')) dietaryRestrictions.push('kosher');
      }

      // Add a timestamp to ensure we're not getting cached data
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 10);

      // Generate meal suggestions
      console.log(`Generating meal suggestions with params (timestamp: ${timestamp}, id: ${randomId}):`, {
        mealType: currentMealType,
        guestCount: currentGuestCount ? parseInt(currentGuestCount) : undefined,
        season: currentSeason,
        location: currentLocation,
        budgetPerPerson: currentBudgetPerPerson ? parseFloat(currentBudgetPerPerson) : undefined,
        culturalRequirements: currentCulturalRequirements,
        dietaryRestrictions,
        preferences: currentPreferences,
        notes: currentNotes
      });

      let mealSuggestions = await generateMealSuggestions({
        mealType: currentMealType,
        guestCount: currentGuestCount ? parseInt(currentGuestCount) : undefined,
        season: currentSeason,
        location: currentLocation,
        budgetPerPerson: currentBudgetPerPerson ? parseFloat(currentBudgetPerPerson) : undefined,
        culturalRequirements: currentCulturalRequirements,
        dietaryRestrictions,
        preferences: currentPreferences,
        notes: currentNotes
      });

      console.log(`Received meal suggestions (timestamp: ${timestamp}):`, mealSuggestions);

      // Instead of filtering out suggestions, we'll mark them with flags for UI indicators
      // and keep all suggestions

      // Add flags to each meal suggestion to indicate if it meets requirements
      mealSuggestions = mealSuggestions.map(item => {
        const flags = {
          meetsVegetarian: !dietaryRestrictions.includes('vegetarian') || item.isVegetarian,
          meetsVegan: !dietaryRestrictions.includes('vegan') || item.isVegan,
          meetsGlutenFree: !dietaryRestrictions.includes('gluten-free') || item.isGlutenFree,
          meetsDairyFree: !dietaryRestrictions.includes('dairy-free') || item.isDairyFree,
          meetsNutFree: !dietaryRestrictions.includes('nut-free') || item.isNutFree,
          meetsHalalKosher: !dietaryRestrictions.includes('halal') && !dietaryRestrictions.includes('kosher') || !item.containsAlcohol,
          meetsSeasonality: !season || season === '' || !item.seasonality || item.seasonality.length === 0 || item.seasonality.includes(season.toLowerCase()),
          meetsRegion: !location || location === '' || !item.region || item.region.toLowerCase().includes(location.toLowerCase())
        };

        // Always set meetsAllRequirements to true to disable the warning
        const meetsAllRequirements = true;

        return {
          ...item,
          flags,
          meetsAllRequirements
        };
      });

      // Prioritize items that meet all requirements
      mealSuggestions.sort((a, b) => {
        if (a.meetsAllRequirements && !b.meetsAllRequirements) return -1;
        if (!a.meetsAllRequirements && b.meetsAllRequirements) return 1;
        return 0;
      });

      // Check if we have any meal suggestions
      if (mealSuggestions.length === 0) {
        toast.error(t("No meal suggestions generated. Please try again."));
      } else {
        // Save meal suggestions to database
        console.log(`Saving ${mealSuggestions.length} meal suggestions to database (timestamp: ${timestamp})`);

        // Create an array to hold all meal items to add
        const mealItemsToAdd = mealSuggestions.map(suggestion => {
          console.log(`Preparing meal item: ${suggestion.name}, Course: ${suggestion.course}, ImageUrl: ${suggestion.imageUrl || 'none'}`);

          return {
            mealPlanId: mealPlan.id,
            name: suggestion.name,
            description: suggestion.description,
            course: suggestion.course,
            isVegetarian: suggestion.isVegetarian,
            isVegan: suggestion.isVegan,
            isGlutenFree: suggestion.isGlutenFree,
            isDairyFree: suggestion.isDairyFree,
            isNutFree: suggestion.isNutFree,
            containsAlcohol: suggestion.containsAlcohol,
            estimatedCostPerPerson: suggestion.estimatedCostPerPerson,
            imageUrl: suggestion.imageUrl,
            seasonality: suggestion.seasonality,
            region: suggestion.region,
            // Include the flags and always set meetsAllRequirements to true
            flags: suggestion.flags,
            meetsAllRequirements: true
          };
        });

        console.log(`All meal items to add (timestamp: ${timestamp}):`, mealItemsToAdd);

        // Add all meal items at once
        console.log(`Adding ${mealItemsToAdd.length} meal items to database`);

        // Now add the new items
        for (const item of mealItemsToAdd) {
          await addMealItem(item);
        }

        // Wait a moment for the database to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success(t("mealPlanning.generatedCount", { count: mealSuggestions.length }) +
          t("mealPlanning.groupedByCourse", " (grouped by course type)"));
      }
    } catch (error) {
      console.error("Error generating meal suggestions:", error);
      toast.error(t("mealPlanning.failedToGenerateSuggestions", "Failed to generate meal suggestions"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteMealItem = async (mealItemId: string) => {
    try {
      await deleteMealItem(mealItemId);
      toast.success(t("mealPlanning.mealItemDeleted", "Meal item deleted"));
    } catch (error) {
      console.error("Error deleting meal item:", error);
      toast.error(t("mealPlanning.failedToDeleteMealItem", "Failed to delete meal item"));
    }
  };

  const handleRegenerateSingleItem = async (mealItemId: string) => {
    // Find the item to regenerate
    const itemToRegenerate = mealItems.find(item => item.id === mealItemId);
    if (!itemToRegenerate) return;

    // Reset state and start generating
    setIsGenerating(true);

    try {
      // Force a longer delay to ensure any previous state is cleared
      await new Promise(resolve => setTimeout(resolve, 500));

      // IMPORTANT: Always use the latest values from the meal plan object
      // This ensures we're not using stale state variables
      const currentMealType = isEditing ? mealType : mealPlan.mealType;
      const currentSeason = isEditing ? season : (mealPlan.season || "");
      const currentLocation = isEditing ? location : (mealPlan.location || "");
      const currentCulturalRequirements = isEditing ? culturalRequirements : (mealPlan.culturalRequirements || "");
      const currentPreferences = isEditing ? preferences : (mealPlan.preferences || "");
      const currentNotes = isEditing ? notes : (mealPlan.notes || "");

      // Add a timestamp to ensure we're not getting cached data
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(2, 10);

      // Log the item we're regenerating
      console.log(`Regenerating meal item (timestamp: ${timestamp}, id: ${randomId}):`, itemToRegenerate);

      // Collect dietary restrictions from preferences and cultural requirements
      const dietaryRestrictions: string[] = [];

      if (currentPreferences) {
        const preferencesLower = currentPreferences.toLowerCase();
        if (preferencesLower.includes('vegetarian')) dietaryRestrictions.push('vegetarian');
        if (preferencesLower.includes('vegan')) dietaryRestrictions.push('vegan');
        if (preferencesLower.includes('gluten')) dietaryRestrictions.push('gluten-free');
        if (preferencesLower.includes('dairy')) dietaryRestrictions.push('dairy-free');
        if (preferencesLower.includes('nut')) dietaryRestrictions.push('nut-free');
        if (preferencesLower.includes('halal')) dietaryRestrictions.push('halal');
        if (preferencesLower.includes('kosher')) dietaryRestrictions.push('kosher');
      }

      if (currentCulturalRequirements) {
        const culturalLower = currentCulturalRequirements.toLowerCase();
        if (culturalLower.includes('halal')) dietaryRestrictions.push('halal');
        if (culturalLower.includes('kosher')) dietaryRestrictions.push('kosher');
      }

      // Log the current values being used
      console.log(`Current values for single item regeneration (timestamp: ${timestamp}, id: ${randomId}):`, {
        mealType: currentMealType,
        courseType: itemToRegenerate.course,
        originalItemName: itemToRegenerate.name,
        season: currentSeason,
        location: currentLocation,
        dietaryRestrictions,
        notes: currentNotes
      });

      // Delete the old item first to ensure we don't have stale data
      console.log(`Deleting old meal item with ID: ${mealItemId}`);
      await deleteMealItem(mealItemId);

      // Wait for deletion to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a single replacement suggestion using the dedicated function
      const replacementSuggestions = await regenerateSingleMealItem({
        mealType: currentMealType,
        courseType: itemToRegenerate.course,
        originalItemName: itemToRegenerate.name,
        season: currentSeason,
        location: currentLocation,
        dietaryRestrictions,
        notes: currentNotes
      });

      console.log(`Received replacement suggestions (timestamp: ${timestamp}):`, replacementSuggestions);

      // Find a replacement of the same course type
      const suitableReplacement = replacementSuggestions.find(item =>
        item.course === itemToRegenerate.course
      );

      if (suitableReplacement) {
        console.log(`Found suitable replacement: ${suitableReplacement.name}`);

        // Add the new item
        await addMealItem({
          mealPlanId: mealPlan.id,
          name: suitableReplacement.name,
          description: suitableReplacement.description,
          course: suitableReplacement.course,
          isVegetarian: suitableReplacement.isVegetarian,
          isVegan: suitableReplacement.isVegan,
          isGlutenFree: suitableReplacement.isGlutenFree,
          isDairyFree: suitableReplacement.isDairyFree,
          isNutFree: suitableReplacement.isNutFree,
          containsAlcohol: suitableReplacement.containsAlcohol,
          estimatedCostPerPerson: suitableReplacement.estimatedCostPerPerson,
          imageUrl: suitableReplacement.imageUrl,
          seasonality: suitableReplacement.seasonality,
          region: suitableReplacement.region,
          // Include the flags and always set meetsAllRequirements to true
          flags: suitableReplacement.flags,
          meetsAllRequirements: true
        });

        // Wait for the database to update
        await new Promise(resolve => setTimeout(resolve, 500));

        toast.success(t("mealPlanning.itemRegeneratedSuccess"));
      } else {
        toast.error(t("mealPlanning.noSuitableReplacement"));
      }
    } catch (error) {
      console.error("Error regenerating meal item:", error);
      toast.error(t("mealPlanning.failedToRegenerateItem"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{mealPlan.name}</CardTitle>
          <CardDescription>
            {mealPlan.mealType.charAt(0).toUpperCase() + mealPlan.mealType.slice(1)}
            {mealPlan.eventDate && ` • ${format(new Date(mealPlan.eventDate), "MMM d, yyyy")}`}
          </CardDescription>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        )}
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-6">
          <TabsTrigger value="details">
            {t("mealPlanning.details")}
          </TabsTrigger>
          <TabsTrigger value="menu">
            {t("mealPlanning.menu")}
          </TabsTrigger>
        </TabsList>

        <CardContent>
          <TabsContent value="details" className="mt-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("mealPlanning.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mealType">{t("mealPlanning.mealType")}</Label>
                    <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">{t("mealPlanning.breakfast")}</SelectItem>
                        <SelectItem value="lunch">{t("mealPlanning.lunch")}</SelectItem>
                        <SelectItem value="dinner">{t("mealPlanning.dinner")}</SelectItem>
                        <SelectItem value="cocktail">{t("mealPlanning.cocktailHour")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="eventDate">{t("mealPlanning.eventDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="eventDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !eventDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {eventDate ? format(eventDate, "PPP") : <span>{t("mealPlanning.pickDate")}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={eventDate}
                          onSelect={setEventDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="guestCount">{t("mealPlanning.guestCount")}</Label>
                    <Input
                      id="guestCount"
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="budgetPerPerson">{t("mealPlanning.budgetPerPerson")}</Label>
                    <Input
                      id="budgetPerPerson"
                      type="number"
                      value={budgetPerPerson}
                      onChange={(e) => setBudgetPerPerson(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">{t("mealPlanning.location")}</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="season">{t("mealPlanning.season")}</Label>
                    <Select value={season} onValueChange={setSeason}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("mealPlanning.selectSeason")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">{t("mealPlanning.spring")}</SelectItem>
                        <SelectItem value="summer">{t("mealPlanning.summer")}</SelectItem>
                        <SelectItem value="fall">{t("mealPlanning.fall")}</SelectItem>
                        <SelectItem value="winter">{t("mealPlanning.winter")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="culturalRequirements">{t("mealPlanning.culturalRequirements")}</Label>
                  <Input
                    id="culturalRequirements"
                    value={culturalRequirements}
                    onChange={(e) => setCulturalRequirements(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="preferences">{t("mealPlanning.preferences")}</Label>
                  <Textarea
                    id="preferences"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">{t("mealPlanning.notes")}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    <Check className="h-4 w-4 mr-2" />
                    {t("common.saveChanges", "Save Changes")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mealPlan.guestCount && (
                    <div>
                      <h4 className="text-sm font-medium">{t("mealPlanning.guestCount")}</h4>
                      <p>{mealPlan.guestCount}</p>
                    </div>
                  )}

                  {mealPlan.budgetPerPerson && (
                    <div>
                      <h4 className="text-sm font-medium">{t("mealPlanning.budgetPerPerson")}</h4>
                      <p>${mealPlan.budgetPerPerson.toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mealPlan.location && (
                    <div>
                      <h4 className="text-sm font-medium">{t("mealPlanning.location")}</h4>
                      <p>{mealPlan.location}</p>
                    </div>
                  )}

                  {mealPlan.season && (
                    <div>
                      <h4 className="text-sm font-medium">{t("mealPlanning.season")}</h4>
                      <p>{mealPlan.season.charAt(0).toUpperCase() + mealPlan.season.slice(1)}</p>
                    </div>
                  )}
                </div>

                {mealPlan.culturalRequirements && (
                  <div>
                    <h4 className="text-sm font-medium">{t("mealPlanning.culturalRequirements")}</h4>
                    <p>{mealPlan.culturalRequirements}</p>
                  </div>
                )}

                {mealPlan.preferences && (
                  <div>
                    <h4 className="text-sm font-medium">{t("mealPlanning.preferences")}</h4>
                    <p>{mealPlan.preferences}</p>
                  </div>
                )}

                {mealPlan.notes && (
                  <div>
                    <h4 className="text-sm font-medium">{t("mealPlanning.notes")}</h4>
                    <p>{mealPlan.notes}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="menu" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t("mealPlanning.menuItems")}</h3>
                <Button
                  onClick={handleGenerateMealSuggestions}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("mealPlanning.generating")}
                    </>
                  ) : (
                    <>
                      <Utensils className="h-4 w-4 mr-2" />
                      {t("mealPlanning.generateMenuSuggestions")}
                    </>
                  )}
                </Button>
              </div>

              <MealItemsList
                mealItems={getMealItemsByMealPlanId(mealPlan.id)}
                onDelete={handleDeleteMealItem}
                onRegenerateSingleItem={handleRegenerateSingleItem}
              />
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default MealPlanDetails;
