import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { CalendarList, DateData } from "react-native-calendars";

/** Local calendar day key — avoid UTC shift from toISOString(). */
function toCalendarDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  const selectedKey = toCalendarDateString(selectedDate);

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {
      [selectedKey]: {
        selected: true,
        selectedColor: "#BE123C",
      },
    };
    highlightedDates.forEach(({ date, type }) => {
      const key = toCalendarDateString(date);
      marks[key] = {
        ...marks[key],
        marked: true,
        dotColor: type === "ovulation" ? "#4F46E5" : "#BE123C",
      };
    });
    return marks;
  }, [selectedKey, highlightedDates]);

  const screenWidth = Dimensions.get("window").width;
  const calendarWidth = Math.max(screenWidth - 32, 280);

  return (
    <View style={styles.container}>
      <CalendarList
        horizontal={false}
        pagingEnabled
        pastScrollRange={100}
        futureScrollRange={100}
        scrollEnabled
        showScrollIndicator
        calendarHeight={360}
        calendarWidth={calendarWidth}
        current={selectedKey}
        onDayPress={(day: DateData) =>
          onDateChange(new Date(day.year, day.month - 1, day.day))
        }
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#374151",
          dayTextColor: "#111827",
          textDisabledColor: "#d1d5db",
          todayTextColor: "#BE123C",
          arrowColor: "#BE123C",
          monthTextColor: "#111827",
          textMonthFontSize: 16,
          textMonthFontWeight: "600",
          textDayFontSize: 15,
          textDayHeaderFontSize: 13,
          textDayHeaderFontWeight: "600",
          selectedDayTextColor: "#ffffff",
          selectedDayBackgroundColor: "#BE123C",
        }}
        markedDates={markedDates}
        style={styles.calendarList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 360,
    marginHorizontal: 0,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  calendarList: {
    paddingBottom: 8,
    width: "100%",
    minHeight: 360,
  },
});
