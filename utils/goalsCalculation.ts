import { BASE_URL } from "@/constants/constants";

export async function calculateGoalsMet(userId: string): Promise<number> {
  try {
    // Fetch 30-day statistics to calculate goals met percentage
    const response = await fetch(
      `${BASE_URL}/api/statistics/${userId}?range=30 Days`
    );
    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    const userGoals = data.userGoals;
    const meals = data.meals;

    if (!userGoals?.tdee || meals.length === 0) {
      return 0;
    }

    // Calculate nutrition goals based on TDEE
    const tdee = userGoals.tdee;
    const targetCalories = tdee;
    const targetProtein = Math.round((tdee * 0.3) / 4);
    const targetCarbs = Math.round((tdee * 0.4) / 4);
    const targetFats = Math.round((tdee * 0.3) / 9);

    // Process daily nutrition data
    const dailyNutrition: {
      [key: string]: {
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
      };
    } = {};

    meals.forEach((meal: any) => {
      const mealDate = new Date(meal.date);
      const dateKey = mealDate.toISOString().split("T")[0];

      if (!dailyNutrition[dateKey]) {
        dailyNutrition[dateKey] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };
      }

      dailyNutrition[dateKey].calories += meal.totalCalories || 0;
      dailyNutrition[dateKey].protein += meal.totalProtein || 0;
      dailyNutrition[dateKey].carbs += meal.totalCarbo || 0;
      dailyNutrition[dateKey].fats += meal.totalFat || 0;
    });

    // Calculate goal achievement for days with data
    const daysWithData = Object.values(dailyNutrition).filter(
      (day) => day.calories > 0
    );
    if (daysWithData.length === 0) {
      return 0;
    }

    let totalGoalsMet = 0;
    const targetRanges = {
      calories: { min: targetCalories * 0.8, max: targetCalories * 1.2 }, // ±20% range
      protein: { min: targetProtein * 0.8, max: targetProtein * 1.2 },
      carbs: { min: targetCarbs * 0.7, max: targetCarbs * 1.3 }, // Carbs can be more flexible
      fats: { min: targetFats * 0.7, max: targetFats * 1.3 },
    };

    daysWithData.forEach((day) => {
      let dayGoalsMet = 0;
      let totalGoals = 4; // calories, protein, carbs, fats

      // Check if each macro is within the target range
      if (
        day.calories >= targetRanges.calories.min &&
        day.calories <= targetRanges.calories.max
      ) {
        dayGoalsMet++;
      }
      if (
        day.protein >= targetRanges.protein.min &&
        day.protein <= targetRanges.protein.max
      ) {
        dayGoalsMet++;
      }
      if (
        day.carbs >= targetRanges.carbs.min &&
        day.carbs <= targetRanges.carbs.max
      ) {
        dayGoalsMet++;
      }
      if (
        day.fats >= targetRanges.fats.min &&
        day.fats <= targetRanges.fats.max
      ) {
        dayGoalsMet++;
      }

      totalGoalsMet += (dayGoalsMet / totalGoals) * 100;
    });

    return Math.round(totalGoalsMet / daysWithData.length);
  } catch (error) {
    console.log("Error calculating goals met:", error);
    return 0;
  }
}
