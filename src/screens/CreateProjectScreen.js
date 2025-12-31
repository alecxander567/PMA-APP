import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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

export default function CreateProjectScreen({ navigation, route }) {
  const { user } = useAuth();

  const canDeleteTask = (memberEmail) => {
    if (type === "single") {
      return memberEmail === user?.email;
    } else {
      return editingProject?.leaderId === user?.uid;
    }
  };

  const { createProject, updateProject } = useProjects(user?.email);

  const editingProject = route?.params?.project;

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

  const friends = ["Alex", "Jamie", "Chris"];

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
    const allMembers =
      type === "single" ? [user.email] : [user.email, ...members];

    setMemberTasks((prev) => {
      let changed = false;
      const updated = { ...prev };

      allMembers.forEach((m) => {
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

      allMembers.forEach((m) => {
        if (!updated[m]) {
          updated[m] = "";
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [type, members]);

  const handleAddTask = (memberEmail) => {
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
      members: type === "single" ? [user.email] : [user.email, ...members],
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
        type === "single" ? [user.email] : [user.email, ...members];

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
        navigation.navigate("HomeScreen");
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      alert("Failed to save: " + error.message);
    }
  };

  const allMembers =
    type === "single" ? [user.email] : [user.email, ...members];

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
        />

        <TextInput
          placeholder="Description"
          placeholderTextColor="#ccc"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 100 }]}
          multiline
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
              onPress={() => setType("single")}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "#fff",
                  fontWeight: type === "single" ? "700" : "500",
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
              onPress={() => setType("group")}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}>
              <Text
                style={{
                  color: "#fff",
                  fontWeight: type === "group" ? "700" : "500",
                }}>
                Group
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {type === "group" && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ marginBottom: 8, color: "#fff", fontWeight: "600" }}>
              Add Members
            </Text>
            {friends.map((friend) => (
              <TouchableOpacity
                key={friend}
                style={[
                  styles.memberItem,
                  members.includes(friend) && styles.memberActive,
                ]}
                onPress={() =>
                  setMembers((prev) =>
                    prev.includes(friend)
                      ? prev.filter((m) => m !== friend)
                      : [...prev, friend]
                  )
                }>
                <Text
                  style={{ color: members.includes(friend) ? "#000" : "#fff" }}>
                  {friend}
                </Text>
              </TouchableOpacity>
            ))}
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
                    onPress={() => setStatus("ongoing")}
                    style={{
                      flex: 1,
                      padding: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 6,
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
                  onPress={() => setStatus("ongoing")}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: "#111827",
                    marginRight: 8,
                    justifyContent: "center",
                    alignItems: "center",
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
                onPress={() => setStatus("completed")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor:
                    status === "completed" ? "#22C55E" : "#111827",
                  justifyContent: "center",
                  alignItems: "center",
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
                      : `${member} (You)`
                    : member}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 12,
                  alignItems: "center",
                }}>
                <TextInput
                  placeholder="Enter task..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={newTaskInputs[member] || ""}
                  onChangeText={(text) =>
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
                  }}
                  onSubmitEditing={() => handleAddTask(member)}
                />
                <TouchableOpacity
                  onPress={() => handleAddTask(member)}
                  style={{
                    backgroundColor: "#3B82F6",
                    padding: 10,
                    borderRadius: 8,
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
          style={styles.createButton}>
          <TouchableOpacity
            onPress={handleSubmit}
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
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  memberActive: {
    backgroundColor: "#E5E7EB",
  },
  createButton: {
    marginTop: 15,
    padding: 14,
    borderRadius: 8,
    overflow: "hidden",
    height: 50,
    marginBottom: 20,
  },
};
