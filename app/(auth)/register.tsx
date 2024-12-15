import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { BASE_URL } from "@/constants/constants";
import { useRouter } from "expo-router";

interface RegisterScreenProps {
  navigation: any; // Adjust this type if using a typed navigator
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  const handleRegister = async () => {
    setErrorMessage("");
    setMessage("");
    if (password !== confirmation) {
      setErrorMessage("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data: { message?: string; error?: string } = await response.json();
      if (response.ok && data.message) {
        setMessage(data.message);
        // Optionally navigate to login screen:
        // navigation.navigate('Login');
      } else {
        setErrorMessage(data.error || "Registration failed");
      }
    } catch (err: unknown) {
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      {message ? <Text style={styles.success}>{message}</Text> : null}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Username"
        onChangeText={setUsername}
        autoCapitalize="none"
        value={username}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        onChangeText={setConfirmation}
        secureTextEntry
        value={confirmation}
      />
      <Button title="Register" onPress={handleRegister} />
      <Text style={styles.link} onPress={() => router.push("/(auth)/login")}>
        Already have an account? Login
      </Text>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  success: {
    color: "green",
    marginBottom: 10,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  link: {
    marginTop: 20,
    color: "blue",
    textAlign: "center",
  },
});
