// components/history/DatePicker.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SCREEN_WIDTH = Dimensions.get("window").width;

interface HighlightedDate {
  date: Date;
  type: "ovulation" | "period";
}

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  year: number;
  onYearChange: (year: number) => void;
  highlightedDates?: HighlightedDate[];
}

const ITEM_WIDTH = SCREEN_WIDTH; // one month fills the screen

export default function DatePicker({
  selectedDate,
  onDateChange,
  year,
  onYearChange,
  highlightedDates = [],
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const listRef = useRef<FlatList>(null);

  // build a lookup for fast checks
  const lookup: Record<string, "ovulation" | "period"> = {};
  highlightedDates.forEach(({ date, type }) => {
    lookup[date.toDateString()] = type;
  });

  // when selectedDate changes externally, adjust month
  useEffect(() => {
    const m = selectedDate.getMonth();
    setCurrentMonth(m);
    listRef.current?.scrollToIndex({ index: m, animated: true });
  }, [selectedDate]);

  // month data 0..11
  const months = Array.from({ length: 12 }, (_, i) => ({
    monthIndex: i,
    name: new Date(year, i, 1).toLocaleString("default", { month: "long" }),
  }));

  // generate days grid for a month
  const getDays = (month: number) => {
    const date = new Date(year, month, 1);
    const days: (Date | null)[] = [];
    // offset blank days
    for (let i = 0; i < date.getDay(); i++) days.push(null);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  // when user swipes, update currentMonth
  const onMomentumScrollEnd = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    setCurrentMonth(idx);
  };

  return (
    <View style={styles.container}>
      {/* Year selector */}
      <View style={styles.yearRow}>
        <TouchableOpacity onPress={() => onYearChange(year - 1)}>
          <ChevronLeft size={24} />
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity onPress={() => onYearChange(year + 1)}>
          <ChevronRight size={24} />
        </TouchableOpacity>
      </View>

      {/* Month carousel */}
      <View style={styles.monthRow}>
        <TouchableOpacity
          onPress={() => {
            const prev = Math.max(0, currentMonth - 1);
            setCurrentMonth(prev);
            listRef.current?.scrollToIndex({ index: prev, animated: true });
          }}
        >
          <ChevronLeft size={20} />
        </TouchableOpacity>
        <Text style={styles.monthName}>{months[currentMonth].name}</Text>
        <TouchableOpacity
          onPress={() => {
            const next = Math.min(11, currentMonth + 1);
            setCurrentMonth(next);
            listRef.current?.scrollToIndex({ index: next, animated: true });
          }}
        >
          <ChevronRight size={20} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdays}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={styles.weekdayText}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Swipeable month views */}
      <FlatList
        ref={listRef}
        data={months}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        initialScrollIndex={currentMonth}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(m) => m.monthIndex.toString()}
        renderItem={({ item }) => {
          const days = getDays(item.monthIndex);
          return (
            <View style={styles.monthGrid}>
              {days.map((day, idx) => {
                if (!day) return <View key={idx} style={styles.cell} />;
                const ds = day.toDateString();
                const isSelected = ds === selectedDate.toDateString();
                const hl = lookup[ds];
                const circleStyle = [
                  styles.dayCircle,
                  isSelected && styles.selectedCircle,
                  hl === "ovulation" && styles.ovulationHighlight,
                  hl === "period" && styles.periodHighlight,
                ];
                const textStyle = [
                  styles.dayText,
                  isSelected && styles.selectedText,
                ];
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => onDateChange(day)}
                    style={styles.cell}
                  >
                    <View style={circleStyle}>
                      <Text style={textStyle}>{day.getDate()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  yearRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  yearText: {
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  monthName: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  weekdays: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekdayText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: "#666",
    fontWeight: "500",
  },
  monthGrid: {
    width: ITEM_WIDTH,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCircle: {
    backgroundColor: "#4F46E5",
  },
  ovulationHighlight: {
    backgroundColor: "#DDE7FF",
  },
  periodHighlight: {
    backgroundColor: "#FFE3E2",
  },
  dayText: {
    fontSize: 14,
    color: "#333",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
