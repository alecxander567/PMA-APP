// components/DeleteAccountModal.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { reauthenticateAndDelete } from "../services/UserService";

const { width } = Dimensions.get("window");

export default function DeleteAccountModal({ visible, onClose, onDelete }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your current password.");
      return;
    }
    setLoading(true);
    try {
      await onDelete(password);
      setPassword("");
      onClose();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Confirm Account Deletion</Text>
          <Text style={styles.subtitle}>
            Enter your password to permanently delete your account
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#4A0E2E" }]}
              onPress={onClose}
              disabled={loading}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#F43F5E" }]}
              onPress={handleDelete}
              disabled={loading}>
              <Text style={styles.buttonText}>
                {loading ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: width * 0.85,
    backgroundColor: "#1B103F",
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: width * 0.05,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#E5E7EB",
    fontSize: width * 0.035,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#2A1A4B",
    color: "#fff",
    borderRadius: 10,
    padding: width * 0.04,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    paddingVertical: width * 0.03,
    paddingHorizontal: width * 0.08,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
