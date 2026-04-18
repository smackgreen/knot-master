import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Palette, Lightbulb, Image, Trash2 } from "lucide-react";
import { DesignSuggestion, ColorScheme, DecorIdea } from "@/types";
import { generateColorSchemes, generateDecorIdeas } from "@/services/aiService";
import { useTranslation } from "react-i18next";

const DesignSuggestions = () => {
  const { t } = useTranslation();
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const {
    clients,
    getClientById,
    getDesignSuggestionsByClientId,
    addDesignSuggestion,
    updateDesignSuggestion,
    deleteDesignSuggestion,
    addColorScheme,
    deleteColorScheme,
    addDecorIdea,
    deleteDecorIdea
  } = useApp();

  const client = clientId ? getClientById(clientId) : null;
  const designSuggestions = clientId ? getDesignSuggestionsByClientId(clientId) : [];

  const [activeTab, setActiveTab] = useState("color-schemes");
  const [selectedSuggestion, setSelectedSuggestion] = useState<DesignSuggestion | null>(
    designSuggestions.length > 0 ? designSuggestions[0] : null
  );

  const [isCreating, setIsCreating] = useState(designSuggestions.length === 0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Update selected suggestion when design suggestions change
  useEffect(() => {
    console.log("Design suggestions changed:", designSuggestions);

    if (designSuggestions.length > 0) {
      // If there's no selected suggestion or the selected suggestion is not in the list anymore
      if (!selectedSuggestion || !designSuggestions.find(s => s.id === selectedSuggestion.id)) {
        console.log("Setting selected suggestion to first suggestion:", designSuggestions[0]);
        setSelectedSuggestion(designSuggestions[0]);
      } else {
        // Update the selected suggestion with the latest data
        const updatedSuggestion = designSuggestions.find(s => s.id === selectedSuggestion.id);
        if (updatedSuggestion) {
          console.log("Updating selected suggestion with latest data:", updatedSuggestion);
          setSelectedSuggestion(updatedSuggestion);
        }
      }

      // If we're in creating mode but there are suggestions, exit creating mode
      if (isCreating) {
        setIsCreating(false);
      }
    } else if (!isCreating) {
      // If there are no suggestions and we're not in creating mode, enter creating mode
      setIsCreating(true);
    }
  }, [designSuggestions]);

  // Form state
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [season, setSeason] = useState("");
  const [preferences, setPreferences] = useState("");
  const [category, setCategory] = useState<string>("centerpiece");

  // Handle creating a new design suggestion
  const handleCreateSuggestion = async () => {
    if (!clientId) {
      console.log("No client ID found");
      toast.error(t("designSuggestions.clientIdMissing"));
      return;
    }

    if (!name) {
      toast.error(t("designSuggestions.enterName"));
      return;
    }

    try {
      console.log("Creating design suggestion with:", { clientId, name, theme, season, preferences });

      const suggestionId = await addDesignSuggestion({
        clientId,
        name,
        theme,
        season,
        preferences
      });

      console.log("Created design suggestion with ID:", suggestionId);

      if (suggestionId) {
        // Wait a moment for the state to update
        setTimeout(() => {
          // Get the updated list of design suggestions
          const updatedSuggestions = getDesignSuggestionsByClientId(clientId);
          console.log("Updated suggestions:", updatedSuggestions);

          const newSuggestion = updatedSuggestions.find(s => s.id === suggestionId);
          console.log("New suggestion:", newSuggestion);

          if (newSuggestion) {
            setSelectedSuggestion(newSuggestion);
            setIsCreating(false);
            toast.success(t("designSuggestions.createdSuccess"));
          } else {
            console.error("Could not find newly created suggestion");

            // Create a temporary suggestion object to display
            const tempSuggestion: DesignSuggestion = {
              id: suggestionId,
              clientId,
              name,
              theme: theme || '',
              season: season || '',
              preferences: preferences || '',
              colorSchemes: [],
              decorIdeas: [],
              visualizations: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            console.log("Using temporary suggestion:", tempSuggestion);
            setSelectedSuggestion(tempSuggestion);
            setIsCreating(false);
            toast.success(t("designSuggestions.createdSuccess"));
          }
        }, 500); // Wait 500ms for state to update
      }
    } catch (error) {
      console.error("Error creating design suggestion:", error);
      toast.error(t("designSuggestions.createError"));
    }
  };

  // Handle generating color schemes
  const handleGenerateColorSchemes = async () => {
    if (!selectedSuggestion) {
      console.log("No selected suggestion found");
      toast.error(t("designSuggestions.selectSuggestion"));
      return;
    }

    console.log("Generating color schemes for suggestion:", selectedSuggestion);
    setIsGenerating(true);
    try {
      const colorPalettes = await generateColorSchemes({
        theme: selectedSuggestion.theme,
        season: selectedSuggestion.season,
        preferences: selectedSuggestion.preferences
      });

      console.log("Generated color palettes:", colorPalettes);

      // Save each color in each palette to the database
      for (const palette of colorPalettes) {
        for (const color of palette.colors) {
          await addColorScheme({
            suggestionId: selectedSuggestion.id,
            name: palette.name,
            type: color.type,
            hexValue: color.hexValue
          });
        }
      }

      // Refresh the design suggestions to get the latest data
      if (clientId) {
        const updatedSuggestions = getDesignSuggestionsByClientId(clientId);
        const updatedSelectedSuggestion = updatedSuggestions.find(s => s.id === selectedSuggestion.id);
        if (updatedSelectedSuggestion) {
          setSelectedSuggestion(updatedSelectedSuggestion);
        }
      }

      toast.success(t("designSuggestions.colorSchemesGenerated"));
    } catch (error) {
      console.error("Error generating color schemes:", error);
      toast.error(t("designSuggestions.colorSchemesError"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle generating decor ideas
  const handleGenerateDecorIdeas = async () => {
    if (!selectedSuggestion) {
      console.log("No selected suggestion found");
      toast.error(t("designSuggestions.selectSuggestion"));
      return;
    }

    if (!category) {
      console.log("No category selected");
      toast.error(t("designSuggestions.selectCategory"));
      return;
    }

    console.log("Generating decor ideas for suggestion:", selectedSuggestion, "category:", category);
    setIsGenerating(true);
    try {
      const decorIdeas = await generateDecorIdeas({
        theme: selectedSuggestion.theme,
        season: selectedSuggestion.season,
        preferences: selectedSuggestion.preferences,
        category
      });

      console.log("Generated decor ideas:", decorIdeas);

      // Save each decor idea to the database
      for (const idea of decorIdeas) {
        await addDecorIdea({
          suggestionId: selectedSuggestion.id,
          category: idea.category,
          description: idea.description
        });
      }

      // Refresh the design suggestions to get the latest data
      if (clientId) {
        const updatedSuggestions = getDesignSuggestionsByClientId(clientId);
        const updatedSelectedSuggestion = updatedSuggestions.find(s => s.id === selectedSuggestion.id);
        if (updatedSelectedSuggestion) {
          setSelectedSuggestion(updatedSelectedSuggestion);
        }
      }

      toast.success(t("designSuggestions.decorIdeasGenerated"));
    } catch (error) {
      console.error("Error generating decor ideas:", error);
      toast.error(t("designSuggestions.decorIdeasError"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle deleting a color scheme
  const handleDeleteColorScheme = async (id: string) => {
    try {
      console.log("Deleting color scheme with ID:", id);
      await deleteColorScheme(id);

      // Refresh the design suggestions to get the latest data
      if (clientId && selectedSuggestion) {
        const updatedSuggestions = getDesignSuggestionsByClientId(clientId);
        const updatedSelectedSuggestion = updatedSuggestions.find(s => s.id === selectedSuggestion.id);
        if (updatedSelectedSuggestion) {
          setSelectedSuggestion(updatedSelectedSuggestion);
        }
      }

      toast.success(t("designSuggestions.colorSchemeDeleted"));
    } catch (error) {
      console.error("Error deleting color scheme:", error);
      toast.error(t("designSuggestions.deleteColorSchemeError"));
    }
  };

  // Handle deleting a decor idea
  const handleDeleteDecorIdea = async (id: string) => {
    try {
      console.log("Deleting decor idea with ID:", id);
      await deleteDecorIdea(id);

      // Refresh the design suggestions to get the latest data
      if (clientId && selectedSuggestion) {
        const updatedSuggestions = getDesignSuggestionsByClientId(clientId);
        const updatedSelectedSuggestion = updatedSuggestions.find(s => s.id === selectedSuggestion.id);
        if (updatedSelectedSuggestion) {
          setSelectedSuggestion(updatedSelectedSuggestion);
        }
      }

      toast.success(t("designSuggestions.decorIdeaDeleted"));
    } catch (error) {
      console.error("Error deleting decor idea:", error);
      toast.error(t("designSuggestions.deleteDecorIdeaError"));
    }
  };

  // Group color schemes by palette name
  const groupedColorSchemes = selectedSuggestion?.colorSchemes?.reduce((acc, scheme) => {
    if (!acc[scheme.name]) {
      acc[scheme.name] = [];
    }
    acc[scheme.name].push(scheme);
    return acc;
  }, {} as Record<string, ColorScheme[]>) || {};

  // Group decor ideas by category
  const groupedDecorIdeas = selectedSuggestion?.decorIdeas?.reduce((acc, idea) => {
    if (!acc[idea.category]) {
      acc[idea.category] = [];
    }
    acc[idea.category].push(idea);
    return acc;
  }, {} as Record<string, DecorIdea[]>) || {};

  if (!client) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Client not found</h1>
        <Button onClick={() => navigate("/clients")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate(`/clients/${clientId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-serif font-bold">
            Design Suggestions for {client.name}
          </h1>
        </div>

        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Design Suggestion
          </Button>
        )}
      </div>

      {/* Create New Design Suggestion Form */}
      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New Design Suggestion</CardTitle>
            <CardDescription>
              Create a new design suggestion to generate color schemes and decor ideas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Summer Garden Wedding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  placeholder="Rustic, Bohemian, Elegant, etc."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="season">Season</Label>
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="preferences">Preferences</Label>
                <Textarea
                  id="preferences"
                  placeholder="Lavender and sage colors, natural materials, etc."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSuggestion}>
                  Create Design Suggestion
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Design Suggestions Content */}
      {!isCreating && selectedSuggestion && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="color-schemes">
              <Palette className="mr-2 h-4 w-4" />
              Color Schemes
            </TabsTrigger>
            <TabsTrigger value="decor-ideas">
              <Lightbulb className="mr-2 h-4 w-4" />
              Decor Ideas
            </TabsTrigger>
            <TabsTrigger value="visualization">
              <Image className="mr-2 h-4 w-4" />
              Visualization
            </TabsTrigger>
          </TabsList>

          {/* Color Schemes Tab */}
          <TabsContent value="color-schemes">
            <Card>
              <CardHeader>
                <CardTitle>Color Schemes</CardTitle>
                <CardDescription>
                  Generate color palettes based on the wedding theme, season, and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button
                    onClick={handleGenerateColorSchemes}
                    disabled={isGenerating}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Generate Color Schemes
                  </Button>
                </div>

                {Object.entries(groupedColorSchemes).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No color schemes generated yet. Click the button above to generate some.
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {Object.entries(groupedColorSchemes).map(([paletteName, colors]) => (
                      <div key={paletteName} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium">{paletteName}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Delete all colors in this palette
                              colors.forEach(color => handleDeleteColorScheme(color.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {colors.map(color => (
                            <div key={color.id} className="flex flex-col items-center">
                              <div
                                className="w-16 h-16 rounded-md border"
                                style={{ backgroundColor: color.hexValue }}
                              />
                              <span className="text-xs mt-1">{color.hexValue}</span>
                              <span className="text-xs text-muted-foreground">{color.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decor Ideas Tab */}
          <TabsContent value="decor-ideas">
            <Card>
              <CardHeader>
                <CardTitle>Decor Ideas</CardTitle>
                <CardDescription>
                  Generate decor ideas based on the wedding theme, season, and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="w-64">
                    <Label htmlFor="category" className="mb-2 block">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centerpiece">Centerpieces</SelectItem>
                        <SelectItem value="backdrop">Backdrops</SelectItem>
                        <SelectItem value="lighting">Lighting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleGenerateDecorIdeas}
                      disabled={isGenerating}
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate {category === "centerpiece" ? "Centerpiece" :
                               category === "backdrop" ? "Backdrop" :
                               "Lighting"} Ideas
                    </Button>
                  </div>
                </div>

                {Object.entries(groupedDecorIdeas).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No decor ideas generated yet. Select a category and click the button above to generate some.
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {Object.entries(groupedDecorIdeas).map(([categoryName, ideas]) => (
                      <div key={categoryName} className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium capitalize mb-4">{categoryName} Ideas</h3>
                        <div className="grid gap-4">
                          {ideas.map(idea => (
                            <div key={idea.id} className="flex justify-between gap-4 border-b pb-4">
                              <div>
                                <p>{idea.description}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDecorIdea(idea.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization">
            <Card>
              <CardHeader>
                <CardTitle>Visualization</CardTitle>
                <CardDescription>
                  Upload a venue photo and visualize how the color schemes and decor ideas would look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Visualization feature coming soon!
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DesignSuggestions;
