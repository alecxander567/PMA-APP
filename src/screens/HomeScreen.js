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
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import FooterMenu from "../components/FooterMenu";
import FloatingBubble from "../components/FloatingBubble";
import { useProjects } from "../hooks/useProject";
import ProjectDetailsModal, {
  ConfirmModal,
} from "../components/ProjectDetailsModal";
import useAllUsers from "../hooks/useAllUsers";
import { useTasks } from "../hooks/useTasks";

const { width, height } = Dimensions.get("window");
const isTablet = width > 768;

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { projects, loading, deleteProject } = useProjects(user?.email);
  const { requestDeleteTask } = useTasks(null, user?.email);
  const { users } = useAllUsers();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserProfile = users.find((u) => u.uid === currentUser.uid);

  const acceptedFriends = users.filter((u) =>
    currentUserProfile?.friends?.includes(u.uid)
  );

  const [profile, setProfile] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [allTasks, setAllTasks] = useState({});
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || projects.length === 0) {
      setTasksLoading(false);
      return;
    }

    const unsubscribes = [];

    projects.forEach((project) => {
      const q = query(
        collection(db, "tasks"),
        where("projectId", "==", project.id),
        where("assignedTo", "==", user.email)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projectTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllTasks((prev) => ({
          ...prev,
          [project.id]: projectTasks,
        }));
      });

      unsubscribes.push(unsubscribe);
    });

    setTasksLoading(false);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.email, projects]);

  const toggleTaskCompletion = async (taskId, projectId, completed) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { completed });

      setAllTasks((prev) => ({
        ...prev,
        [projectId]: prev[projectId].map((task) =>
          task.id === taskId ? { ...task, completed } : task
        ),
      }));
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const getProjectProgress = (projectId) => {
    const tasks = allTasks[projectId] || [];
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const progress = total === 0 ? 0 : completed / total;
    return { total, completed, progress };
  };

  const totalTasks = Object.values(allTasks).reduce(
    (sum, tasks) => sum + tasks.length,
    0
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.uid) {
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setProfile(snap.data());
        }
      } catch (error) {
        console.error("Error loading profile:", error);
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
      number: totalTasks,
      label: "Tasks",
    },
    {
      id: "friends",
      iconName: "account-group-outline",
      number: acceptedFriends.length,
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
      <View style={[styles.statCardContent, { backgroundColor: "#0A0F2C" }]}>
        <MaterialCommunityIcons
          name={item.iconName}
          size={isTablet ? 36 : 32}
          color="#FFFFFF"
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
              <MaterialCommunityIcons
                name="view-dashboard"
                size={isTablet ? 28 : 24}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
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
              }}>
              <MaterialCommunityIcons
                name="logout"
                size={isTablet ? 18 : 16}
                color="#F43F5E"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Profile")}>
              <View style={styles.profileCircle}>
                <Text style={styles.profileText}>
                  {profile?.avatar ||
                    profile?.username?.charAt(0)?.toUpperCase() ||
                    "U"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={{ marginLeft: 8, flex: 1 }}>
              <View style={styles.welcomeRow}>
                <Text style={styles.welcomeText}>
                  Welcome back,{" "}
                  {profile?.username || user?.email?.split("@")[0] || "User"}!
                </Text>
                <MaterialCommunityIcons
                  name="hand-wave-outline"
                  size={isTablet ? 24 : 20}
                  color="#93C5FD"
                  style={{ marginLeft: 6 }}
                />
              </View>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
          </View>

          <LinearGradient
            colors={["#0A0F2C", "#2A0A3D", "#7F1D1D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}>
            <FloatingBubble
              size={isTablet ? 50 : 40}
              color="#93C5FD"
              style={{ position: "absolute", top: 20, right: 30 }}
            />
            <FloatingBubble
              size={isTablet ? 40 : 30}
              color="#F43F5E"
              style={{ position: "absolute", bottom: 30, left: 40 }}
            />
            <FloatingBubble
              size={isTablet ? 30 : 20}
              color="#22D3EE"
              style={{ position: "absolute", bottom: 10, right: 20 }}
            />

            <Text style={styles.heroTitle}>Project Management App</Text>
            <Text style={styles.heroSubtitle}>
              Manage your projects easily and efficiently
            </Text>
          </LinearGradient>

          <FlatList
            data={statsData}
            renderItem={renderStatCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
            snapToInterval={isTablet ? 0 : width * 0.6 + 12}
            decelerationRate="fast"
            snapToAlignment="start"
          />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons
                  name="clipboard-text-outline"
                  size={isTablet ? 20 : 18}
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
                  size={isTablet ? 56 : 48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyText}>No projects yet</Text>
                <Text style={styles.emptySubtext}>
                  Create your first project to get started
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: isTablet ? 400 : 300 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}>
                {projects.map((project) => {
                  const isProjectLeader = project.leader === user.email;

                  return (
                    <View key={project.id} style={styles.projectCard}>
                      <TouchableOpacity
                        style={styles.projectContent}
                        onPress={() => openProjectModal(project)}>
                        <View style={styles.projectHeader}>
                          <Text style={styles.projectTitle}>
                            {project.title}
                          </Text>
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
                          {isProjectLeader && (
                            <>
                              <TouchableOpacity
                                onPress={() => handleEditProject(project)}
                                style={styles.actionButtonHorizontal}>
                                <MaterialCommunityIcons
                                  name="pencil-outline"
                                  size={16}
                                  color="#FBBF24"
                                />
                                <Text style={styles.actionTextHorizontal}>
                                  Edit
                                </Text>
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
                            </>
                          )}

                          {!isProjectLeader && (
                            <TouchableOpacity
                              onPress={() => openProjectModal(project)}
                              style={styles.actionButtonHorizontal}>
                              <MaterialCommunityIcons
                                name="eye-outline"
                                size={16}
                                color="#3B82F6"
                              />
                              <Text style={styles.actionTextHorizontal}>
                                View
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <ProjectDetailsModal
            visible={modalVisible}
            project={selectedProject}
            onClose={closeProjectModal}
            users={users}
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
                  size={isTablet ? 20 : 18}
                  color="#E5E7EB"
                />{" "}
                Your Tasks
              </Text>
            </View>

            {tasksLoading ? (
              <ActivityIndicator size="small" color="#7C1EFF" />
            ) : projects.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="text-box-check-outline"
                  size={isTablet ? 56 : 48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyText}>No tasks yet</Text>
                <Text style={styles.emptySubtext}>
                  Create a project and get assigned tasks
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: isTablet ? 500 : 400, marginTop: 10 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator>
                {projects.map((project) => {
                  const isProjectLeader = project.leader === user.email;
                  const projectProgress = getProjectProgress(project.id);
                  const projectTasks = allTasks[project.id] || [];
                  const isExpanded = expandedProjects[project.id];

                  if (projectTasks.length === 0) return null;

                  return (
                    <View key={project.id} style={styles.projectTaskContainer}>
                      <TouchableOpacity
                        onPress={() => toggleProjectExpanded(project.id)}
                        style={styles.projectTaskHeader}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <View style={styles.taskHeaderRow}>
                            <Text style={styles.projectTaskTitle}>
                              {project.title}
                            </Text>
                            <MaterialCommunityIcons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={24}
                              color="#FFFFFF"
                            />
                          </View>

                          <Text style={styles.progressPercentage}>
                            {Math.round(projectProgress.progress * 100)}%
                          </Text>

                          <View style={styles.progressBarBackground}>
                            <View
                              style={[
                                styles.progressBarFill,
                                { width: `${projectProgress.progress * 100}%` },
                              ]}
                            />
                          </View>

                          <View style={styles.progressInfoRow}>
                            <MaterialCommunityIcons
                              name="progress-check"
                              size={16}
                              color="#6EE7B7"
                              style={{ marginRight: 6 }}
                            />
                            <Text style={styles.progressText}>
                              {projectProgress.completed} of{" "}
                              {projectProgress.total} tasks completed
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.tasksList}>
                          {projectTasks.map((task) => (
                            <View key={task.id} style={styles.taskItem}>
                              <TouchableOpacity
                                onPress={() =>
                                  toggleTaskCompletion(
                                    task.id,
                                    project.id,
                                    !task.completed
                                  )
                                }
                                style={styles.taskItemContent}>
                                <View
                                  style={styles.taskCheckbox(task.completed)}>
                                  {task.completed && (
                                    <MaterialCommunityIcons
                                      name="check"
                                      size={14}
                                      color="#fff"
                                    />
                                  )}
                                </View>

                                <Text style={styles.taskTitle(task.completed)}>
                                  {task.title}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={async () => {
                                  try {
                                    if (isProjectLeader) {
                                      const taskRef = doc(db, "tasks", task.id);
                                      await deleteDoc(taskRef);
                                      Alert.alert(
                                        "Deleted",
                                        "Task deleted successfully!"
                                      );
                                    } else {
                                      const res = await requestDeleteTask(
                                        task,
                                        project,
                                        user.email
                                      );
                                      if (res.success) {
                                        Alert.alert(
                                          "Request Sent",
                                          "The project leader will review your request."
                                        );
                                      } else {
                                        Alert.alert("Error", res.error);
                                      }
                                    }
                                  } catch (err) {
                                    console.error(
                                      "Error with task deletion:",
                                      err
                                    );
                                    Alert.alert(
                                      "Error",
                                      "Failed to process request."
                                    );
                                  }
                                }}
                                style={{ paddingLeft: 10 }}>
                                <MaterialCommunityIcons
                                  name="trash-can-outline"
                                  size={18}
                                  color="#F87171"
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {Object.values(allTasks).every(
                  (tasks) => tasks.length === 0
                ) && (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name="text-box-check-outline"
                      size={isTablet ? 56 : 48}
                      color="rgba(255,255,255,0.3)"
                    />
                    <Text style={styles.emptyText}>No tasks assigned</Text>
                    <Text style={styles.emptySubtext}>
                      Tasks will appear here when assigned by project leaders
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={isTablet ? 20 : 18}
                  color="#E5E7EB"
                />{" "}
                Friends
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Friends")}>
                <Text style={styles.addButton}>View All</Text>
              </TouchableOpacity>
            </View>

            {acceptedFriends.length > 0 ? (
              <FlatList
                data={acceptedFriends.slice(0, 5)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const displayName =
                    item.name || item.username || "Unnamed User";
                  const initials = displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <TouchableOpacity style={styles.friendCard}>
                      <View style={styles.friendInfo}>
                        <View style={styles.friendAvatar}>
                          <Text style={styles.friendAvatarText}>
                            {item.avatar || item.emoji || initials}
                          </Text>
                        </View>
                        <View style={styles.friendDetails}>
                          <Text style={styles.friendName}>{displayName}</Text>
                          <Text style={styles.friendEmail}>{item.email}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-multiple-outline"
                  size={isTablet ? 56 : 48}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubtext}>
                  Connect with teammates to collaborate
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <FooterMenu
          activeIndex={0}
          onPressDashboard={() => {}}
          onPressRequests={() => navigation.navigate("Requests")}
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
  },
  contentContainer: {
    paddingHorizontal: isTablet ? "20%" : 20,
    paddingTop: isTablet ? 40 : 30,
    paddingBottom: 100,
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
    paddingTop: 5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: isTablet ? 26 : 22,
    fontWeight: "700",
  },
  logoutText: {
    color: "#F43F5E",
    fontWeight: "600",
    fontSize: isTablet ? 15 : 13,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  profileCircle: {
    width: isTablet ? 52 : 45,
    height: isTablet ? 52 : 45,
    borderRadius: isTablet ? 26 : 23,
    backgroundColor: "#F43F5E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: isTablet ? 20 : 18,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  welcomeText: {
    color: "#FFFFFF",
    fontSize: isTablet ? 15 : 13,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  emailText: {
    color: "#9CA3AF",
    fontSize: isTablet ? 14 : 12,
    fontWeight: "400",
    marginTop: 2,
  },
  heroSection: {
    width: "100%",
    paddingVertical: isTablet ? 50 : 40,
    paddingHorizontal: isTablet ? 30 : 20,
    alignItems: "flex-start",
    justifyContent: "center",
    borderRadius: 16,
    marginBottom: 20,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: isTablet ? 24 : 20,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#9CA3AF",
    fontSize: isTablet ? 16 : 14,
    fontWeight: "400",
    textAlign: "left",
  },
  statsContainer: {
    paddingVertical: 4,
    marginBottom: 20,
  },
  statCardOuter: {
    marginRight: 12,
    width: isTablet ? 200 : width * 0.55,
    height: isTablet ? 120 : 100,
    overflow: "hidden",
    backgroundColor: "transparent",
    shadowColor: "#A020F0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  statCardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  statNumber: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: isTablet ? 13 : 11,
    color: "#C7C9D9",
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: isTablet ? 20 : 16,
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
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
  },
  projectCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: isTablet ? 18 : 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  projectContent: {
    flex: 1,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: isTablet ? 18 : 16,
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
    fontSize: isTablet ? 13 : 12,
    color: "#93C5FD",
    fontWeight: "500",
  },
  projectDescription: {
    fontSize: isTablet ? 15 : 14,
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
    fontSize: isTablet ? 13 : 12,
    color: "#9CA3AF",
  },
  addButton: {
    color: "#F43F5E",
    fontSize: isTablet ? 15 : 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: isTablet ? 30 : 20,
  },
  emptyText: {
    color: "#E5E7EB",
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtext: {
    color: "#9CA3AF",
    fontSize: isTablet ? 15 : 14,
    textAlign: "center",
    marginTop: 4,
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
    fontSize: isTablet ? 13 : 12,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#F9FAFB",
    fontSize: isTablet ? 11 : 10,
    fontWeight: "600",
    textAlign: "center",
  },
  progressBarBackground: {
    height: isTablet ? 10 : 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F43F5E",
  },
  progressText: {
    fontSize: isTablet ? 13 : 12,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  projectTaskContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: isTablet ? 16 : 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  projectTaskHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  projectTaskTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  taskHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tasksList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: isTablet ? 14 : 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskCheckbox: (completed) => ({
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: completed ? "#F43F5E" : "transparent",
  }),
  taskTitle: (completed) => ({
    color: "#fff",
    fontSize: isTablet ? 15 : 14,
    textDecorationLine: completed ? "line-through" : "none",
    flex: 1,
  }),
  progressPercentage: {
    color: "#F43F5E",
    fontSize: isTablet ? 13 : 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "right",
  },
  progressInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  friendCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: isTablet ? 14 : 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendAvatar: {
    width: isTablet ? 48 : 44,
    height: isTablet ? 48 : 44,
    borderRadius: isTablet ? 24 : 22,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  friendAvatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: isTablet ? 18 : 16,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: isTablet ? 16 : 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: isTablet ? 13 : 12,
    color: "#9CA3AF",
  },
});
