import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
        memberEmail === user.email || 
        users.some((u) => u.email === memberEmail) 
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
        style={styles.gradient}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 40,
              marginBottom: 20,
            }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginRight: 12 }}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
              View Project
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#EF4444",
            }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color="#EF4444"
              />
              <Text
                style={{
                  color: "#EF4444",
                  marginLeft: 8,
                  fontWeight: "600",
                  flex: 1,
                }}>
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
            style={{
              backgroundColor: "#3B82F6",
              padding: 14,
              borderRadius: 8,
              alignItems: "center",
              marginTop: 20,
            }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 40,
            marginBottom: 20,
          }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 12 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>
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
          style={[styles.input, { height: 100 }]}
          multiline
          editable={isLeader}
        />

        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}>
            <MaterialCommunityIcons
              name="link-variant"
              size={18}
              color="#93C5FD"
            />
            <Text style={{ color: "#93C5FD", marginLeft: 6, fontSize: 14 }}>
              Project Link (Optional)
            </Text>
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

        <View style={{ flexDirection: "row", marginBottom: 16 }}>
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
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "#fff",
                  fontWeight: type === "single" ? "700" : "500",
                  opacity: isLeader ? 1 : 0.5,
                }}>
                Single
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <LinearGradient
            colors={
              type === "group" ? ["#1E3A8A", "#3B82F6"] : ["#111827", "#1F2937"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.typeButtonGradient, { marginLeft: 8 }]}>
            <TouchableOpacity
              onPress={() => isLeader && setType("group")}
              disabled={!isLeader}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "#fff",
                  fontWeight: type === "group" ? "700" : "500",
                  opacity: isLeader ? 1 : 0.5,
                }}>
                Group
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {type === "group" && (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={18}
                color="#93C5FD"
              />
              <Text
                style={{
                  marginLeft: 6,
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 16,
                }}>
                Add Members ({acceptedFriends.length} friends)
              </Text>
            </View>

            {usersLoading ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={{ color: "#9CA3AF", marginTop: 8 }}>
                  Loading friends...
                </Text>
              </View>
            ) : acceptedFriends.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  alignItems: "center",
                }}>
                <MaterialCommunityIcons
                  name="account-off-outline"
                  size={40}
                  color="rgba(255,255,255,0.3)"
                />
                <Text
                  style={{
                    color: "#9CA3AF",
                    marginTop: 8,
                    textAlign: "center",
                  }}>
                  No friends yet. Add friends to create group projects!
                </Text>
                {isLeader && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Friends")}
                    style={{
                      marginTop: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: "#3B82F6",
                      borderRadius: 8,
                    }}>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Go to Friends
                    </Text>
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
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: members.includes(friend.email)
                            ? "#3B82F6"
                            : "#F43F5E",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}>
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "700",
                            fontSize: 14,
                          }}>
                          {friend.avatar || friend.emoji || initials}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: members.includes(friend.email)
                              ? "#000"
                              : "#fff",
                            fontWeight: "600",
                            fontSize: 15,
                          }}>
                          {displayName}
                        </Text>
                        <Text
                          style={{
                            color: members.includes(friend.email)
                              ? "#374151"
                              : "#9CA3AF",
                            fontSize: 12,
                            marginTop: 2,
                          }}>
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
          <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 8, color: "#fff", fontWeight: "600" }}>
              Project Status
            </Text>
            <View style={{ flexDirection: "row" }}>
              {status === "ongoing" ? (
                <LinearGradient
                  colors={["#B8860B", "#FFD700"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flex: 1,
                    borderRadius: 6,
                    marginRight: 8,
                  }}>
                  <TouchableOpacity
                    onPress={() => isLeader && setStatus("ongoing")}
                    disabled={!isLeader}
                    style={{
                      flex: 1,
                      padding: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 6,
                      opacity: isLeader ? 1 : 0.6,
                    }}>
                    <Text
                      style={{
                        color: "#fff",
                        textAlign: "center",
                        fontWeight: "600",
                      }}>
                      Ongoing
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  onPress={() => isLeader && setStatus("ongoing")}
                  disabled={!isLeader}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: "#111827",
                    marginRight: 8,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: isLeader ? 1 : 0.6,
                  }}>
                  <Text
                    style={{
                      color: "#fff",
                      textAlign: "center",
                      fontWeight: "600",
                    }}>
                    Ongoing
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => isLeader && setStatus("completed")}
                disabled={!isLeader}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor:
                    status === "completed" ? "#22C55E" : "#111827",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: isLeader ? 1 : 0.6,
                }}>
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "600",
                  }}>
                  Completed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}>
            <MaterialCommunityIcons
              name="checkbox-marked-outline"
              size={20}
              color="#93C5FD"
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "600",
                marginLeft: 8,
              }}>
              Assign Tasks
            </Text>
          </View>

          {allMembers.map((member) => (
            <View
              key={member}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
              }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={18}
                  color="#FBBF24"
                />
                <Text
                  style={{
                    color: "#FBBF24",
                    fontSize: 14,
                    fontWeight: "600",
                    marginLeft: 6,
                  }}>
                  {member === user.email
                    ? type === "single"
                      ? "Your Tasks"
                      : `${getFriendDisplayName(member)} (You)`
                    : getFriendDisplayName(member)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 12,
                  alignItems: "center",
                }}>
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
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    padding: 10,
                    borderRadius: 8,
                    marginRight: 8,
                    opacity: canAddTask(member) ? 1 : 0.5,
                  }}
                  onSubmitEditing={() => handleAddTask(member)}
                  editable={canAddTask(member)}
                />
                <TouchableOpacity
                  onPress={() => handleAddTask(member)}
                  disabled={!canAddTask(member)}
                  style={{
                    backgroundColor: "#3B82F6",
                    padding: 10,
                    borderRadius: 8,
                    opacity: canAddTask(member) ? 1 : 0.5,
                  }}>
                  <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {memberTasks[member]?.length > 0 ? (
                <View>
                  {memberTasks[member].map((task, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 6,
                      }}>
                      <Text style={{ color: "#fff", flex: 1 }}>
                        {task.title}
                      </Text>
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
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    fontStyle: "italic",
                  }}>
                  No tasks added yet
                </Text>
              )}
            </View>
          ))}
        </View>

        <LinearGradient
          colors={["#1E3A8A", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.createButton, { opacity: isLeader ? 1 : 0.5 }]}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isLeader}
            activeOpacity={0.8}
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {editingProject ? "Update Project" : "Create Project"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = {
  gradient: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: "#fff",
  },
  typeButtonGradient: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    height: 45,
    overflow: "hidden",
  },
  memberItem: {
    padding: 12,
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
  createButton: {
    marginTop: 15,
    padding: 14,
    borderRadius: 8,
    overflow: "hidden",
    height: 50,
    marginBottom: 20,
  },
  readOnlyField: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fieldLabel: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  fieldValue: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
};
