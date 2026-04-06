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
    <View style={styles.wrapper}>
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
  wrapper: {
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
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
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: 48,
  },
  selectedDay: {
    backgroundColor: "#BE123C",
    paddingVertical: 12,
  },
  dayText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "700",
  },
  dateText: {
    marginTop: 2,
    color: "#d1d5db",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedDateText: {
    color: "#fff",
  },
});

export default TopDateStrip;
