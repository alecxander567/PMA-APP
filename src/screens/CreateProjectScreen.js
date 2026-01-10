import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProjects } from "../hooks/useProject";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import useAllUsers from "../hooks/useAllUsers";

const { width, height } = Dimensions.get("window");
const isTablet = width > 768;

export default function CreateProjectScreen({ navigation, route }) {
  const { user } = useAuth();
  const { createProject, updateProject } = useProjects(user?.email);

  const { users, loading: usersLoading } = useAllUsers();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserProfile = users.find((u) => u.uid === currentUser?.uid);

  const acceptedFriends = users.filter((u) =>
    currentUserProfile?.friends?.includes(u.uid)
  );

  const editingProject = route?.params?.project;

  const isLeader = !editingProject || editingProject?.leader === user?.email;

  const [title, setTitle] = useState(editingProject?.title || "");
  const [description, setDescription] = useState(
    editingProject?.description || ""
  );
  const [projectLink, setProjectLink] = useState(
    editingProject?.projectLink || ""
  );
  const [type, setType] = useState(editingProject?.type || "single");
  const [members, setMembers] = useState(
    editingProject?.members?.filter((m) => m !== user.email) || []
  );
  const [status, setStatus] = useState(editingProject?.status || "ongoing");

  const [memberTasks, setMemberTasks] = useState({});
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [deletedTaskIds, setDeletedTaskIds] = useState([]);
  const [contentHeight, setContentHeight] = useState(0);

  const canDeleteTask = (memberEmail) => {
    if (type === "single") {
      return memberEmail === user?.email;
    } else {
      return isLeader;
    }
  };

  const canAddTask = (memberEmail) => {
    if (type === "single") {
      return memberEmail === user?.email;
    } else {
      return isLeader;
    }
  };

  useEffect(() => {
    if (!editingProject || !users || users.length === 0) return;

    const validMembers = editingProject.members.filter(
      (memberEmail) =>
        memberEmail === user.email || users.some((u) => u.email === memberEmail)
    );

    const filteredMembers = validMembers.filter((m) => m !== user.email);

    if (
      JSON.stringify(filteredMembers.sort()) !== JSON.stringify(members.sort())
    ) {
      setMembers(filteredMembers);
    }
  }, [editingProject, users, user.email]);

  useEffect(() => {
    if (!editingProject) return;

    const loadTasks = async () => {
      try {
        const q = query(
          collection(db, "tasks"),
          where("projectId", "==", editingProject.id)
        );

        const snapshot = await getDocs(q);
        const tasksByMember = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const member = data.assignedTo;

          if (!tasksByMember[member]) {
            tasksByMember[member] = [];
          }

          tasksByMember[member].push({
            id: docSnap.id,
            title: data.title,
          });
        });

        setMemberTasks(tasksByMember);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    };

    loadTasks();
  }, [editingProject]);

  useEffect(() => {
    const allMembersFiltered =
      type === "single"
        ? [user.email]
        : [
            user.email,
            ...members.filter((m) => users?.some((u) => u.email === m)),
          ];

    setMemberTasks((prev) => {
      let changed = false;
      const updated = { ...prev };

      allMembersFiltered.forEach((m) => {
        if (!updated[m]) {
          updated[m] = [];
          changed = true;
        }
      });

      return changed ? updated : prev;
    });

    setNewTaskInputs((prev) => {
      let changed = false;
      const updated = { ...prev };

      allMembersFiltered.forEach((m) => {
        if (!updated[m]) {
          updated[m] = "";
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [type, members, users]);

  const handleAddTask = (memberEmail) => {
    if (!canAddTask(memberEmail)) return;

    const taskText = newTaskInputs[memberEmail]?.trim();
    if (taskText) {
      setMemberTasks((prev) => ({
        ...prev,
        [memberEmail]: [
          ...(prev[memberEmail] || []),
          { id: null, title: taskText },
        ],
      }));
      setNewTaskInputs((prev) => ({
        ...prev,
        [memberEmail]: "",
      }));
    }
  };

  const handleRemoveTask = (memberEmail, taskIndex) => {
    setMemberTasks((prev) => {
      const task = prev[memberEmail][taskIndex];

      if (task?.id) {
        setDeletedTaskIds((ids) => [...ids, task.id]);
      }

      return {
        ...prev,
        [memberEmail]: prev[memberEmail].filter((_, idx) => idx !== taskIndex),
      };
    });
  };

  const handleSubmit = async () => {
    if (!isLeader) {
      alert("Only the project leader can modify this project");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a project title");
      return;
    }

    const projectData = {
      title,
      description,
      projectLink,
      type,
      leader: user.email,
      leaderId: user.uid,
      members:
        type === "single"
          ? [user.email]
          : [
              user.email,
              ...members.filter((m) => users?.some((u) => u.email === m)),
            ],
      status,
    };

    let projectId;

    try {
      if (editingProject) {
        const result = await updateProject(editingProject.id, projectData);

        if (!result.success) {
          alert("Failed to update project: " + result.error);
          return;
        }

        projectId = editingProject.id;
      } else {
        const result = await createProject(projectData);

        if (!result.success) {
          alert("Failed to create project: " + result.error);
          return;
        }

        projectId = result.id;
      }

      for (const taskId of deletedTaskIds) {
        await deleteDoc(doc(db, "tasks", taskId));
      }

      const allMembers =
        type === "single"
          ? [user.email]
          : [
              user.email,
              ...members.filter((m) => users?.some((u) => u.email === m)),
            ];

      for (const member of allMembers) {
        const tasks = memberTasks[member] || [];

        for (const task of tasks) {
          if (task.id) continue;

          const taskData = {
            title: task.title,
            assignedTo: member,
            assignedBy: user.email,
            projectId,
            completed: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await addDoc(collection(db, "tasks"), taskData);
        }
      }

      alert(
        editingProject
          ? "Project updated successfully!"
          : "Project created successfully!"
      );

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      alert("Failed to save: " + error.message);
    }
  };

  const allMembers =
    type === "single"
      ? [user.email]
      : [
          user.email,
          ...members.filter((m) => users?.some((u) => u.email === m)),
        ];

  const getFriendDisplayName = (friendEmail) => {
    const friend = acceptedFriends.find((f) => f.email === friendEmail);
    return friend?.username || friend?.name || friendEmail;
  };

  if (editingProject && !isLeader) {
    const allMembersFiltered =
      type === "single"
        ? [user.email]
        : [
            user.email,
            ...members.filter((m) => users?.some((u) => u.email === m)),
          ];

    return (
      <LinearGradient
        colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  contentHeight < height ? height - contentHeight : 20,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={(w, h) => setContentHeight(h)}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={isTablet ? 28 : 24}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>View Project</Text>
            </View>

            <View style={styles.warningBox}>
              <View style={styles.warningContent}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={isTablet ? 24 : 20}
                  color="#EF4444"
                />
                <Text style={styles.warningText}>
                  You cannot edit this project. Only the project leader can make
                  changes.
                </Text>
              </View>
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.fieldLabel}>Project Title</Text>
              <Text style={styles.fieldValue}>{editingProject.title}</Text>
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldValue}>
                {editingProject.description || "No description"}
              </Text>
            </View>

            {editingProject.projectLink && (
              <View style={styles.readOnlyField}>
                <Text style={styles.fieldLabel}>Project Link</Text>
                <Text style={[styles.fieldValue, { color: "#93C5FD" }]}>
                  {editingProject.projectLink}
                </Text>
              </View>
            )}

            <View style={styles.readOnlyField}>
              <Text style={styles.fieldLabel}>Type</Text>
              <Text style={styles.fieldValue}>
                {editingProject.type === "single"
                  ? "Solo Project"
                  : "Group Project"}
              </Text>
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>
                {editingProject.status === "ongoing" ? "Ongoing" : "Completed"}
              </Text>
            </View>

            <View style={styles.readOnlyField}>
              <Text style={styles.fieldLabel}>Members</Text>
              {editingProject.members
                .filter((member) => users?.some((u) => u.email === member))
                .map((member, index) => (
                  <Text key={index} style={styles.fieldValue}>
                    • {getFriendDisplayName(member)}
                  </Text>
                ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.goBackButton}>
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={isTablet ? 28 : 24}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {editingProject ? "Edit Project" : "Create Project"}
            </Text>
          </View>

          <TextInput
            placeholder="Project Title"
            placeholderTextColor="#ccc"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            editable={isLeader}
          />

          <TextInput
            placeholder="Description"
            placeholderTextColor="#ccc"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
            multiline
            editable={isLeader}
          />

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons
                name="link-variant"
                size={isTablet ? 20 : 18}
                color="#93C5FD"
              />
              <Text style={styles.label}>Project Link (Optional)</Text>
            </View>
            <TextInput
              placeholder="https://github.com/username/project"
              placeholderTextColor="#666"
              value={projectLink}
              onChangeText={setProjectLink}
              style={styles.input}
              keyboardType="url"
              autoCapitalize="none"
              editable={isLeader}
            />
          </View>

          <View style={styles.typeButtonRow}>
            <LinearGradient
              colors={
                type === "single"
                  ? ["#1E3A8A", "#3B82F6"]
                  : ["#111827", "#1F2937"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.typeButtonGradient}>
              <TouchableOpacity
                onPress={() => isLeader && setType("single")}
                disabled={!isLeader}
                style={styles.typeButton}>
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      fontWeight: type === "single" ? "700" : "500",
                      opacity: isLeader ? 1 : 0.5,
                    },
                  ]}>
                  Single
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            <LinearGradient
              colors={
                type === "group"
                  ? ["#1E3A8A", "#3B82F6"]
                  : ["#111827", "#1F2937"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.typeButtonGradient, { marginLeft: 8 }]}>
              <TouchableOpacity
                onPress={() => isLeader && setType("group")}
                disabled={!isLeader}
                style={styles.typeButton}>
                <Text
                  style={[
                    styles.typeButtonText,
                    {
                      fontWeight: type === "group" ? "700" : "500",
                      opacity: isLeader ? 1 : 0.5,
                    },
                  ]}>
                  Group
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {type === "group" && (
            <View style={styles.membersSection}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons
                  name="account-multiple"
                  size={isTablet ? 20 : 18}
                  color="#93C5FD"
                />
                <Text style={styles.sectionTitle}>
                  Add Members ({acceptedFriends.length} friends)
                </Text>
              </View>

              {usersLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading friends...</Text>
                </View>
              ) : acceptedFriends.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="account-off-outline"
                    size={isTablet ? 48 : 40}
                    color="rgba(255,255,255,0.3)"
                  />
                  <Text style={styles.emptyText}>
                    No friends yet. Add friends to create group projects!
                  </Text>
                  {isLeader && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Friends")}
                      style={styles.emptyButton}>
                      <Text style={styles.emptyButtonText}>Go to Friends</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                acceptedFriends.map((friend) => {
                  const displayName =
                    friend.username || friend.name || friend.email;
                  const initials = displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.memberItem,
                        members.includes(friend.email) && styles.memberActive,
                        !isLeader && { opacity: 0.6 },
                      ]}
                      onPress={() =>
                        isLeader &&
                        setMembers((prev) =>
                          prev.includes(friend.email)
                            ? prev.filter((m) => m !== friend.email)
                            : [...prev, friend.email]
                        )
                      }
                      disabled={!isLeader}>
                      <View style={styles.memberContent}>
                        <View
                          style={[
                            styles.memberAvatar,
                            {
                              backgroundColor: members.includes(friend.email)
                                ? "#3B82F6"
                                : "#F43F5E",
                            },
                          ]}>
                          <Text style={styles.memberAvatarText}>
                            {friend.avatar || friend.emoji || initials}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.memberName,
                              {
                                color: members.includes(friend.email)
                                  ? "#000"
                                  : "#fff",
                              },
                            ]}>
                            {displayName}
                          </Text>
                          <Text
                            style={[
                              styles.memberEmail,
                              {
                                color: members.includes(friend.email)
                                  ? "#374151"
                                  : "#9CA3AF",
                              },
                            ]}>
                            {friend.email}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={
                            members.includes(friend.email)
                              ? "checkbox-marked"
                              : "checkbox-blank-outline"
                          }
                          size={24}
                          color={
                            members.includes(friend.email) ? "#000" : "#9CA3AF"
                          }
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {editingProject && (
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Project Status</Text>
              <View style={styles.statusButtonRow}>
                {status === "ongoing" ? (
                  <LinearGradient
                    colors={["#B8860B", "#FFD700"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.statusButtonGradient}>
                    <TouchableOpacity
                      onPress={() => isLeader && setStatus("ongoing")}
                      disabled={!isLeader}
                      style={[
                        styles.statusButton,
                        { opacity: isLeader ? 1 : 0.6 },
                      ]}>
                      <Text style={styles.statusButtonText}>Ongoing</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                ) : (
                  <TouchableOpacity
                    onPress={() => isLeader && setStatus("ongoing")}
                    disabled={!isLeader}
                    style={[
                      styles.statusButtonInactive,
                      { opacity: isLeader ? 1 : 0.6 },
                    ]}>
                    <Text style={styles.statusButtonText}>Ongoing</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => isLeader && setStatus("completed")}
                  disabled={!isLeader}
                  style={[
                    styles.statusButtonInactive,
                    {
                      backgroundColor:
                        status === "completed" ? "#22C55E" : "#111827",
                      opacity: isLeader ? 1 : 0.6,
                    },
                  ]}>
                  <Text style={styles.statusButtonText}>Completed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.tasksSection}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons
                name="checkbox-marked-outline"
                size={isTablet ? 22 : 20}
                color="#93C5FD"
              />
              <Text style={styles.sectionTitle}>Assign Tasks</Text>
            </View>

            {allMembers.map((member) => (
              <View key={member} style={styles.taskCard}>
                <View style={styles.taskCardHeader}>
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={isTablet ? 20 : 18}
                    color="#FBBF24"
                  />
                  <Text style={styles.taskCardTitle}>
                    {member === user.email
                      ? type === "single"
                        ? "Your Tasks"
                        : `${getFriendDisplayName(member)} (You)`
                      : getFriendDisplayName(member)}
                  </Text>
                </View>

                <View style={styles.taskInputRow}>
                  <TextInput
                    placeholder={
                      canAddTask(member)
                        ? "Enter task..."
                        : "Only leader can add tasks"
                    }
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={newTaskInputs[member] || ""}
                    onChangeText={(text) =>
                      canAddTask(member) &&
                      setNewTaskInputs((prev) => ({
                        ...prev,
                        [member]: text,
                      }))
                    }
                    style={[
                      styles.taskInput,
                      { opacity: canAddTask(member) ? 1 : 0.5 },
                    ]}
                    onSubmitEditing={() => handleAddTask(member)}
                    editable={canAddTask(member)}
                  />
                  <TouchableOpacity
                    onPress={() => handleAddTask(member)}
                    disabled={!canAddTask(member)}
                    style={[
                      styles.taskAddButton,
                      { opacity: canAddTask(member) ? 1 : 0.5 },
                    ]}>
                    <MaterialCommunityIcons
                      name="plus"
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>

                {memberTasks[member]?.length > 0 ? (
                  <View>
                    {memberTasks[member].map((task, index) => (
                      <View key={index} style={styles.taskItem}>
                        <Text style={styles.taskItemText}>{task.title}</Text>
                        {canDeleteTask(member) && (
                          <TouchableOpacity
                            onPress={() => handleRemoveTask(member, index)}>
                            <MaterialCommunityIcons
                              name="close"
                              size={20}
                              color="#EF4444"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noTasksText}>No tasks added yet</Text>
                )}
              </View>
            ))}
          </View>

          <LinearGradient
            colors={["#1E3A8A", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.submitButton, { opacity: isLeader ? 1 : 0.5 }]}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isLeader}
              activeOpacity={0.8}
              style={styles.submitButtonInner}>
              <Text style={styles.submitButtonText}>
                {editingProject ? "Update Project" : "Create Project"}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: width > 768 ? "20%" : 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isTablet ? 30 : 20,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: "700",
    color: "#fff",
  },
  warningBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: isTablet ? 18 : 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    color: "#EF4444",
    marginLeft: 8,
    fontWeight: "600",
    flex: 1,
    fontSize: isTablet ? 15 : 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: isTablet ? 14 : 12,
    marginBottom: 12,
    color: "#fff",
    fontSize: isTablet ? 16 : 14,
  },
  textArea: {
    height: isTablet ? 120 : 100,
    textAlignVertical: "top",
  },
  inputGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#93C5FD",
    marginLeft: 6,
    fontSize: isTablet ? 15 : 14,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 18 : 16,
    marginLeft: 8,
  },
  typeButtonRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  typeButtonGradient: {
    flex: 1,
    borderRadius: 8,
    padding: isTablet ? 14 : 12,
    height: isTablet ? 50 : 45,
    overflow: "hidden",
  },
  typeButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  typeButtonText: {
    color: "#fff",
    fontSize: isTablet ? 16 : 14,
  },
  membersSection: {
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    marginTop: 8,
    fontSize: isTablet ? 15 : 14,
  },
  emptyState: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    fontSize: isTablet ? 15 : 14,
  },
  emptyButton: {
    marginTop: 12,
    paddingVertical: isTablet ? 10 : 8,
    paddingHorizontal: 16,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 15 : 14,
  },
  memberItem: {
    padding: isTablet ? 14 : 12,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  memberActive: {
    backgroundColor: "#E5E7EB",
    borderColor: "#3B82F6",
  },
  memberContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: isTablet ? 40 : 36,
    height: isTablet ? 40 : 36,
    borderRadius: isTablet ? 20 : 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: isTablet ? 16 : 14,
  },
  memberName: {
    fontWeight: "600",
    fontSize: isTablet ? 16 : 15,
  },
  memberEmail: {
    fontSize: isTablet ? 13 : 12,
    marginTop: 2,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusLabel: {
    marginBottom: 8,
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 14,
  },
  statusButtonRow: {
    flexDirection: "row",
  },
  statusButtonGradient: {
    flex: 1,
    borderRadius: 6,
    marginRight: 8,
  },
  statusButton: {
    flex: 1,
    padding: isTablet ? 12 : 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  statusButtonInactive: {
    flex: 1,
    padding: isTablet ? 12 : 10,
    borderRadius: 6,
    backgroundColor: "#111827",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statusButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: isTablet ? 15 : 14,
  },
  tasksSection: {
    marginBottom: 20,
  },
  taskCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: isTablet ? 18 : 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  taskCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  taskCardTitle: {
    color: "#FBBF24",
    fontSize: isTablet ? 15 : 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  taskInputRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  taskInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: isTablet ? 12 : 10,
    borderRadius: 8,
    marginRight: 8,
    fontSize: isTablet ? 15 : 14,
  },
  taskAddButton: {
    backgroundColor: "#3B82F6",
    padding: isTablet ? 12 : 10,
    borderRadius: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: isTablet ? 12 : 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  taskItemText: {
    color: "#fff",
    flex: 1,
    fontSize: isTablet ? 15 : 14,
  },
  noTasksText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: isTablet ? 13 : 12,
    fontStyle: "italic",
  },
  submitButton: {
    marginTop: 15,
    padding: isTablet ? 16 : 14,
    borderRadius: 8,
    overflow: "hidden",
    height: isTablet ? 54 : 50,
  },
  submitButtonInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 17 : 16,
  },
  readOnlyField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: isTablet ? 18 : 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fieldLabel: {
    color: "#93C5FD",
    fontSize: isTablet ? 13 : 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#fff",
    fontSize: isTablet ? 16 : 15,
    lineHeight: 22,
  },
  goBackButton: {
    backgroundColor: "#3B82F6",
    padding: isTablet ? 16 : 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  goBackButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 14,
  },
});
