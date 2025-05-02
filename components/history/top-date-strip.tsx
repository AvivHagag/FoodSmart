import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const TopDateStrip = ({ selectedDate, onDateChange }: Props) => {
  const getWeekDates = (centerDate: Date): Date[] => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(centerDate);
      date.setDate(centerDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);
  const currentMonth = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <View>
      <Text style={styles.monthText}>{currentMonth}</Text>
      <FlatList
        data={weekDates}
        keyExtractor={(item) => item.toDateString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected =
            item.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              onPress={() => onDateChange(item)}
              style={[styles.dayContainer, isSelected && styles.selectedDay]}
            >
              <Text
                style={isSelected ? styles.selectedDayText : styles.dayText}
              >
                {item.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text
                style={[styles.dateText, isSelected && styles.selectedDateText]}
              >
                {item.getDate()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  list: {
    width: "100%",
    marginHorizontal: "auto",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: "#9C68FA",
    paddingVertical: 24,
  },
  dayText: {
    color: "#999",
    fontSize: 14,
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dateText: {
    opacity: 0.6,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedDateText: {
    color: "#fff",
  },
});

export default TopDateStrip;
