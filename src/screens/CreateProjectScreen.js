import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProjects } from "../hooks/useProject";

export default function CreateProjectScreen({ navigation, route }) {
  const { user } = useAuth();
  const { createProject, updateProject } = useProjects();

  const editingProject = route?.params?.project;

  const [title, setTitle] = useState(editingProject?.title || "");
  const [description, setDescription] = useState(
    editingProject?.description || ""
  );
  const [projectLink, setProjectLink] = useState(
    editingProject?.projectLink || ""
  );
  const [type, setType] = useState(editingProject?.type || "single");
  const [members, setMembers] = useState(editingProject?.members || []);

  const friends = ["Alex", "Jamie", "Chris"];

  const handleSubmit = async () => {
    const projectData = {
      title,
      description,
      projectLink,
      type,
      leader: user.email,
      members: type === "single" ? [user.email] : [user.email, ...members],
    };

    if (editingProject) {
      const result = await updateProject(editingProject.id, projectData);
      if (result.success) {
        console.log("Project updated successfully");
        navigation.goBack();
      } else {
        alert("Failed to update project: " + result.error);
      }
    } else {
      const result = await createProject(projectData);
      if (result.success) {
        console.log("Project created with ID:", result.id);
        navigation.goBack();
      } else {
        alert("Failed to create project: " + result.error);
      }
    }
  };

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <View style={{ padding: 20, flex: 1 }}>
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
          <View>
            <Text style={{ marginBottom: 8, color: "#fff" }}>Add Members</Text>
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
                <Text>{friend}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
      </View>
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
  },
  memberActive: {
    backgroundColor: "#E5E7EB",
  },
  createButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    overflow: "hidden",
    height: 50,
  },
};
