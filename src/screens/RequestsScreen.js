import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FooterMenu from "../components/FooterMenu";

const { width, height } = Dimensions.get("window");
const isTablet = width > 768;

export default function RequestsScreen({ navigation }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "taskDeleteRequests"),
      where("leaderEmail", "==", user.email),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email]);

  const handleApprove = async (requestId, taskId) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);

      const requestRef = doc(db, "taskDeleteRequests", requestId);
      await updateDoc(requestRef, { status: "approved" });

      Alert.alert("Success", "Task deletion approved!");
    } catch (err) {
      console.error("Error approving task deletion:", err);
      Alert.alert("Error", "Failed to approve request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const requestRef = doc(db, "taskDeleteRequests", requestId);
      await updateDoc(requestRef, { status: "rejected" });
      Alert.alert("Rejected", "Task deletion rejected!");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to reject request");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C1EFF" />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
              name="clipboard-text-outline"
              size={isTablet ? 32 : 28}
              color="#FFFFFF"
              style={styles.headerIcon}
            />
            <Text style={styles.screenTitle}>Task Deletion Requests</Text>
          </View>

          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="inbox-outline"
                size={isTablet ? 80 : 64}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyText}>No pending deletion requests</Text>
              <Text style={styles.emptySubtext}>
                Requests from team members will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.requestCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={isTablet ? 26 : 22}
                      color="#FBBF24"
                    />
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.taskTitle}>{item.taskTitle}</Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Pending</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons
                        name="folder-outline"
                        size={isTablet ? 18 : 16}
                        color="#9CA3AF"
                      />
                      <Text style={styles.projectLabel}>
                        Project ID: {item.projectId}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={isTablet ? 18 : 16}
                        color="#9CA3AF"
                      />
                      <Text style={styles.requestedBy}>
                        Requested by: {item.requestedBy}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.button, styles.approveButton]}
                      onPress={() => handleApprove(item.id, item.taskId)}
                      activeOpacity={0.8}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={isTablet ? 22 : 20}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={() => handleReject(item.id)}
                      activeOpacity={0.8}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={isTablet ? 22 : 20}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <FooterMenu
          activeIndex={1}
          onPressDashboard={() => navigation.navigate("Home")}
          onPressRequests={() => {}}
          onPressSettings={() => navigation.navigate("Settings")}
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
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isTablet ? 30 : 20,
  },
  headerIcon: {
    marginRight: 12,
  },
  screenTitle: {
    fontSize: isTablet ? 28 : 22,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#E5E7EB",
    fontSize: isTablet ? 16 : 14,
    marginTop: 12,
  },
  listContainer: {
    paddingBottom: 100,
  },
  requestCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: isTablet ? 20 : 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    color: "#fff",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#FBBF24",
    fontSize: isTablet ? 13 : 12,
    fontWeight: "600",
  },
  cardDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectLabel: {
    color: "#E5E7EB",
    fontSize: isTablet ? 15 : 14,
    marginLeft: 8,
  },
  requestedBy: {
    color: "#E5E7EB",
    fontSize: isTablet ? 15 : 14,
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isTablet ? 14 : 12,
    paddingHorizontal: isTablet ? 18 : 16,
    borderRadius: 10,
    gap: 8,
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyText: {
    color: "#E5E7EB",
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: isTablet ? 15 : 14,
    marginTop: 8,
    textAlign: "center",
  },
});
