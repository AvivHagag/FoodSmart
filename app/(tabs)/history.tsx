import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";
import DatePicker from "@/components/history/DatePicker";
import { Clock, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import TopDateStrip from "@/components/history/top-date-strip";
import { BottomSpace } from "@/components/bottom-space";

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
    setRefreshing(false);
  };

  return (
    // <LinearGradient
    //   colors={["#8B5CF6", "#7C3AED"]}
    //   start={{ x: 0, y: 0 }}
    //   end={{ x: 1, y: 1 }}
    //   style={{ height: "100%" }}
    // >
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
            </View>
          </ScrollView>
        </>
      )}
      <View className="bg-white -mt-52 h-12"></View>
    </SafeAreaView>
    // </LinearGradient>
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
    // marginHorizontal: 16,
    // marginTop: 16,
    // marginBottom: 16,
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
    backgroundColor: "#BE123C",
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
