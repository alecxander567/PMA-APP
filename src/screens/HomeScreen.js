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
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import FooterMenu from "../components/FooterMenu";
import { useProjects } from "../hooks/useProject";
import { useTasks } from "../hooks/useTasks";
import ProjectDetailsModal, {
  ConfirmModal,
} from "../components/ProjectDetailsModal";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const {
    tasks = [],
    toggleTaskCompletion,
    deleteTask,
    addTask,
    editTask,
  } = useTasks(user?.email);

  const [newTask, setNewTask] = useState("");

  const handleAddTask = async () => {
    if (editingTaskId) {
      if (!editingText.trim()) return;
      const result = await editTask(editingTaskId, { title: editingText });
      if (result.success) {
        setEditingTaskId(null);
        setEditingText("");
      } else {
        alert("Failed to save task: " + result.error);
      }
    } else {
      if (!newTask.trim()) return;
      const result = await addTask({ title: newTask, completed: false });
      if (result.success) setNewTask("");
      else alert("Failed to add task: " + result.error);
    }
  };

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task) => task.completed)?.length || 0;
  const progress = totalTasks === 0 ? 0 : completedTasks / totalTasks;

  const { projects, loading, deleteProject } = useProjects(user?.email);

  const [profile, setProfile] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");

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

  const openProjectModal = (project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const closeProjectModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedProject(null), 300);
  };

  const handleEditProject = (project) => {
    navigation.navigate("CreateProject", { project });
  };

  const handleDeletePress = (projectId) => {
    setProjectToDelete(projectId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    const result = await deleteProject(projectToDelete);
    if (!result.success) {
      alert("Failed to delete: " + result.error);
    }

    setDeleteModalVisible(false);
    setProjectToDelete(null);
  };

  const statsData = [
    {
      id: "projects",
      iconName: "folder-outline",
      number: projects.length,
      label: "Projects",
    },
    {
      id: "tasks",
      iconName: "check-circle-outline",
      number: tasks.length,
      label: "Tasks",
    },
    {
      id: "friends",
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
        style={styles.gradient}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.profileCircle}>
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
                  {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>

              <Text style={styles.title}>Dashboard</Text>
            </View>

            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: "#F43F5E",
                shadowColor: "#F43F5E",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 6,
                elevation: 6,
              }}>
              <MaterialCommunityIcons
                name="logout"
                size={16}
                color="#F43F5E"
                style={{
                  textShadowColor: "#FF0000",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                }}
              />
              <Text
                style={{
                  color: "#F43F5E",
                  fontWeight: "600",
                  fontSize: 13,
                  marginLeft: 6,
                  textShadowColor: "#F43F5E",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                }}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeContainer}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 6,
              }}>
              <Text style={styles.welcomeText}>
                Welcome back,{" "}
                {profile?.username || user?.email?.split("@")[0] || "User"}!
              </Text>
              <MaterialCommunityIcons
                name="hand-wave-outline"
                size={20}
                color="#93C5FD"
                style={{ marginLeft: 8 }}
              />
            </View>
            <Text style={styles.emailText}>{user?.email}</Text>
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
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateProject")}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : projects.length === 0 ? (
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
            ) : (
              <ScrollView
                style={{ maxHeight: 300 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}>
                {projects.map((project) => (
                  <View key={project.id} style={styles.projectCard}>
                    <TouchableOpacity
                      style={styles.projectContent}
                      onPress={() => openProjectModal(project)}>
                      <View style={styles.projectHeader}>
                        <Text style={styles.projectTitle}>{project.title}</Text>
                        <View
                          style={[
                            styles.projectTypeBadge,
                            project.type === "group" && styles.groupBadge,
                          ]}>
                          <Text style={styles.projectTypeText}>
                            {project.type === "single" ? "Solo" : "Group"}
                          </Text>
                        </View>
                      </View>
                      {project.description && (
                        <Text
                          style={styles.projectDescription}
                          numberOfLines={2}>
                          {project.description}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {project.status === "ongoing" ? (
                      <LinearGradient
                        colors={["#FFD700", "#FFA500"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.statusBadge}>
                        <Text style={styles.statusText}>Ongoing</Text>
                      </LinearGradient>
                    ) : (
                      <LinearGradient
                        colors={["#22C55E", "#16A34A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.statusBadge}>
                        <Text style={styles.statusText}>Completed</Text>
                      </LinearGradient>
                    )}

                    <View style={styles.projectFooter}>
                      <Text style={styles.projectMembers}>
                        <MaterialCommunityIcons
                          name="account-group"
                          size={14}
                          color="#9CA3AF"
                        />{" "}
                        {project.members.length} member
                        {project.members.length > 1 ? "s" : ""}
                      </Text>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditProject(project)}
                          style={styles.actionButtonHorizontal}>
                          <MaterialCommunityIcons
                            name="pencil-outline"
                            size={16}
                            color="#FBBF24"
                          />
                          <Text style={styles.actionTextHorizontal}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeletePress(project.id)}
                          style={styles.actionButtonHorizontal}>
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={16}
                            color="#EF4444"
                          />
                          <Text style={styles.actionTextHorizontal}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <ProjectDetailsModal
            visible={modalVisible}
            project={selectedProject}
            onClose={closeProjectModal}
          />

          <ConfirmModal
            visible={deleteModalVisible}
            title="Delete Project"
            message="Are you sure you want to delete this project? This action cannot be undone."
            onCancel={() => setDeleteModalVisible(false)}
            onConfirm={handleConfirmDelete}
          />

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
              <TouchableOpacity onPress={handleAddTask}>
                <Text style={styles.addButton}>
                  {editingTaskId ? "Save" : "+ Add"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={editingTaskId ? editingText : newTask}
              onChangeText={editingTaskId ? setEditingText : setNewTask}
              placeholder={editingTaskId ? "Edit task..." : "Enter new task..."}
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            />

            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { flex: progress }]} />
              <View style={{ flex: 1 - progress }} />
            </View>
            <Text style={styles.progressText}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>

            {tasks.length === 0 ? (
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
            ) : (
              <ScrollView
                style={{ maxHeight: 300, marginTop: 10 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator>
                {tasks.map((task) => {
                  const isEditing = editingTaskId === task.id;

                  return (
                    <View
                      key={task.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}>
                      <TouchableOpacity
                        onPress={() =>
                          toggleTaskCompletion(task.id, !task.completed)
                        }
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}>
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: "#fff",
                            marginRight: 10,
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: task.completed
                              ? "#F43F5E"
                              : "transparent",
                          }}>
                          {task.completed && (
                            <MaterialCommunityIcons
                              name="check"
                              size={14}
                              color="#fff"
                            />
                          )}
                        </View>

                        {isEditing ? (
                          <TextInput
                            value={editingText}
                            onChangeText={setEditingText}
                            onSubmitEditing={async () => {
                              await editTask(task.id, { title: editingText });
                              setEditingTaskId(null);
                            }}
                            onBlur={() => setEditingTaskId(null)}
                            style={{
                              flex: 1,
                              color: "#fff",
                              borderBottomWidth: 1,
                              borderBottomColor: "#7C1EFF",
                            }}
                            autoFocus
                          />
                        ) : (
                          <Text
                            style={{
                              color: "#fff",
                              textDecorationLine: task.completed
                                ? "line-through"
                                : "none",
                              flexShrink: 1,
                            }}>
                            {task.title}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <View style={{ flexDirection: "row", marginLeft: 10 }}>
                        {!isEditing && (
                          <TouchableOpacity
                            onPress={() => {
                              setEditingTaskId(task.id);
                              setEditingText(task.title);
                            }}
                            style={{ marginRight: 10 }}>
                            <MaterialCommunityIcons
                              name="pencil-outline"
                              size={20}
                              color="#FBBF24"
                            />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => deleteTask(task.id)}>
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
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
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 10,
  },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#6B5DD6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
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
  welcomeContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  welcomeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  emailText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
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
  projectCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  projectTypeBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  groupBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
  },
  projectTypeText: {
    fontSize: 12,
    color: "#93C5FD",
    fontWeight: "500",
  },
  projectDescription: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  projectMembers: {
    fontSize: 12,
    color: "#9CA3AF",
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
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  actionButtonHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  actionTextHorizontal: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  ongoingBadge: {
    backgroundColor: "#2563EB",
  },
  completedBadge: {
    backgroundColor: "#16A34A",
  },
  statusText: {
    color: "#F9FAFB",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  progressBarBackground: {
    flexDirection: "row",
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    backgroundColor: "#F43F5E",
  },
  progressText: {
    fontSize: 12,
    color: "#E5E7EB",
    marginBottom: 12,
    fontWeight: "500",
  },
  taskItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    marginBottom: 8,
  },
});
