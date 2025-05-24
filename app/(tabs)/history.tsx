import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import DatePicker from "@/components/history/DatePicker";
import { Calendar } from "lucide-react-native";
import TopDateStrip from "@/components/history/top-date-strip";
import { useGlobalContext } from "@/app/context/authprovider";
import { BASE_URL } from "@/constants/constants";
import { RecentlyEaten } from "@/components/history/recently-eaten";
import moment from "moment";

interface Meal {
  _id?: string;
  name: string;
  time: string;
  calories: number;
  fat: number;
  protein: number;
  carbo: number;
  items: string;
  imageUri?: string;
}

const History = () => {
  const [selectedDate, setSelectedDate] = useState(
    moment().tz("Asia/Jerusalem").toDate()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const { user } = useGlobalContext();
  const [mealsID, setMealsID] = useState<string>("");

  const formatDate = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatTimeFromDate = (dateString: string) => {
    const date = moment(dateString).tz("Asia/Jerusalem").toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateForApi = (date: Date) => {
    return moment(date).tz("Asia/Jerusalem").format("YYYY-MM-DD");
  };

  const areMealsDifferent = (newMeals: Meal[], currentMeals: Meal[]) => {
    if (newMeals.length !== currentMeals.length) {
      return true;
    }

    for (let i = 0; i < newMeals.length; i++) {
      const newMeal = newMeals[i];
      const currentMeal = currentMeals[i];

      if (
        newMeal._id !== currentMeal._id ||
        newMeal.name !== currentMeal.name ||
        newMeal.time !== currentMeal.time ||
        newMeal.calories !== currentMeal.calories ||
        newMeal.protein !== currentMeal.protein ||
        newMeal.fat !== currentMeal.fat ||
        newMeal.fat !== currentMeal.fat ||
        newMeal.items !== currentMeal.items
      ) {
        return true;
      }
    }

    return false;
  };

  const fetchMeals = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const dateParam = formatDateForApi(selectedDate);
      const response = await fetch(
        `${BASE_URL}/api/user/${user._id}/get_meals?date=${dateParam}`
      );
      const data = await response.json();
      if (response.ok && data.meals) {
        if (data.meals.length > 0 && data.meals[0].mealsList) {
          setMealsID(data.meals[0]._id);
          const processedMeals = data.meals[0].mealsList.map((meal: Meal) => ({
            _id: meal._id,
            name: meal.name,
            time: formatTimeFromDate(meal.time),
            calories: meal.calories,
            protein: meal.protein || meal.fat,
            carbo: meal.carbo,
            fat: meal.fat,
            imageUri: meal.imageUri,
            items: meal.items,
          }));
          setMeals(processedMeals);
        } else {
          setMeals(data.meals);
        }
      } else {
        console.log("Failed to fetch meals:", data.message);
        setMeals([]);
      }
    } catch (error) {
      console.log("Error fetching meals:", error);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedDate, user?._id]);

  const onRefresh = async () => {
    if (!user?._id) return;
    try {
      const dateParam = formatDateForApi(selectedDate);
      const response = await fetch(
        `${BASE_URL}/api/user/${user._id}/get_meals?date=${dateParam}`
      );
      const data = await response.json();
      if (response.ok && data.meals) {
        if (data.meals.length > 0 && data.meals[0].mealsList) {
          const processedMeals = data.meals[0].mealsList.map((meal: Meal) => ({
            _id: meal._id,
            name: meal.name,
            time: formatTimeFromDate(meal.time),
            calories: meal.calories,
            protein: meal.protein || meal.fat,
            carbo: meal.carbo,
            fat: meal.fat,
            imageUri: meal.imageUri,
            items: meal.items,
          }));
          const mealsChanged = areMealsDifferent(processedMeals, meals);
          if (mealsChanged) {
            setMeals(processedMeals);
          } else {
            return;
          }
        } else {
          console.log("Failed to fetch meals:", data.message);
          setMeals([]);
        }
      }
    } catch (error) {
      console.log("Error fetching meals:", error);
      setMeals([]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Calendar size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showCalendar ? (
        <View style={styles.calendarContainer}>
          <View style={styles.mealHeader}>
            <View style={styles.mealHeaderLine} />
            <Text style={styles.mealHeaderText}>Select a date</Text>
          </View>
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={(d) => {
              setSelectedDate(d);
              setShowCalendar(false);
            }}
            highlightedDates={[]}
          />
        </View>
      ) : (
        <>
          <TopDateStrip
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#BE123C"
                title="Pull to refresh"
                titleColor="#BE123C"
              />
            }
          >
            <View style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={styles.mealHeaderLine} />
                <Text style={styles.mealHeaderText}>
                  Meals for {formatDate(selectedDate)}
                </Text>
              </View>

              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color="#BE123C" />
                  <Text style={styles.loaderText}>Loading meals...</Text>
                </View>
              ) : meals.length > 0 ? (
                <View>
                  <RecentlyEaten
                    recentMeals={meals}
                    onRefresh={onRefresh}
                    userId={user?._id || ""}
                    mealsID={mealsID}
                  />
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Calendar size={24} color="#BE123C" />
                  </View>
                  <Text style={styles.emptyText}>
                    No meals recorded for this date.
                  </Text>
                  <Image
                    source={require("@/assets/images/hungry.png")}
                    style={{ width: 120, height: 120 }}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
      <View className="bg-white -mt-52 h-12"></View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    padding: 5,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    height: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
  },
  mealSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mealHeaderLine: {
    width: 4,
    height: 20,
    backgroundColor: "#BE123C",
    marginRight: 8,
    borderRadius: 2,
  },
  mealHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  loaderContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  mealCard: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    overflow: "hidden",
  },
  mealImageContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
  },
  mealImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
  },
  mealInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  mealTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  mealTime: {
    fontSize: 12,
    color: "#666",
  },
  caloriesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  caloriesText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  nutrientsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  nutrient: {
    flexDirection: "row",
    alignItems: "center",
  },
  nutrientText: {
    marginLeft: 2,
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
});

export default History;
