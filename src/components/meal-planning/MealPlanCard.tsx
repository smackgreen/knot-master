import { MealPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { Utensils, Calendar, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
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

interface MealPlanCardProps {
  mealPlan: MealPlan;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const MealPlanCard = ({ mealPlan, isSelected, onClick, onDelete }: MealPlanCardProps) => {
  const { t } = useTranslation();

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return <Clock className="h-4 w-4 mr-1" />;
      case "lunch":
        return <Clock className="h-4 w-4 mr-1" />;
      case "dinner":
        return <Utensils className="h-4 w-4 mr-1" />;
      case "cocktail":
        return <Utensils className="h-4 w-4 mr-1" />;
      default:
        return <Utensils className="h-4 w-4 mr-1" />;
    }
  };

  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-accent"
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{mealPlan.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            {getMealTypeIcon(mealPlan.mealType)}
            <span>{formatMealType(mealPlan.mealType)}</span>
          </div>
          {mealPlan.eventDate && (
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{format(new Date(mealPlan.eventDate), "MMM d, yyyy")}</span>
            </div>
          )}
          {mealPlan.guestCount && (
            <div className="text-sm text-muted-foreground mt-1">
              {t("mealPlanning.guestsCount", { count: mealPlan.guestCount })}
            </div>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t("common.delete")}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("mealPlanning.deleteMealPlan")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("mealPlanning.deleteMealPlanConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                {t("common.delete")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MealPlanCard;
