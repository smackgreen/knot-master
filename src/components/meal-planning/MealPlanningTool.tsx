import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Plus, Utensils, Clock, Calendar } from "lucide-react";
import { MealPlan, MealType, Client } from "@/types";
import { useTranslation } from "react-i18next";
import CreateMealPlanDialog from "./CreateMealPlanDialog";
import MealPlanCard from "./MealPlanCard";
import MealPlanDetails from "./MealPlanDetails";

interface MealPlanningToolProps {
  clientId: string;
}

const MealPlanningTool = ({ clientId }: MealPlanningToolProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    clients,
    getClientById,
    getMealPlansByClientId,
    addMealPlan,
    updateMealPlan,
    deleteMealPlan
  } = useApp();

  const client = clientId ? getClientById(clientId) : null;
  const mealPlans = clientId ? getMealPlansByClientId(clientId) : [];

  const [isCreating, setIsCreating] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(
    mealPlans.length > 0 ? mealPlans[0] : null
  );

  // Update selected meal plan when meal plans change
  useEffect(() => {
    if (mealPlans.length > 0 && !selectedMealPlan) {
      setSelectedMealPlan(mealPlans[0]);
    } else if (selectedMealPlan && !mealPlans.find(plan => plan.id === selectedMealPlan.id)) {
      setSelectedMealPlan(mealPlans.length > 0 ? mealPlans[0] : null);
    }
  }, [mealPlans, selectedMealPlan]);

  const handleMealPlanCreated = (newMealPlanId: string) => {
    const newMealPlan = mealPlans.find(plan => plan.id === newMealPlanId);
    if (newMealPlan) {
      setSelectedMealPlan(newMealPlan);
      toast.success(t("Meal plan created successfully"));
    }
  };

  const handleDeleteMealPlan = async (mealPlanId: string) => {
    try {
      await deleteMealPlan(mealPlanId);
      toast.success(t("Meal plan deleted successfully"));

      // Select another meal plan if available
      if (selectedMealPlan?.id === mealPlanId) {
        const remainingPlans = mealPlans.filter(plan => plan.id !== mealPlanId);
        setSelectedMealPlan(remainingPlans.length > 0 ? remainingPlans[0] : null);
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      toast.error(t("Failed to delete meal plan"));
    }
  };

  if (!client) {
    return <div>{t("Client not found")}</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-serif font-bold">
            {t("mealPlanning.title")}
          </h2>
        </div>

        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("mealPlanning.newMealPlan")}
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Meal Plans List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("mealPlanning.mealPlans")}</CardTitle>
              <CardDescription>
                {t("mealPlanning.selectMealPlan")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mealPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("mealPlanning.noMealPlans", "No meal plans yet. Create your first meal plan to get started.")}
                </div>
              ) : (
                <div className="space-y-4">
                  {mealPlans.map((mealPlan) => (
                    <MealPlanCard
                      key={mealPlan.id}
                      mealPlan={mealPlan}
                      isSelected={selectedMealPlan?.id === mealPlan.id}
                      onClick={() => setSelectedMealPlan(mealPlan)}
                      onDelete={() => handleDeleteMealPlan(mealPlan.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meal Plan Details */}
        <div className="md:col-span-2">
          {selectedMealPlan ? (
            <MealPlanDetails
              mealPlan={selectedMealPlan}
              onUpdate={(updatedPlan) => updateMealPlan(updatedPlan)}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {t("mealPlanning.selectMealPlanOrCreate")}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("mealPlanning.createMealPlan")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Meal Plan Dialog */}
      <CreateMealPlanDialog
        open={isCreating}
        onOpenChange={setIsCreating}
        clientId={clientId}
        onMealPlanCreated={handleMealPlanCreated}
      />
    </div>
  );
};

export default MealPlanningTool;
