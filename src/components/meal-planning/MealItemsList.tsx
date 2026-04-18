import { MealItem, CourseType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Tooltip components removed as they're no longer needed

interface MealItemsListProps {
  mealItems: MealItem[];
  onDelete: (mealItemId: string) => void;
  onRegenerateSingleItem?: (mealItemId: string) => void;
}

const MealItemsList = ({ mealItems, onDelete, onRegenerateSingleItem }: MealItemsListProps) => {
  const { t } = useTranslation();

  // Debug: Log the meal items received
  console.log('MealItemsList received items:', mealItems);
  console.log(`MealItemsList received ${mealItems.length} items`);

  // Group meal items by course
  console.log('===== MEAL ITEMS RECEIVED (RAW JSON) =====');
  console.log(JSON.stringify(mealItems, null, 2));

  // If we have no items, show a message
  if (mealItems.length === 0) {
    console.warn('No meal items received!');
  }

  // Initialize groupedItems with empty arrays for each course type
  const groupedItems: Record<CourseType, MealItem[]> = {
    starter: [],
    main: [],
    dessert: [],
    beverage: [],
    snack: []
  };

  // Count items by course type for debugging
  const courseTypeCounts: Record<string, number> = {};

  // First, normalize the course type for each item
  const normalizedItems = mealItems.map(item => {
    // Make a copy of the item to avoid modifying the original
    const normalizedItem = { ...item };

    // Ensure course is a valid CourseType
    if (typeof normalizedItem.course === 'string') {
      // Convert to lowercase and trim
      const courseLower = normalizedItem.course.toLowerCase().trim();

      // Map to valid CourseType
      if (courseLower === 'starter' || courseLower === 'appetizer' || courseLower === 'hors d\'oeuvre') {
        normalizedItem.course = 'starter';
      } else if (courseLower === 'main' || courseLower === 'entree' || courseLower === 'main course') {
        normalizedItem.course = 'main';
      } else if (courseLower === 'dessert' || courseLower === 'sweet') {
        normalizedItem.course = 'dessert';
      } else if (courseLower === 'beverage' || courseLower === 'drink' || courseLower === 'cocktail') {
        normalizedItem.course = 'beverage';
      } else if (courseLower === 'snack' || courseLower === 'side' || courseLower === 'amuse-bouche') {
        normalizedItem.course = 'snack';
      } else {
        // Default to snack if unknown
        console.warn(`Unknown course type: ${normalizedItem.course} for item ${normalizedItem.name}, defaulting to 'snack'`);
        normalizedItem.course = 'snack';
      }
    } else {
      // If course is not a string, default to snack
      console.warn(`Invalid course type: ${normalizedItem.course} for item ${normalizedItem.name}, defaulting to 'snack'`);
      normalizedItem.course = 'snack';
    }

    return normalizedItem;
  });

  console.log("After normalization, we have", normalizedItems.length, "items");

  // Now group the normalized items
  normalizedItems.forEach(item => {
    // Log each item's details
    console.log(`Processing item: ${item.name}, Course: ${item.course}, Type: ${typeof item.course}`);

    // Count items by course type
    courseTypeCounts[item.course] = (courseTypeCounts[item.course] || 0) + 1;

    // Add to the appropriate group
    groupedItems[item.course as CourseType].push(item);
  });

  // Log course type counts
  console.log('===== COURSE TYPE COUNTS =====');
  console.log(courseTypeCounts);

  // Log the final grouped structure
  console.log('===== GROUPED ITEMS STRUCTURE =====');
  Object.entries(groupedItems).forEach(([course, items]) => {
    console.log(`${course}: ${items.length} items`);
    if (items.length > 0) {
      console.log(`  First item: ${items[0].name}`);
    }
  });

  const formatCourseType = (courseType: CourseType) => {
    switch (courseType) {
      case "starter":
        return t("mealPlanning.starters");
      case "main":
        return t("mealPlanning.mainCourses");
      case "dessert":
        return t("mealPlanning.desserts");
      case "beverage":
        return t("mealPlanning.beverages");
      case "snack":
        return t("mealPlanning.snacks");
      default:
        return courseType;
    }
  };

  const getDietaryBadges = (item: MealItem) => {
    const badges = [];

    if (item.isVegetarian) {
      badges.push(
        <Badge key="vegetarian" variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {t("mealPlanning.vegetarian")}
        </Badge>
      );
    }

    if (item.isVegan) {
      badges.push(
        <Badge key="vegan" variant="outline" className="bg-green-50 text-green-800 border-green-200">
          {t("mealPlanning.vegan")}
        </Badge>
      );
    }

    if (item.isGlutenFree) {
      badges.push(
        <Badge key="gluten-free" variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          {t("mealPlanning.glutenFree")}
        </Badge>
      );
    }

    if (item.isDairyFree) {
      badges.push(
        <Badge key="dairy-free" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {t("mealPlanning.dairyFree")}
        </Badge>
      );
    }

    if (item.isNutFree) {
      badges.push(
        <Badge key="nut-free" variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          {t("mealPlanning.nutFree")}
        </Badge>
      );
    }

    if (item.containsAlcohol) {
      badges.push(
        <Badge key="alcohol" variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {t("mealPlanning.containsAlcohol")}
        </Badge>
      );
    }

    return badges;
  };

  if (mealItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("mealPlanning.noMenuItems")}
      </div>
    );
  }

  // Count total displayed items (excluding empty course categories)
  const displayedItemsCount = Object.values(groupedItems)
    .filter(items => items.length > 0)
    .reduce((total, items) => total + items.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-2">
        {t("mealPlanning.displayingItems", "Displaying {{count}} items", { count: displayedItemsCount })}
      </div>
      {Object.entries(groupedItems).map(([course, items]) => {
        if (items.length === 0) return null;

        return (
          <div key={course} className="space-y-3">
            <h4 className="font-medium text-lg">{formatCourseType(course as CourseType)}</h4>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div className="flex gap-4 flex-1">
                      {/* Image display is temporarily hidden
                      {item.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-md"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                            }}
                          />
                        </div>
                      )}
                      */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{item.name}</h5>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {getDietaryBadges(item)}
                        </div>

                        {item.estimatedCostPerPerson && (
                          <p className="text-sm mt-2">
                            {t("mealPlanning.estimatedCost")}: ${item.estimatedCostPerPerson.toFixed(2)} {t("mealPlanning.perPerson")}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.region && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {item.region}
                            </Badge>
                          )}

                          {item.seasonality && item.seasonality.length > 0 && (
                            <div className="flex gap-1 items-center">
                              <span className="text-xs text-muted-foreground">{t("mealPlanning.bestIn")}:</span>
                              {item.seasonality.map((season) => (
                                <Badge key={season} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {season.charAt(0).toUpperCase() + season.slice(1)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!item.meetsAllRequirements && onRegenerateSingleItem && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-amber-600 border-amber-300"
                          onClick={() => onRegenerateSingleItem(item.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="sr-only">{t("mealPlanning.regenerate")}</span>
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t("common.delete")}</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("mealPlanning.deleteMenuItem")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("mealPlanning.deleteMenuItemConfirm")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(item.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealItemsList;
