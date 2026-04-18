/**
 * AI Service for Design Suggestions and Meal Planning
 *
 * This service handles interactions with AI APIs (OpenAI or Deepseek)
 * for generating design suggestions, color schemes, decor ideas,
 * and meal planning suggestions.
 */

import { ColorScheme, ColorSchemeType, DecorIdea, MealItem, CourseType, MealType } from "@/types";

// API keys - in production, these should be stored securely
// and accessed via environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

// API URLs
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface ColorPalette {
  name: string;
  colors: {
    type: ColorSchemeType;
    hexValue: string;
  }[];
}

interface GenerateColorSchemesParams {
  theme?: string;
  season?: string;
  preferences?: string;
}

interface GenerateDecorIdeasParams {
  theme?: string;
  season?: string;
  preferences?: string;
  budget?: string;
  culture?: string;
  category: string; // 'centerpiece', 'backdrop', 'lighting'
}

/**
 * Generate color schemes based on wedding theme, season, and preferences
 */
export const generateColorSchemes = async (
  params: GenerateColorSchemesParams
): Promise<ColorPalette[]> => {
  const { theme, season, preferences } = params;

  if (!OPENAI_API_KEY) {
    // If no API key is available, return mock data
    return getMockColorSchemes(theme, season, preferences);
  }

  try {
    const prompt = `
      Generate 3 color palettes for a wedding with the following details:
      ${theme ? `Theme: ${theme}` : ''}
      ${season ? `Season: ${season}` : ''}
      ${preferences ? `Preferences: ${preferences}` : ''}

      For each palette, provide:
      1. A descriptive name for the palette
      2. 5-7 colors with their hex codes
      3. Label each color as "primary", "accent", or "neutral"

      Format the response as a JSON array of objects with this structure:
      [
        {
          "name": "Palette Name",
          "colors": [
            { "type": "primary", "hexValue": "#HEXCODE" },
            { "type": "accent", "hexValue": "#HEXCODE" },
            ...
          ]
        },
        ...
      ]
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a wedding design expert specializing in color theory and aesthetics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return getMockColorSchemes(theme, season, preferences);
    }

    const content = data.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    return parsedContent.palettes || [];
  } catch (error) {
    console.error("Error generating color schemes:", error);
    return getMockColorSchemes(theme, season, preferences);
  }
};

/**
 * Generate decor ideas based on wedding theme, season, and preferences
 */
export const generateDecorIdeas = async (
  params: GenerateDecorIdeasParams
): Promise<DecorIdea[]> => {
  const { theme, season, preferences, budget, culture, category } = params;

  if (!OPENAI_API_KEY) {
    // If no API key is available, return mock data
    return getMockDecorIdeas(category, theme, season);
  }

  try {
    const prompt = `
      Generate 5 creative ${category} ideas for a wedding with the following details:
      ${theme ? `Theme: ${theme}` : ''}
      ${season ? `Season: ${season}` : ''}
      ${preferences ? `Preferences: ${preferences}` : ''}
      ${budget ? `Budget range: ${budget}` : ''}
      ${culture ? `Cultural considerations: ${culture}` : ''}

      For each idea, provide a detailed description including materials, colors, and arrangement.

      Format the response as a JSON array of objects with this structure:
      [
        {
          "category": "${category}",
          "description": "Detailed description of the idea"
        },
        ...
      ]
    `;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a wedding design expert specializing in decor and aesthetics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return getMockDecorIdeas(category, theme, season);
    }

    const content = data.choices[0].message.content;
    const parsedContent = JSON.parse(content);

    // Generate unique IDs for each idea
    return (parsedContent.ideas || []).map((idea: any, index: number) => ({
      id: `mock-${category}-${index}`,
      suggestionId: "temp-suggestion-id",
      category,
      description: idea.description,
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error generating ${category} ideas:`, error);
    return getMockDecorIdeas(category, theme, season);
  }
};

