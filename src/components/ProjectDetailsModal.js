import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProjectDetailsModal({ visible, project, onClose }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.modalTitle}>Project Details</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {project && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Title</Text>
                    <Text style={styles.modalValue}>{project.title}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Type</Text>
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
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Description</Text>
                      <Text style={styles.modalValue}>
                        {project.description}
                      </Text>
                    </View>
                  )}

                  {project.projectLink && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Project Link</Text>
                      <Text
                        style={[styles.modalValue, { color: "#3B82F6" }]}
                        onPress={() => {
                          Linking.openURL(project.projectLink);
                        }}>
                        {project.projectLink}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Leader</Text>
                    <Text style={styles.modalValue}>{project.leader}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>
                      Members ({project.members.length})
                    </Text>
                    {project.members.map((member, index) => (
                      <View key={index} style={styles.memberRow}>
                        <MaterialCommunityIcons
                          name="account"
                          size={20}
                          color="#93C5FD"
                        />
                        <Text style={styles.memberText}>{member}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Created</Text>
                    <Text style={styles.modalValue}>
                      {project.createdAt?.toDate?.().toLocaleDateString() ||
                        "N/A"}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmModal({ visible, title, message, onConfirm, onCancel }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={confirmStyles.overlay}>
        <View style={confirmStyles.container}>
          <Text style={confirmStyles.title}>{title}</Text>
          <Text style={confirmStyles.message}>{message}</Text>

          <View style={confirmStyles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              style={confirmStyles.cancelButton}>
              <Text style={confirmStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={confirmStyles.deleteButton}>
              <Text style={confirmStyles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "85%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalGradient: {
    maxHeight: 600,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  modalContent: {
    padding: 20,
    maxHeight: 450,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
  },
  projectTypeBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  groupBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
  },
  projectTypeText: {
    fontSize: 14,
    color: "#93C5FD",
    fontWeight: "500",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    marginBottom: 8,
  },
  memberText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 10,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  modalButton: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  modalButtonText: {
    color: "#93C5FD",
    fontSize: 16,
    fontWeight: "600",
  },
});

const confirmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#1B103F",
    borderRadius: 12,
    padding: 20,
    width: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  message: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelText: {
    color: "#93C5FD",
    fontWeight: "600",
  },
  deleteButton: {
    padding: 10,
  },
  deleteText: {
    color: "#EF4444",
    fontWeight: "600",
  },
});
