import { SafeAreaView, ScrollView } from "react-native";
import MainPageHeader from "@/components/Main/header";
import { DashboardScreen } from "@/components/Main/progress-component";
import { RecentlyEaten } from "@/components/Main/recently-eaten";

const recentMeals = [
  {
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "Grilled Chicken Salad",
    time: "12:30 PM",
    calories: 450,
    protein: 35,
    carbs: 20,
    fats: 15,
  },
  {
    image:
      "https://images.unsplash.com/photo-1628556820645-63ba5f90e6a2?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "Avocado Toast",
    time: "8:15 AM",
    calories: 300,
    protein: 10,
    carbs: 40,
    fats: 12,
  },
  {
    image:
      "https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "Steak and Veggies",
    time: "7:00 PM",
    calories: 700,
    protein: 50,
    carbs: 30,
    fats: 35,
  },
];

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <MainPageHeader />
      <ScrollView
        className="bg-white flex-1 w-full p-4 mt-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <DashboardScreen />
        <RecentlyEaten recentMeals={recentMeals} />
      </ScrollView>
    </SafeAreaView>
  );
}
