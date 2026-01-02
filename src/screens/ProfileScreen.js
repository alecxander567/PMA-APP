import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../hooks/useProject";
import { useProfile } from "../hooks/useProfile";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";

const { width, height } = Dimensions.get("window");

const getResponsiveSize = (size) => {
  const baseWidth = 375;
  const baseHeight = 667;

  const widthScale = width / baseWidth;
  const heightScale = height / baseHeight;
  const scale = Math.min(widthScale, heightScale);

  return Math.round(size * scale);
};

const getSpacing = () => {
  if (width < 360) return { small: 8, medium: 16, large: 24 };
  if (width < 768) return { small: 12, medium: 20, large: 32 };
  return { small: 16, medium: 24, large: 40 };
};

const spacing = getSpacing();

export default function ProfileScreen() {
  const { user } = useAuth();
  const { projects } = useProjects(user?.email);
  const { updateProfile, isUpdating } = useProfile();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [allTasks, setAllTasks] = useState({});
  const [avatarUri, setAvatarUri] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const avatarOptions = ["😀", "😎", "🦄", "🐱", "🐶", "👽", "🤖", "🧙‍♂️"];

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setAvatarUri(data.avatar || null);
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user?.email || !projects?.length) return;

    const unsubscribes = [];

    projects.forEach((project) => {
      const q = query(
        collection(db, "tasks"),
        where("projectId", "==", project.id)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projectTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllTasks((prev) => ({ ...prev, [project.id]: projectTasks }));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [projects, user?.email]);

  const tasks = Object.values(allTasks).flat();
  const totalTasks = tasks.length;

  const statsData = [
    {
      id: "projects",
      iconName: "folder-outline",
      number: projects?.length || 0,
      label: "Projects",
    },
    {
      id: "tasks",
      iconName: "check-circle-outline",
      number: totalTasks,
      label: "Tasks",
    },
    {
      id: "friends",
      iconName: "account-group-outline",
      number: 5,
      label: "Friends",
    },
  ];

  const handleUpdateProfile = async () => {
    if (!user?.uid) return;

    try {
      const updates = {
        username: editedUsername,
        email: editedEmail,
      };

      await updateProfile(user.uid, updates);
      setProfile((prev) => ({ ...prev, ...updates }));
      setIsModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const openEditModal = () => {
    setEditedUsername(profile?.username || "");
    setEditedEmail(profile?.email || user?.email || "");
    setIsModalVisible(true);
  };

  const handleSelectAvatar = async (url) => {
    setAvatarUri(url);
    setIsAvatarModalVisible(false);

    if (!user?.uid) return;

    try {
      await updateProfile(user.uid, { avatar: url });
      setProfile((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error("Failed to update avatar:", err);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={getResponsiveSize(24)}
            color="#fff"
          />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {avatarUri ||
                    profile?.username?.charAt(0)?.toUpperCase() ||
                    "U"}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.username}>{profile?.username || "User"}</Text>
            <Text style={styles.email}>
              {profile?.email || user?.email || "No email"}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            {statsData.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <MaterialCommunityIcons
                  name={stat.iconName}
                  size={getResponsiveSize(28)}
                  color="#fff"
                />
                <Text style={styles.statNumber}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={openEditModal}>
            <MaterialCommunityIcons
              name="account-edit"
              size={getResponsiveSize(20)}
              color="#fff"
            />
            <Text style={styles.updateButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
            style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={getResponsiveSize(24)}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalAvatarContainer}>
              <Text style={styles.inputLabel}>Profile Picture</Text>
              <TouchableOpacity
                style={styles.modalAvatarWrapper}
                onPress={() => setIsAvatarModalVisible(true)}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.modalAvatar}
                  />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarText}>
                      {editedUsername?.charAt(0)?.toUpperCase() ||
                        profile?.username?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </Text>
                  </View>
                )}
                <View style={styles.modalCameraIcon}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={getResponsiveSize(18)}
                    color="#fff"
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to choose avatar</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={editedUsername}
                onChangeText={setEditedUsername}
                placeholder="Enter username"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editedEmail}
                onChangeText={setEditedEmail}
                placeholder="Enter email"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <Modal
        visible={isAvatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAvatarModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
            style={[styles.modalContent, { maxWidth: 300 }]}>
            <Text style={styles.modalTitle}>Choose Avatar</Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 12,
              }}>
              {avatarOptions.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectAvatar(emoji)}>
                  <View
                    style={{
                      width: getResponsiveSize(60),
                      height: getResponsiveSize(60),
                      borderRadius: getResponsiveSize(30),
                      backgroundColor: "#F43F5E",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: avatarUri === emoji ? 2 : 0,
                      borderColor: "#fff",
                    }}>
                    <Text style={{ fontSize: getResponsiveSize(32) }}>
                      {emoji}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 16 }]}
              onPress={() => setIsAvatarModalVisible(false)}>
              <Text style={styles.saveButtonText}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  backButton: {
    position: "absolute",
    top:
      Platform.OS === "android"
        ? StatusBar.currentHeight + spacing.small
        : spacing.small,
    left: spacing.medium,
    zIndex: 10,
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(20),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    alignItems: "center",
    padding: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.large * 2,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.large,
    width: "100%",
  },
  avatarImage: {
    width: getResponsiveSize(100),
    height: getResponsiveSize(100),
    borderRadius: getResponsiveSize(50),
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarPlaceholder: {
    width: getResponsiveSize(100),
    height: getResponsiveSize(100),
    borderRadius: getResponsiveSize(50),
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarText: {
    color: "#fff",
    fontSize: getResponsiveSize(40),
    fontWeight: "700",
  },
  username: {
    fontSize: getResponsiveSize(22),
    fontWeight: "700",
    color: "#E5E7EB",
    marginTop: spacing.medium,
    textAlign: "center",
  },
  email: {
    color: "#94A3B8",
    marginTop: spacing.small / 2,
    fontSize: getResponsiveSize(14),
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.large,
    gap: spacing.small,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statNumber: {
    color: "#fff",
    fontSize: getResponsiveSize(20),
    fontWeight: "700",
    marginTop: spacing.small / 2,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: getResponsiveSize(12),
    marginTop: 2,
    textAlign: "center",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F43F5E",
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: 12,
    width: "100%",
    gap: spacing.small / 2,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: getResponsiveSize(16),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.medium,
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: spacing.large,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.large,
  },
  modalTitle: {
    fontSize: getResponsiveSize(20),
    fontWeight: "700",
    color: "#E5E7EB",
  },
  closeButton: {
    padding: spacing.small / 2,
  },
  inputContainer: {
    marginBottom: spacing.medium,
  },
  inputLabel: {
    color: "#94A3B8",
    fontSize: getResponsiveSize(14),
    fontWeight: "600",
    marginBottom: spacing.small / 2,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: spacing.medium,
    color: "#E5E7EB",
    fontSize: getResponsiveSize(16),
  },
  saveButton: {
    backgroundColor: "#F43F5E",
    paddingVertical: spacing.medium,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.small,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: getResponsiveSize(16),
    fontWeight: "600",
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: spacing.large,
  },
  modalAvatarWrapper: {
    position: "relative",
    marginVertical: spacing.small,
  },
  modalAvatar: {
    width: getResponsiveSize(80),
    height: getResponsiveSize(80),
    borderRadius: getResponsiveSize(40),
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalAvatarPlaceholder: {
    width: getResponsiveSize(80),
    height: getResponsiveSize(80),
    borderRadius: getResponsiveSize(40),
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalAvatarText: {
    color: "#fff",
    fontSize: getResponsiveSize(32),
    fontWeight: "700",
  },
  modalCameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F43F5E",
    borderRadius: getResponsiveSize(12),
    width: getResponsiveSize(28),
    height: getResponsiveSize(28),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1E293B",
  },
  avatarHint: {
    color: "#64748B",
    fontSize: getResponsiveSize(12),
    marginTop: spacing.small / 2,
  },
});
