// components/history/DatePicker.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { CalendarList, DateData } from "react-native-calendars";

interface HighlightedDate {
  date: Date;
  type: "ovulation" | "period";
}

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  highlightedDates?: HighlightedDate[];
}

export default function DatePicker({
  selectedDate,
  onDateChange,
  highlightedDates = [],
}: Props) {
  // build markedDates object for react-native-calendars
  const markedDates: Record<string, any> = {
    [selectedDate.toISOString().slice(0, 10)]: {
      selected: true,
      selectedColor: "#4F46E5",
    },
  };
  highlightedDates.forEach(({ date, type }) => {
    const key = date.toISOString().slice(0, 10);
    markedDates[key] = {
      ...markedDates[key],
      [type === "ovulation" ? "dotColor" : "customStyles"]: {
        container: {
          backgroundColor: type === "ovulation" ? "#DDE7FF" : "#FFE3E2",
          width: 6,
          height: 6,
          borderRadius: 3,
          bottom: 4,
        },
      },
    };
  });

  return (
    <View style={styles.container}>
      <CalendarList
        // enable vertical infinite scroll
        horizontal={false}
        pagingEnabled
        pastScrollRange={36}
        futureScrollRange={36}
        scrollEnabled
        showScrollIndicator
        // current selected
        current={selectedDate.toISOString().slice(0, 10)}
        onDayPress={(day: DateData) => onDateChange(new Date(day.dateString))}
        // styling/theme
        theme={{
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          textSectionTitleColor: "#666",
          dayTextColor: "#333",
          todayTextColor: "#4F46E5",
          arrowColor: "#4F46E5",
          monthTextColor: "#000",
          textMonthFontSize: 16,
          textMonthFontWeight: "600",
          textDayFontSize: 14,
          textDayHeaderFontSize: 14,
          textDayHeaderFontWeight: "500",
          selectedDayTextColor: "#fff",
          selectedDayBackgroundColor: "#4F46E5",
        }}
        // apply our marks
        markingType={"custom"}
        markedDates={markedDates}
        // style calendar list
        style={styles.calendarList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
  },
  calendarList: {
    paddingBottom: 8,
  },
});
