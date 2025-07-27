import React from "react";
import { TouchableOpacity, Alert, Share, ActivityIndicator, StyleProp, ViewStyle } from "react-native";
import * as FileSystem from "expo-file-system";
import { ShareIcon } from "lucide-react-native";

export interface ShareButtonProps {
  imageUri?: string;
  nutritionData?: Array<{
    name: string;
    calories: number;
    protein: number;
    carbo: number;
    fat: number;
    unit?: string;
    [key: string]: any;
  }>;
  details?: string[];
  time?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

const buildShareMessage = (nutritionData?: ShareButtonProps["nutritionData"], details?: string[], time?: string) => {
  let message = `Check out this meal!\n\n`;
  if (time) message += `Time 🕒 ${time}\n`;
  if (nutritionData && nutritionData.length > 0) {
    nutritionData.forEach((item) => {
      if (item.calories !== undefined) message += `\nCalories 🔥 ${item.calories} kcal`;
      if (item.protein !== undefined) message += `\nProtein 🥩 ${item.protein}g`;
      if (item.carbo !== undefined) message += `\nCarbs 🍚 ${item.carbo}g`;
      if (item.fat !== undefined) message += `\nFat 🥑 ${item.fat}g`;
    });
  }
  if (details && details.length > 0) {
    message += `\n\nDetails: 📝  \n${details.join(", ")}`;
  }
  return message;
};

export const ShareButton: React.FC<ShareButtonProps> = ({
  imageUri,
  nutritionData,
  details,
  time,
  style,
  className,
  disabled,
  loading,
}) => {
  const [isSharing, setIsSharing] = React.useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      let message = buildShareMessage(nutritionData, details, time);
      let shareOptions: any = { message };
      let localImageUri = undefined;
      if (imageUri) {
        if (imageUri.startsWith("file://") || imageUri.startsWith("content://")) {
          localImageUri = imageUri;
        } else {
          // Download remote image to local cache
          const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
          const localUri = `${FileSystem.cacheDirectory}shared-meal.${fileExt}`;
          const downloadRes = await FileSystem.downloadAsync(imageUri, localUri);
          if (downloadRes.status === 200) {
            localImageUri = downloadRes.uri;
          } else {
            Alert.alert("Image Download Failed", "Could not download the meal image for sharing. Only text will be shared.");
          }
        }
      }
      if (localImageUri) {
        shareOptions = { ...shareOptions, url: localImageUri };
      }
      await Share.share(shareOptions);
    } catch (error) {
      Alert.alert("Share failed", "Could not share the meal. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      style={style}
      className={className}
      disabled={disabled || isSharing || loading}
      accessibilityLabel="Share"
    >
      {isSharing || loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <ShareIcon size={20} color="white" />
      )}
    </TouchableOpacity>
  );
};

export default ShareButton; 