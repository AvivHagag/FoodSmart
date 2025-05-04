import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
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
  const markedDates: Record<string, any> = {
    [selectedDate.toISOString().slice(0, 10)]: {
      selected: true,
      selectedColor: "#BE123C",
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

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={styles.container}>
      <CalendarList
        horizontal={false}
        pagingEnabled
        pastScrollRange={100}
        futureScrollRange={100}
        scrollEnabled
        showScrollIndicator
        disableScrollViewPanResponder={true}
        staticHeader={true}
        current={selectedDate.toISOString().slice(0, 10)}
        onDayPress={(day: DateData) => onDateChange(new Date(day.dateString))}
        theme={{
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          textSectionTitleColor: "#666",
          dayTextColor: "#333",
          todayTextColor: "#BE123C",
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
        markingType={"custom"}
        markedDates={markedDates}
        style={styles.calendarList}
        calendarWidth={screenWidth - 32}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarList: {
    paddingBottom: 8,
    alignSelf: "center",
    width: "100%",
  },
});