// Mock data functions for fallback when API is not available
function getMockColorSchemes(
  _theme?: string,
  _season?: string,
  _preferences?: string
): ColorPalette[] {
  // Default palettes based on common wedding themes
  const defaultPalettes = [
    {
      name: "Elegant Blush",
      colors: [
        { type: "primary" as ColorSchemeType, hexValue: "#F8C3CD" },
        { type: "primary" as ColorSchemeType, hexValue: "#E8B5CE" },
        { type: "accent" as ColorSchemeType, hexValue: "#D3A5C9" },
        { type: "accent" as ColorSchemeType, hexValue: "#A3A1CF" },
        { type: "neutral" as ColorSchemeType, hexValue: "#F5F5F5" },
        { type: "neutral" as ColorSchemeType, hexValue: "#E5E5E5" }
      ]
    },
    {
      name: "Rustic Autumn",
      colors: [
        { type: "primary" as ColorSchemeType, hexValue: "#A76F6F" },
        { type: "primary" as ColorSchemeType, hexValue: "#C98474" },
        { type: "accent" as ColorSchemeType, hexValue: "#F2D388" },
        { type: "accent" as ColorSchemeType, hexValue: "#7D8E95" },
        { type: "neutral" as ColorSchemeType, hexValue: "#F8F4E3" },
        { type: "neutral" as ColorSchemeType, hexValue: "#EDEADE" }
      ]
    },
    {
      name: "Modern Minimalist",
      colors: [
        { type: "primary" as ColorSchemeType, hexValue: "#2C3E50" },
        { type: "primary" as ColorSchemeType, hexValue: "#34495E" },
        { type: "accent" as ColorSchemeType, hexValue: "#7F8C8D" },
        { type: "accent" as ColorSchemeType, hexValue: "#BDC3C7" },
        { type: "neutral" as ColorSchemeType, hexValue: "#ECF0F1" },
        { type: "neutral" as ColorSchemeType, hexValue: "#FFFFFF" }
      ]
    }
  ];

  return defaultPalettes;
}

function getMockDecorIdeas(
  category: string,
  _theme?: string,
  _season?: string
): DecorIdea[] {
  const ideas: Record<string, string[]> = {
    centerpiece: [
      "Tall crystal vases filled with white orchids and hanging crystals, surrounded by votive candles for an elegant, sophisticated look.",
      "Rustic wooden boxes filled with seasonal wildflowers, baby's breath, and greenery, perfect for a country or barn wedding.",
      "Geometric terrariums filled with succulents and air plants, accented with copper wire fairy lights for a modern, minimalist aesthetic.",
      "Vintage books stacked and topped with small arrangements of roses and peonies, ideal for a literary or vintage-themed wedding.",
      "Floating candles and flower petals in clear glass bowls, creating a romantic, ethereal atmosphere."
    ],
    backdrop: [
      "Cascading fabric drapery in sheer white or ivory, adorned with fairy lights for a dreamy, ethereal backdrop.",
      "Living wall of greenery interspersed with white flowers, creating a lush, garden-inspired setting.",
      "Geometric wooden frame decorated with asymmetrical flower arrangements and hanging glass terrariums.",
      "Vintage window frames or doors arranged in a gallery wall style, decorated with vines and small floral accents.",
      "Macramé hanging with dried flowers and pampas grass for a boho-chic aesthetic."
    ],
    lighting: [
      "Cascading crystal chandeliers at varying heights, creating a luxurious, elegant atmosphere.",
      "Edison bulb string lights crisscrossed overhead for a warm, vintage industrial feel.",
      "Paper lanterns in various sizes and complementary colors for a whimsical, festive ambiance.",
      "Candle walls with hundreds of pillar candles at different heights for a romantic, intimate setting.",
      "Uplighting in soft colors to transform plain walls and highlight architectural features of the venue."
    ]
  };

  return (ideas[category] || []).map((description, index) => ({
    id: `mock-${category}-${index}`,
    suggestionId: "temp-suggestion-id",
    category,
    description,
    createdAt: new Date().toISOString()
  }));
}

interface GenerateMealSuggestionsParams {
  mealType: MealType;
  guestCount?: number;
  season?: string;
  location?: string;
  budgetPerPerson?: number;
  culturalRequirements?: string;
  dietaryRestrictions?: string[];
  preferences?: string;
  notes?: string;
}

