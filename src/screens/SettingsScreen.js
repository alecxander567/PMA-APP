import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
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
const isTablet = width > 768;

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
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <MaterialCommunityIcons
              name="cog"
              size={isTablet ? 32 : 28}
              color="#FFFFFF"
              style={styles.headerIcon}
            />
            <Text style={styles.header}>Settings</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => setShowChangePassword(true)}
              activeOpacity={0.8}>
              <View style={styles.optionContent}>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={isTablet ? 30 : 28}
                    color="#fff"
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Change Password</Text>
                  <Text style={styles.optionSubtext}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={isTablet ? 28 : 24}
                color="#E5E7EB"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, styles.deleteCard]}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.8}>
              <View style={styles.optionContent}>
                <View style={[styles.iconWrapper, styles.deleteIconWrapper]}>
                  <MaterialCommunityIcons
                    name="account-remove-outline"
                    size={isTablet ? 30 : 28}
                    color="#F43F5E"
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionText, styles.deleteText]}>
                    Delete Account
                  </Text>
                  <Text style={[styles.optionSubtext, styles.deleteSubtext]}>
                    Permanently remove your account
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={isTablet ? 28 : 24}
                color="#F43F5E"
              />
            </TouchableOpacity>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#4F46E5",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: isTablet ? "20%" : 20,
    paddingTop: isTablet ? 60 : 40,
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isTablet ? 40 : 30,
  },
  headerIcon: {
    marginRight: 12,
  },
  header: {
    color: "#fff",
    fontSize: isTablet ? 32 : 26,
    fontWeight: "700",
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 22 : 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124,30,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  deleteCard: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: isTablet ? 56 : 50,
    height: isTablet ? 56 : 50,
    borderRadius: isTablet ? 28 : 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  deleteIconWrapper: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    color: "#fff",
    fontSize: isTablet ? 19 : 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionSubtext: {
    color: "#9CA3AF",
    fontSize: isTablet ? 14 : 13,
    fontWeight: "400",
  },
  deleteText: {
    color: "#F43F5E",
  },
  deleteSubtext: {
    color: "rgba(244, 63, 94, 0.7)",
  },
});
