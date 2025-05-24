import React, { Dispatch, SetStateAction, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { BottomSpace } from "../bottom-space";
import {
  ChevronDown,
  Headset,
  Mail,
  User,
  MessageSquare,
  Star,
  AlertCircle,
  Phone,
  HelpCircle,
  Send,
  Clock,
  Shield,
} from "lucide-react-native";
import Title from "../title";
import { LinearGradient } from "expo-linear-gradient";
import { BASE_URL } from "@/constants/constants";

interface ContactSupportProps {
  setShowContactSupport: Dispatch<SetStateAction<boolean>>;
  userEmail?: string;
  userName?: string;
}

const inquiryTypes = [
  { label: "General Support", value: "general" },
  { label: "Technical Issue", value: "technical" },
  { label: "Account Problem", value: "account" },
  { label: "Billing Question", value: "billing" },
  { label: "Feature Request", value: "feature" },
  { label: "Bug Report", value: "bug" },
  { label: "Other", value: "other" },
];

const priorityLevels = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

export default function ContactSupport({
  setShowContactSupport,
  userEmail = "",
  userName = "",
}: ContactSupportProps) {
  const [name, setName] = useState<string>(userName);
  const [email, setEmail] = useState<string>(userEmail);
  const [phone, setPhone] = useState<string>("");
  const [inquiryType, setInquiryType] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string>("");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    inquiryType?: string;
    subject?: string;
    message?: string;
  }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!inquiryType) {
      newErrors.inquiryType = "Please select an inquiry type";
    }

    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (subject.trim().length < 5) {
      newErrors.subject = "Subject must be at least 5 characters";
    }

    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length < 20) {
      newErrors.message = "Message must be at least 20 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/support_message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          inquiryType,
          priority,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoading(false);
        Alert.alert(
          "Support Request Submitted",
          `Thank you for contacting us! Your ticket ID is ${data.ticketId}. We'll get back to you within 24 hours.`,
          [
            {
              text: "OK",
              onPress: () => setShowContactSupport(false),
            },
          ]
        );
      } else {
        setIsLoading(false);
        Alert.alert("Error", data.error || "Failed to submit support request");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Support request error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    }
  };

  const handleBackBottom = () => {
    setShowContactSupport(false);
  };

  const getInputStyle = (fieldName: string, hasError: boolean) => [
    styles.textInput,
    focusedField === fieldName && styles.textInputFocused,
    hasError && styles.textInputError,
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView className="flex-1 bg-gray-50 px-4">
        <Title text="Contact Support" backBottom={handleBackBottom} />

        <LinearGradient
          colors={["#000", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 2, y: 1 }}
          style={styles.headerGradient}
        >
          <View className="items-center py-2">
            <View style={styles.iconContainer}>
              <View style={styles.outerCircle}>
                <View style={styles.middleCircle}>
                  <View style={styles.innerCircle}>
                    <Headset size={32} color="#ffffff" />
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.headerTitle}>We're Here to Help</Text>
            <Text style={styles.headerSubtitle}>
              Our support team is ready to assist you with any questions or
              issues
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Clock size={16} color="#a5b4fc" />
                <Text style={styles.featureText}>24/7 Support</Text>
              </View>
              <View style={styles.featureItem}>
                <Shield size={16} color="#a5b4fc" />
                <Text style={styles.featureText}>Secure & Private</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contactCardsContainer}>
          <Text style={styles.sectionTitle}>Quick Contact Options</Text>

          <View style={styles.contactCardsGrid}>
            <TouchableOpacity style={styles.contactCard}>
              <LinearGradient
                colors={["#0369A1", "#38BDF8"]}
                style={styles.contactCardGradient}
              >
                <Mail size={24} color="#ffffff" />
                <Text style={styles.contactCardTitle}>Email</Text>
                <Text style={styles.contactCardText}>
                  support@foodsmart.com
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard}>
              <LinearGradient
                colors={["#047857", "#34D399"]}
                style={styles.contactCardGradient}
              >
                <Phone size={24} color="#ffffff" />
                <Text style={styles.contactCardTitle}>Phone</Text>
                <Text style={styles.contactCardText}>08-61111111</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.availabilityCard}>
            <HelpCircle size={20} color="#F59E0B" />
            <View style={styles.availabilityText}>
              <Text style={styles.availabilityTitle}>Available 24/7</Text>
              <Text style={styles.availabilitySubtitle}>
                Average response time: 2-4 hours
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formHeaderTitle}>Send us a Message</Text>
          </View>
          <View style={styles.formContent}>
            <View style={styles.rowContainer}>
              <View style={styles.halfWidthInput}>
                <View style={styles.labelContainer}>
                  <User size={16} color="#6b7280" />
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <Text style={styles.requiredAsterisk}>*</Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField("")}
                  placeholder="Enter your name"
                  style={getInputStyle("name", !!errors.name)}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.halfWidthInput}>
                <View style={styles.labelContainer}>
                  <Mail size={16} color="#6b7280" />
                  <Text style={styles.inputLabel}>Email</Text>
                  <Text style={styles.requiredAsterisk}>*</Text>
                </View>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={getInputStyle("email", !!errors.email)}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Phone size={16} color="#6b7280" />
                <Text style={styles.inputLabel}>Phone Number</Text>
                <Text style={styles.optionalText}>(Optional)</Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField("")}
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                style={getInputStyle("phone", false)}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.halfWidthInput}>
                <View style={styles.labelContainer}>
                  <AlertCircle size={16} color="#6b7280" />
                  <Text style={styles.inputLabel}>Issue Type</Text>
                  <Text style={styles.requiredAsterisk}>*</Text>
                </View>
                <View
                  style={[
                    styles.pickerContainer,
                    errors.inquiryType && styles.pickerError,
                  ]}
                >
                  <RNPickerSelect
                    onValueChange={(value) => {
                      setInquiryType(value);
                      if (errors.inquiryType) {
                        setErrors((prev) => ({
                          ...prev,
                          inquiryType: undefined,
                        }));
                      }
                    }}
                    items={inquiryTypes}
                    placeholder={{
                      label: "Select type",
                      value: undefined,
                      color: "#9ca3af",
                    }}
                    style={{
                      inputIOS: { ...styles.pickerInput },
                      inputAndroid: { ...styles.pickerInput },
                      iconContainer: styles.pickerIconContainer,
                      placeholder: { color: "#9ca3af" },
                    }}
                    Icon={() => <ChevronDown size={20} color="#6b7280" />}
                    value={inquiryType}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>
                {errors.inquiryType && (
                  <Text style={styles.errorText}>{errors.inquiryType}</Text>
                )}
              </View>

              <View style={styles.halfWidthInput}>
                <View style={styles.labelContainer}>
                  <Star size={16} color="#6b7280" />
                  <Text style={styles.inputLabel}>Priority</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={(value) => setPriority(value)}
                    items={priorityLevels}
                    placeholder={{
                      label: "Select priority",
                      value: undefined,
                      color: "#9ca3af",
                    }}
                    style={{
                      inputIOS: { ...styles.pickerInput },
                      inputAndroid: { ...styles.pickerInput },
                      iconContainer: styles.pickerIconContainer,
                      placeholder: { color: "#9ca3af" },
                    }}
                    Icon={() => <ChevronDown size={20} color="#6b7280" />}
                    value={priority}
                    useNativeAndroidPickerStyle={false}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <MessageSquare size={16} color="#6b7280" />
                <Text style={styles.inputLabel}>Subject</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TextInput
                value={subject}
                onChangeText={(text) => {
                  setSubject(text);
                  if (errors.subject) {
                    setErrors((prev) => ({ ...prev, subject: undefined }));
                  }
                }}
                onFocus={() => setFocusedField("subject")}
                onBlur={() => setFocusedField("")}
                placeholder="Brief description of your issue"
                style={getInputStyle("subject", !!errors.subject)}
              />
              {errors.subject && (
                <Text style={styles.errorText}>{errors.subject}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <MessageSquare size={16} color="#6b7280" />
                <Text style={styles.inputLabel}>Message</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <TextInput
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  if (errors.message) {
                    setErrors((prev) => ({ ...prev, message: undefined }));
                  }
                }}
                onFocus={() => setFocusedField("message")}
                onBlur={() => setFocusedField("")}
                placeholder="Please provide detailed information about your issue. Include any error messages, steps to reproduce the problem, and any other relevant details."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={[
                  getInputStyle("message", !!errors.message),
                  styles.textArea,
                ]}
              />
              {errors.message && (
                <Text style={styles.errorText}>{errors.message}</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.submitButtonContainer,
            isLoading && styles.submitButtonDisabled,
          ]}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#27272A", "#000000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 3, y: 0 }}
            style={styles.submitGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.submitButtonContent}>
                <Send size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>
                  Send Support Request
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <BottomSpace />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#e0e7ff",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  middleCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  featuresContainer: {
    paddingBottom: 16,
    flexDirection: "row",
    gap: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    color: "#e0e7ff",
    fontSize: 14,
    fontWeight: "500",
  },

  contactCardsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  contactCardsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  contactCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactCardGradient: {
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  contactCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 4,
  },
  contactCardText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    textAlign: "center",
    paddingBottom: 10,
  },

  availabilityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  availabilityText: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  availabilitySubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 0,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  formHeader: {
    backgroundColor: "#000",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  formHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  formContent: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  requiredAsterisk: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
  optionalText: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
  },

  textInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  textInputFocused: {
    borderColor: "#6366f1",
    backgroundColor: "#ffffff",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  textArea: {
    height: 120,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
  },
  pickerError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  pickerInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#111827",
    width: "100%",
    height: 52,
  },
  pickerIconContainer: {
    top: 16,
    right: 16,
  },

  rowContainer: {
    flexDirection: "column",
    gap: 16,
    marginBottom: 20,
  },
  halfWidthInput: {
    flex: 1,
  },

  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },

  submitButtonContainer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
