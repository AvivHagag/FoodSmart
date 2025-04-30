import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";
import DatePicker from "@/components/history/DatePicker";
import { Clock, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import TopDateStrip from "@/components/history/top-date-strip";

const History = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    setSelectedDate(new Date());
    console.log(selectedDate);
    console.log("refreshing");
    // try {
    //   // Add your refresh logic here
    //   // For example, refetch history data for the selected date
    //   await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
    // } finally {
    setRefreshing(false);
    // }
  };

  return (
    <LinearGradient
      colors={["#8B5CF6", "#7C3AED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
        <TopDateStrip
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        {showCalendar ? (
          <ScrollView style={styles.content}>
            <View style={styles.mealSection}>
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
                year={selectedDate.getFullYear()}
                onYearChange={(y) =>
                  setSelectedDate(
                    (prev) => new Date(y, prev.getMonth(), prev.getDate())
                  )
                }
              />
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
                title="Pull to refresh"
                titleColor="#8B5CF6"
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

              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Calendar size={24} color="#B388FF" />
                </View>
                <Text style={styles.emptyText}>
                  No meals recorded for this date.
                </Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Meal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  mealHeaderLine: {
    width: 4,
    height: 20,
    backgroundColor: "#9C68FA",
    marginRight: 8,
    borderRadius: 2,
  },
  mealHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(179, 136, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#9C68FA",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default History;
