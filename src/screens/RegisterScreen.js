import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const { register, loading } = useAuth();

  const handleRegister = async () => {
    setError(null);

    if (!email || !password || !username) {
      setError("All fields are required");
      return;
    }

    try {
      await register(email, password, username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="rocket-launch-outline"
                  size={36}
                  color="#E5E7EB"
                />
              </View>
              <Text style={styles.title}>Get Started</Text>
              <Text style={styles.subtitle}>Create your account to begin</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.error}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}>
                <Text style={styles.buttonText}>
                  {loading ? "Creating account..." : "Create Account"}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?{" "}
                  <Text style={styles.loginLink}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: width > 768 ? "20%" : 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: height > 800 ? 40 : 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: width > 768 ? 36 : 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#FFFFFF",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: "#F43F5E",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: width > 768 ? 18 : 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  loginContainer: {
    alignItems: "center",
  },
  loginText: {
    color: "#C7C9D9",
    textAlign: "center",
  },
  loginLink: {
    color: "#F43F5E",
    fontWeight: "600",
  },
});
