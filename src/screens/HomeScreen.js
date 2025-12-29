import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import FooterMenu from "../components/FooterMenu";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log("Loading profile for UID:", user?.uid);

        if (!user?.uid) {
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        console.log("Profile exists in Firestore:", snap.exists());

        if (snap.exists()) {
          console.log("Profile data:", snap.data());
          setProfile(snap.data());
        } else {
          console.log("No profile in Firestore, using auth data");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Mock Data
  const statsData = [
    {
      id: "1",
      iconName: "clipboard-check-outline",
      number: 3,
      label: "Projects",
    },
    {
      id: "2",
      iconName: "check-circle-outline",
      number: 12,
      label: "Tasks",
    },
    {
      id: "3",
      iconName: "account-group-outline",
      number: 5,
      label: "Friends",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Logged out", "You have been logged out successfully.");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to log out");
    }
  };

  const renderStatCard = ({ item }) => (
    <View style={styles.statCardOuter}>
      <View style={styles.statCardContent}>
        <MaterialCommunityIcons
          name={item.iconName}
          size={32}
          color="#E5E7EB"
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.statNumber}>{item.number}</Text>
        <Text style={styles.statLabel}>{item.label}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#7C1EFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.profileCircle}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons
                    name="hand-wave-outline"
                    size={18}
                    color="#C7C9D9"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.greeting}>
                    Welcome back, {profile?.username || user?.email?.split("@")[0] || "User"}
                  </Text>
                </View>
                <Text style={styles.title}>Dashboard</Text>
                <Text style={styles.emailText}>
                  {profile?.email || user?.email || "No email"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={statsData}
            renderItem={renderStatCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
            snapToInterval={width > 768 ? 0 : width * 0.6 + 12}
            decelerationRate="fast"
            snapToAlignment="start"
          />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={18}
                  color="#E5E7EB"
                />{" "}
                Projects
              </Text>
              <TouchableOpacity>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first project to get started
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={18}
                  color="#E5E7EB"
                />{" "}
                Your Tasks
              </Text>
              <TouchableOpacity>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="text-box-check-outline"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyText}>No tasks assigned</Text>
              <Text style={styles.emptySubtext}>
                Tasks will appear here when assigned
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={18}
                  color="#E5E7EB"
                />{" "}
                Friends
              </Text>
              <TouchableOpacity>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="account-multiple-outline"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>
                Connect with teammates to collaborate
              </Text>
            </View>
          </View>
        </ScrollView>

        <LinearGradient
          colors={["transparent", "#0A0F2C"]}
          style={styles.fadeGradient}
          pointerEvents="none"
        />

        <FooterMenu
          activeIndex={0}
          onPressDashboard={() => {}}
          onPressProjects={() => {}}
          onPressTasks={() => {}}
          onPressFriends={() => {}}
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
  },
  contentContainer: {
    paddingHorizontal: width > 768 ? "15%" : 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0F2C",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingTop: 10,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6B5DD6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  greeting: {
    color: "#C7C9D9",
    fontSize: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  emailText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: width > 400 ? 10 : 8,
    paddingHorizontal: width > 400 ? 20 : 16,
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "flex-start",
    marginTop: 20,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: width > 768 ? 16 : 15,
    textAlign: "center",
  },
  statsContainer: {
    paddingVertical: 4,
    marginBottom: 20,
  },
  statCardOuter: {
    marginRight: 12,
    width: width > 768 ? 180 : width * 0.6,
    height: 140,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124,30,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statCardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13,
    color: "#C7C9D9",
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(124,30,255,0.25)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    color: "#F43F5E",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  fadeGradient: {
    position: "absolute",
    bottom: 92,
    left: 0,
    right: 0,
    height: 60,
  },
});