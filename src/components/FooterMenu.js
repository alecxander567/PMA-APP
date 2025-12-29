import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function FooterMenu({
  onPressDashboard,
  onPressProjects,
  onPressTasks,
  onPressFriends,
  activeIndex = 0,
}) {
  const renderButton = (index, iconName, label, onPress) => {
    const isActive = activeIndex === index;
    return (
      <TouchableOpacity
        key={index}
        style={styles.footerButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          color={isActive ? "#FFFFFF" : "#E5E7EB"}
        />
        <Text style={[styles.footerText, isActive && { color: "#FFFFFF" }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.footer}>
      {renderButton(0, "view-dashboard-outline", "Dashboard", onPressDashboard)}
      {renderButton(1, "clipboard-text-outline", "Projects", onPressProjects)}
      {renderButton(2, "check-circle-outline", "Tasks", onPressTasks)}
      {renderButton(3, "account-group-outline", "Friends", onPressFriends)}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 40,
    backgroundColor: "#0A0F2C",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,30,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  footerButton: {
    alignItems: "center",
  },
  footerText: {
    color: "#E5E7EB",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
});