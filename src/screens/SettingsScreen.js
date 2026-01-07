import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import FooterMenu from "../components/FooterMenu";
import ChangePasswordModal from "../components/ChangePasswordModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import { deleteAccountWithPassword } from "../services/UserService";
import useAllUsers from "../hooks/useAllUsers";
import { getAuth } from "firebase/auth";
import { useState } from "react";

const { width, height } = Dimensions.get("window");

export default function SettingsScreen({ navigation }) {
  const { user, logout, deleteAccount } = useAuth();
  const { removeUserFromState } = useAllUsers();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete your account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentPassword = await promptUserForPassword();
              await deleteAccount(currentPassword);
              Alert.alert("Deleted", "Your account has been deleted.");
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.header}>Settings</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => setShowChangePassword(true)}>
          <View style={styles.optionContent}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={28}
              color="#fff"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.optionText}>Change Password</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#E5E7EB"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: "#4A0E2E" }]}
          onPress={() => setShowDeleteModal(true)}>
          <View style={styles.optionContent}>
            <MaterialCommunityIcons
              name="account-remove-outline"
              size={28}
              color="#F43F5E"
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.optionText, { color: "#F43F5E" }]}>
              Delete Account
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#F43F5E"
          />
        </TouchableOpacity>
      </View>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={async (password) => {
          try {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser) throw new Error("No user logged in");

            await deleteAccountWithPassword(password);

            removeUserFromState(currentUser.uid);

            navigation.replace("LoginScreen");

            Alert.alert("Deleted", "Your account has been deleted.");
          } catch (err) {
            console.error(err);
            Alert.alert("Error", err.message || "Failed to delete account.");
          }
        }}
      />

      <FooterMenu
        activeIndex={2}
        onPressDashboard={() => navigation.navigate("Home")}
        onPressRequests={() => navigation.navigate("Requests")}
        onPressSettings={() => {}}
        onPressFriends={() => navigation.navigate("Friends")}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.08,
  },
  header: {
    color: "#fff",
    fontSize: width * 0.07,
    fontWeight: "700",
    marginBottom: height * 0.08,
  },
  optionCard: {
    backgroundColor: "#2A1A4B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: width * 0.04,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "600",
  },
});
