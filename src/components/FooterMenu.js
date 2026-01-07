import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function FooterMenu({
  onPressDashboard,
  onPressRequests,
  onPressSettings,
  onPressFriends,
  activeIndex = 0,
}) {
  const { user } = useAuth();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "taskDeleteRequests"),
      where("leaderEmail", "==", user.email),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequestCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user?.email]);

  const renderButton = (index, iconName, label, onPress, showBadge = false) => {
    const isActive = activeIndex === index;
    return (
      <TouchableOpacity
        key={index}
        style={styles.footerButton}
        onPress={onPress}
        activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={isActive ? "#FFFFFF" : "#E5E7EB"}
          />
          {showBadge && requestCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {requestCount > 99 ? "99+" : requestCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.footerText, isActive && { color: "#FFFFFF" }]}>
          {label}
        </Text>
        {isActive && <View style={styles.underline} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.footer}>
      {renderButton(0, "view-dashboard-outline", "Dashboard", onPressDashboard)}
      {renderButton(
        1,
        "clipboard-text-outline",
        "Requests",
        onPressRequests,
        true
      )}
      {renderButton(2, "cog-outline", "Settings", onPressSettings)}
      {renderButton(3, "account-group-outline", "Friends", onPressFriends)}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#0A0F2C",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,30,255,0.25)",
    zIndex: 1000,
  },
  footerButton: {
    alignItems: "center",
  },
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#0A0F2C",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  footerText: {
    color: "#E5E7EB",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  underline: {
    height: 2,
    width: 20,
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    borderRadius: 1,
  },
});
