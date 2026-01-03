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
import FooterMenu from "../components/FooterMenu";

const { width, height } = Dimensions.get("window");

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
      <LinearGradient
        colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
        style={styles.gradient}>
        <ActivityIndicator size="large" color="#7C1EFF" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      style={styles.gradient}>
      <Text style={styles.screenTitle}>Requests Task Deletions</Text>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No pending task deletion requests.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <Text style={styles.taskTitle}>{item.taskTitle}</Text>
              <Text style={styles.projectLabel}>
                Project ID: {item.projectId}
              </Text>
              <Text style={styles.requestedBy}>
                Requested by: {item.requestedBy}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#10B981" }]}
                  onPress={() => handleApprove(item.id, item.taskId)}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#EF4444" }]}
                  onPress={() => handleReject(item.id)}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <FooterMenu
        activeIndex={1}
        onPressDashboard={() => navigation.navigate("Home")}
        onPressRequests={() => {}}
        onPressSettings={() => navigation.navigate("Settings")}
        onPressFriends={() => navigation.navigate("Friends")}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "left",
    marginTop: height * 0.08,
    marginBottom: 16,
    marginLeft: width * 0.07,
  },
  listContainer: {
    paddingTop: height * 0.03,
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.18,
  },
  requestCard: {
    backgroundColor: "#2A1A4B",
    padding: width * 0.04,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  taskTitle: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "700",
  },
  projectLabel: {
    color: "#E5E7EB",
    fontSize: width * 0.035,
    marginTop: 4,
  },
  requestedBy: {
    color: "#E5E7EB",
    fontSize: width * 0.035,
    marginTop: 2,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    paddingVertical: width * 0.02,
    paddingHorizontal: width * 0.06,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: width * 0.035,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#E5E7EB",
    fontSize: width * 0.04,
  },
});