interface RegenerateSingleMealItemParams {
  mealType: MealType;
  courseType: CourseType;
  originalItemName: string;
  season?: string;
  location?: string;
  dietaryRestrictions?: string[];
  notes?: string;
}

/**
 * Generate meal suggestions based on wedding details and preferences
 */
export const generateMealSuggestions = async (
  params: GenerateMealSuggestionsParams
): Promise<MealItem[]> => {
  const {
    mealType,
    guestCount,
    season,
    location,
    budgetPerPerson,
    culturalRequirements,
    dietaryRestrictions,
    preferences,
    notes
  } = params;

  // Check if any API keys are available
  if (!OPENAI_API_KEY && !DEEPSEEK_API_KEY) {
    console.error("No API keys available");
    throw new Error("Either OpenAI or Deepseek API key is required for meal suggestions");
  }

  // Use the standard prompt template with a timestamp to ensure uniqueness
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).substring(2, 15);
  const prompt = `
[Request ID: ${timestamp}-${randomId}]
Generate a complete ${mealType.toUpperCase()} menu for a wedding with the following details, in order of priority:

    1. **Location:** ${location}
    2. **Season:** ${season}
    3. **Budget per Person:** $${budgetPerPerson}
    4. **Guest Count:** ${guestCount}
    5. **Cultural Requirements:** ${culturalRequirements || "None"}
    6. **Dietary Restrictions:** ${dietaryRestrictions?.length > 0 ? dietaryRestrictions.join(', ') : "None"}
    7. **Preferences:** ${preferences || "None"}
    8. **Additional Notes:** ${notes || "None"}

    IMPORTANT REQUIREMENTS:
    1. This is a ${mealType.toUpperCase()} menu, so provide ONLY appropriate ${mealType} dishes.
    2. Prioritize popular dishes and ingredients that are commonly served during weddings in this ${season} season
    3. Prioritize regional or locally inspired dishes from ${location}.
    4. For each dish, include information about seasonality and region.
    5. Use ${notes || "client preferences"}. to guide tone, cuisine style (e.g. mild, spicy), and cultural context.
    6. Include a balanced selection of starters, main courses, sides, and desserts appropriate for ${mealType}.
    7. IMPORTANT: Generate unique dishes based on the inputs above. Do not reuse dishes from previous responses.

    For each menu item, provide:
    1. Name of the dish
    2. Brief description including key ingredients and preparation method
    3. Course type (starter, main, dessert, beverage, or snack)
    4. Dietary information (vegetarian, vegan, gluten-free, dairy-free, nut-free, contains alcohol)
    5. Estimated cost per person
    6. Seasonality (which seasons the dish is best suited for)
    7. Region or cuisine type the dish originates from
    8. A URL to a representative image of the dish (use realistic, high-quality food photography URLs)

    Format the response as a JSON array of objects with this structure:
    {
      "items": [
        {
          "name": "Dish Name",
          "description": "Description of the dish",
          "course": "starter|main|dessert|beverage|snack",
          "isVegetarian": true|false,
          "isVegan": true|false,
          "isGlutenFree": true|false,
          "isDairyFree": true|false,
          "isNutFree": true|false,
          "containsAlcohol": true|false,
          "estimatedCostPerPerson": number,
          "seasonality": ["spring", "summer", "fall", "winter"],
          "region": "Region or cuisine type",
          "imageUrl": "https://example.com/image.jpg"
        },
        ...
      ]
    }
  `;

  // Log the final prompt with all variables replaced
  console.log("%c===== MEAL PLANNING API PROMPT =====", "color: green; font-weight: bold; font-size: 16px;");
  console.log("%c" + prompt, "color: blue;");

  // Also log to document for visibility in case console is not open
  const debugDiv = document.createElement('div');
  debugDiv.style.display = 'none';
  debugDiv.textContent = `MEAL PLANNING API PROMPT: ${prompt}`;
  document.body.appendChild(debugDiv);

  // Try OpenAI first if the key is available
  if (OPENAI_API_KEY) {
    try {
      console.log("Trying OpenAI API...");
      const requestBody = {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional wedding caterer and culinary expert specializing in creating memorable dining experiences for weddings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9, // Higher temperature for more variety
        response_format: { type: "json_object" }
      };

      // Log the complete request body
      console.log("%c===== OPENAI API REQUEST BODY =====", "color: purple; font-weight: bold; font-size: 16px;");
      console.log("%c" + JSON.stringify(requestBody, null, 2), "color: darkblue;");

      // Add a cache-busting parameter to the URL with multiple random values
      const cacheBuster = `?t=${Date.now()}&r=${Math.random()}&nocache=true`;
      const response = await fetch(`${OPENAI_API_URL}${cacheBuster}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // Log the API response
      console.log("%c===== OPENAI API RESPONSE =====", "color: green; font-weight: bold; font-size: 16px;");
      console.log("%c" + JSON.stringify(data, null, 2), "color: darkgreen;");

      if (!data.error) {
        const content = data.choices[0].message.content;
        console.log("%c===== PARSED CONTENT FROM API =====", "color: blue; font-weight: bold; font-size: 16px;");
        console.log("%c" + content, "color: darkblue;");

        const parsedContent = JSON.parse(content);
        console.log("%c===== PARSED JSON CONTENT =====", "color: blue; font-weight: bold; font-size: 16px;");
        console.log(parsedContent);

        // Generate unique IDs for each meal item
        return (parsedContent.items || []).map((item: any, index: number) => ({
          id: `openai-meal-${index}`,
          mealPlanId: "temp-meal-plan-id",
          name: item.name,
          description: item.description,
          course: item.course as CourseType,
          isVegetarian: item.isVegetarian || false,
          isVegan: item.isVegan || false,
          isGlutenFree: item.isGlutenFree || false,
          isDairyFree: item.isDairyFree || false,
          isNutFree: item.isNutFree || false,
          containsAlcohol: item.containsAlcohol || false,
          estimatedCostPerPerson: item.estimatedCostPerPerson,
          imageUrl: item.imageUrl || '',
          seasonality: item.seasonality || [],
          region: item.region || '',
          notes: item.notes || '',
          createdAt: new Date().toISOString()
        }));
      } else {
        console.error("OpenAI API error:", data.error);

        // If OpenAI fails and Deepseek is available, try Deepseek
        if (DEEPSEEK_API_KEY) {
          console.log("OpenAI failed, trying Deepseek API...");
          return await tryDeepseekAPI(prompt, mealType);
        } else {
          throw new Error(`OpenAI API error: ${JSON.stringify(data.error)}`);
        }
      }
    } catch (error) {
      console.error(`Error with OpenAI API:`, error);

      // If OpenAI fails and Deepseek is available, try Deepseek
      if (DEEPSEEK_API_KEY) {
        console.log("OpenAI failed, trying Deepseek API...");
        return await tryDeepseekAPI(prompt, mealType);
      } else {
        throw error;
      }
    }
  }
  // If OpenAI key is not available but Deepseek is, try Deepseek
  else if (DEEPSEEK_API_KEY) {
    console.log("No OpenAI key, trying Deepseek API...");
    return await tryDeepseekAPI(prompt, mealType);
  } else {
    // This should never be reached due to the checks above
    throw new Error("No API keys available for meal suggestions");
  }
};

/**
 * Regenerate a single meal item based on specific requirements
 */
export const regenerateSingleMealItem = async (
  params: RegenerateSingleMealItemParams
): Promise<MealItem[]> => {
  const {
    mealType,
    courseType,
    originalItemName,
    season,
    location,
    dietaryRestrictions,
    notes
  } = params;

  // Check if any API keys are available
  if (!OPENAI_API_KEY && !DEEPSEEK_API_KEY) {
    console.error("No API keys available");
    throw new Error("Either OpenAI or Deepseek API key is required for meal suggestions");
  }

  // Create a specific prompt for regenerating a single item with a timestamp to ensure uniqueness
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).substring(2, 15);
  const prompt = `
[Request ID: ${timestamp}-${randomId}]
Generate a replacement for the ${courseType} dish "${originalItemName}" for a ${mealType} menu that meets these requirements:
${dietaryRestrictions?.length > 0 ? `- Must respect these dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
${season ? `- Must be seasonal for ${season}` : ''}
${location ? `- Should be from or inspired by ${location} cuisine if possible` : ''}
${notes ? `- Additional notes: ${notes}` : ''}

IMPORTANT INSTRUCTIONS:
1. The replacement should be similar in style but meet all the requirements.
2. The dish MUST be different from "${originalItemName}" - create a completely new dish.
3. The dish must be appropriate for a ${mealType} meal and be a ${courseType} course.
4. Generate a unique dish that has not been suggested before.

Format the response as a JSON array of objects with this structure:
{
  "items": [
    {
      "name": "Dish Name",
      "description": "Description of the dish",
      "course": "${courseType}",
      "isVegetarian": true|false,
      "isVegan": true|false,
      "isGlutenFree": true|false,
      "isDairyFree": true|false,
      "isNutFree": true|false,
      "containsAlcohol": true|false,
      "estimatedCostPerPerson": number,
      "seasonality": ["spring", "summer", "fall", "winter"],
      "region": "Region or cuisine type",
      "imageUrl": "https://example.com/image.jpg"
    }
  ]
}
`;

  // Log the final prompt with all variables replaced
  console.log("%c===== REGENERATE SINGLE MEAL ITEM PROMPT =====", "color: green; font-weight: bold; font-size: 16px;");
  console.log("%c" + prompt, "color: blue;");

  // Also log to document for visibility in case console is not open
  const debugDiv = document.createElement('div');
  debugDiv.style.display = 'none';
  debugDiv.textContent = `REGENERATE SINGLE MEAL ITEM PROMPT: ${prompt}`;
  document.body.appendChild(debugDiv);

  // Try OpenAI first if the key is available
  if (OPENAI_API_KEY) {
    try {
      console.log("Trying OpenAI API for single item regeneration...");
      const requestBody = {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional wedding caterer and culinary expert specializing in creating memorable dining experiences for weddings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9, // Higher temperature for more variety
        response_format: { type: "json_object" }
      };

      // Log the complete request body
      console.log("%c===== REGENERATE SINGLE MEAL ITEM REQUEST BODY =====", "color: purple; font-weight: bold; font-size: 16px;");
      console.log("%c" + JSON.stringify(requestBody, null, 2), "color: darkblue;");

      // Add a cache-busting parameter to the URL with multiple random values
      const cacheBuster = `?t=${Date.now()}&r=${Math.random()}&nocache=true`;
      const response = await fetch(`${OPENAI_API_URL}${cacheBuster}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // Log the API response
      console.log("%c===== REGENERATE SINGLE MEAL ITEM API RESPONSE =====", "color: green; font-weight: bold; font-size: 16px;");
      console.log("%c" + JSON.stringify(data, null, 2), "color: darkgreen;");

      if (!data.error) {
        const content = data.choices[0].message.content;
        console.log("%c===== PARSED CONTENT FROM API =====", "color: blue; font-weight: bold; font-size: 16px;");
        console.log("%c" + content, "color: darkblue;");

        const parsedContent = JSON.parse(content);
        console.log("%c===== PARSED JSON CONTENT =====", "color: blue; font-weight: bold; font-size: 16px;");
        console.log(parsedContent);

        // Generate unique IDs for each meal item
        return (parsedContent.items || []).map((item: any, index: number) => ({
          id: `openai-regenerated-${index}`,
          mealPlanId: "temp-meal-plan-id",
          name: item.name,
          description: item.description,
          course: item.course as CourseType,
          isVegetarian: item.isVegetarian || false,
          isVegan: item.isVegan || false,
          isGlutenFree: item.isGlutenFree || false,
          isDairyFree: item.isDairyFree || false,
          isNutFree: item.isNutFree || false,
          containsAlcohol: item.containsAlcohol || false,
          estimatedCostPerPerson: item.estimatedCostPerPerson,
          imageUrl: item.imageUrl || '',
          seasonality: item.seasonality || [],
          region: item.region || '',
          notes: item.notes || '',
          createdAt: new Date().toISOString()
        }));
      } else {
        console.error("OpenAI API error:", data.error);

        // If OpenAI fails and Deepseek is available, try Deepseek
        if (DEEPSEEK_API_KEY) {
          console.log("OpenAI failed, trying Deepseek API for single item regeneration...");
          return await tryDeepseekAPI(prompt, mealType);
        } else {
          throw new Error(`OpenAI API error: ${JSON.stringify(data.error)}`);
        }
      }
    } catch (error) {
      console.error(`Error with OpenAI API:`, error);

      // If OpenAI fails and Deepseek is available, try Deepseek
      if (DEEPSEEK_API_KEY) {
        console.log("OpenAI failed, trying Deepseek API for single item regeneration...");
        return await tryDeepseekAPI(prompt, mealType);
      } else {
        throw error;
      }
    }
  }
  // If OpenAI key is not available but Deepseek is, try Deepseek
  else if (DEEPSEEK_API_KEY) {
    console.log("No OpenAI key, trying Deepseek API for single item regeneration...");
    return await tryDeepseekAPI(prompt, mealType);
  } else {
    // This should never be reached due to the checks above
    throw new Error("No API keys available for meal suggestions");
  }
};

// Helper function to try the Deepseek API
async function tryDeepseekAPI(
  prompt: string,
  _mealType: MealType // Prefixed with underscore to indicate it's not used directly
): Promise<MealItem[]> {
  try {
    // Log the prompt being sent to Deepseek API
    console.log("%c===== DEEPSEEK API PROMPT =====", "color: green; font-weight: bold; font-size: 16px;");
    console.log("%c" + prompt, "color: blue;");

    const requestBody = {
      model: "deepseek-coder",
      messages: [
        {
          role: "system",
          content: "You are a professional wedding caterer and culinary expert specializing in creating memorable dining experiences for weddings. You must follow all dietary requirements exactly, especially kosher and halal requirements. You must provide appropriate dishes for the specified meal type (breakfast, lunch, dinner, or cocktail)."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8, // Higher temperature for more variety
      response_format: { type: "json_object" },
      max_tokens: 2000
    };

    // Log the complete request body
    console.log("%c===== DEEPSEEK API REQUEST BODY =====", "color: purple; font-weight: bold; font-size: 16px;");
    console.log("%c" + JSON.stringify(requestBody, null, 2), "color: darkblue;");

    // Add a cache-busting parameter to the URL with multiple random values
    const cacheBuster = `?t=${Date.now()}&r=${Math.random()}&nocache=true`;
    const response = await fetch(`${DEEPSEEK_API_URL}${cacheBuster}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Log the API response
    console.log("%c===== DEEPSEEK API RESPONSE =====", "color: green; font-weight: bold; font-size: 16px;");
    console.log("%c" + JSON.stringify(data, null, 2), "color: darkgreen;");

    if (data.error) {
      console.error("Deepseek API error:", data.error);
      throw new Error(`Deepseek API error: ${JSON.stringify(data.error)}`);
    }

    const content = data.choices[0].message.content;
    console.log("%c===== PARSED CONTENT FROM DEEPSEEK API =====", "color: blue; font-weight: bold; font-size: 16px;");
    console.log("%c" + content, "color: darkblue;");

    const parsedContent = JSON.parse(content);
    console.log("%c===== PARSED JSON CONTENT FROM DEEPSEEK =====", "color: blue; font-weight: bold; font-size: 16px;");
    console.log(parsedContent);

    // Generate unique IDs for each meal item
    return (parsedContent.items || []).map((item: any, index: number) => ({
      id: `deepseek-meal-${index}`,
      mealPlanId: "temp-meal-plan-id",
      name: item.name,
      description: item.description,
      course: item.course as CourseType,
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      isGlutenFree: item.isGlutenFree || false,
      isDairyFree: item.isDairyFree || false,
      isNutFree: item.isNutFree || false,
      containsAlcohol: item.containsAlcohol || false,
      estimatedCostPerPerson: item.estimatedCostPerPerson,
      imageUrl: item.imageUrl || '',
      seasonality: item.seasonality || [],
      region: item.region || '',
      notes: item.notes || '',
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Error with Deepseek API:`, error);
    throw error;
  }
}


