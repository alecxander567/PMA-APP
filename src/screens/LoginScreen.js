import React, { useState, useEffect } from "react";
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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading, error, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigation.replace("Dashboard");
    }
  }, [user]);

  const handleLogin = async () => {
    await login(email, password);
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
                  name="clipboard-check-outline"
                  size={36}
                  color="#E5E7EB"
                />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to manage your projects
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
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
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}>
                <Text style={styles.buttonText}>
                  {loading ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  Don't have an account?{" "}
                  <Text style={styles.registerLink}>Create one</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(124,30,255,0.4)",
  },
  form: {
    width: "100%",
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 14,
  },
  registerContainer: {
    alignItems: "center",
  },
  registerText: {
    fontSize: 15,
    color: "#C7C9D9",
  },
  registerLink: {
    color: "#F43F5E",
    fontWeight: "600",
  },
});
