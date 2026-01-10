import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";

import FooterMenu from "../components/FooterMenu";
import useAllUsers from "../hooks/useAllUsers";
import { useProfile } from "../hooks/useProfile";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function FriendsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("ALL");
  const {
    users,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    refreshUsers,
  } = useAllUsers();

  const { updateProfile } = useProfile();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUserProfile = users.find((u) => u.uid === currentUser.uid);

  const handleEmojiUpdate = async (userId, newEmoji) => {
    const { success } = await updateProfile(userId, { emoji: newEmoji });
    if (success) {
      refreshUsers();
    }
  };

  const acceptedFriends = users.filter((u) =>
    currentUserProfile?.friends?.includes(u.uid)
  );

  const incomingRequests = users.filter((u) => {
    const isInRequests = currentUserProfile?.friendRequests?.includes(u.uid);
    const notAlreadyFriend = !currentUserProfile?.friends?.includes(u.uid);
    return isInRequests && notAlreadyFriend && u.uid !== currentUser.uid;
  });

  const hasSentRequest = (user) =>
    user.friendRequests?.includes(currentUser.uid);

  const renderUser = ({ item, isRequest = false }) => {
    const displayName = item.name || item.username || "Unnamed User";
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2);

    const requestSent = hasSentRequest(item);

    const isFriend = acceptedFriends.some((f) => f.uid === item.uid);

    return (
      <View
        style={[
          styles.userCard,
          requestSent && !isRequest && { backgroundColor: "#1a2150" },
        ]}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarFallback,
              requestSent && !isRequest && { backgroundColor: "#888888" },
            ]}>
            <Text style={styles.avatarText}>
              {item.avatar || item.emoji || initials}
            </Text>
          </View>

          <View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>

        {!isRequest && (
          <TouchableOpacity
            style={[
              styles.addButton,
              requestSent && !isFriend && { backgroundColor: "#555555" },
              isFriend && { backgroundColor: "#F43F5E" },
            ]}
            onPress={() => {
              if (!requestSent && !isFriend) {
                sendFriendRequest(item.id);
              }
            }}
            activeOpacity={0.8}>
            <MaterialCommunityIcons
              name={
                isFriend
                  ? "check-circle-outline"
                  : requestSent
                  ? "clock-outline"
                  : "account-plus-outline"
              }
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        )}

        {isRequest && (
          <TouchableOpacity
            style={[styles.addButton, styles.acceptButton]}
            onPress={() => acceptFriendRequest(item.id)}
            activeOpacity={0.8}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Accept</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#0A0F2C", "#1B103F", "#4A0E2E"]}
      style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "FRIENDS" && styles.activeTab]}
            onPress={() => setActiveTab("FRIENDS")}>
            <View style={styles.tabContent}>
              <Text style={styles.tabText}>Friends</Text>
              {incomingRequests.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {incomingRequests.length > 9
                      ? "9+"
                      : incomingRequests.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "ALL" && styles.activeTab]}
            onPress={() => setActiveTab("ALL")}>
            <Text style={styles.tabText}>All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading users...</Text>
        ) : activeTab === "ALL" ? (
          <FlatList
            data={users.filter(
              (u) =>
                u.uid !== currentUser.uid &&
                !acceptedFriends.some((f) => f.uid === u.uid)
            )}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 150 }}
          />
        ) : (
          <>
            {incomingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Requests ({incomingRequests.length})
                </Text>
                <View style={styles.requestsContainer}>
                  {incomingRequests.map((item) => (
                    <View key={item.id}>
                      {renderUser({ item, isRequest: true })}
                    </View>
                  ))}
                </View>
              </>
            )}

            {acceptedFriends.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 80 }]}>
                  Friends ({acceptedFriends.length})
                </Text>
                <FlatList
                  data={acceptedFriends}
                  keyExtractor={(item) => item.id}
                  renderItem={renderUser}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 150 }}
                />
              </>
            ) : incomingRequests.length === 0 ? (
              <Text style={styles.loadingText}>No friends yet</Text>
            ) : null}
          </>
        )}

        <FooterMenu
          activeIndex={3}
          onPressDashboard={() => navigation.navigate("Home")}
          onPressRequests={() => navigation.navigate("Requests")}
          onPressSettings={() => navigation.navigate("Settings")}
          onPressFriends={() => {}}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  tabs: {
    flexDirection: "row",
    marginTop: isTablet ? 24 : 12,
    marginHorizontal: 16,
    backgroundColor: "#131A4A",
    borderRadius: 14,
    overflow: "hidden",
  },

  tab: {
    flex: 1,
    paddingVertical: isTablet ? 16 : 12,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTab: { backgroundColor: "#F43F5E" },

  tabContent: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  tabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: isTablet ? 16 : 14,
  },

  notificationBadge: {
    position: "absolute",
    top: -8,
    right: -16,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#131A4A",
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  loadingText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },

  sectionTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },

  requestsList: {
    maxHeight: 400,
    marginBottom: 24,
  },

  requestsContainer: {
    marginBottom: 24,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#131A4A",
    marginHorizontal: 16,
    marginTop: 12,
    padding: isTablet ? 20 : 16,
    borderRadius: 14,
  },

  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },

  avatarFallback: {
    width: isTablet ? 56 : 44,
    height: isTablet ? 56 : 44,
    borderRadius: 28,
    backgroundColor: "#F43F5E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: isTablet ? 18 : 16,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: isTablet ? 17 : 15,
    fontWeight: "600",
  },

  userEmail: {
    color: "#9CA3AF",
    fontSize: isTablet ? 14 : 12,
    marginTop: 2,
  },

  addButton: {
    backgroundColor: "#F43F5E",
    padding: isTablet ? 12 : 10,
    borderRadius: 10,
  },

  acceptButton: {
    backgroundColor: "#F43F5E",
    paddingVertical: isTablet ? 16 : 14,
    paddingHorizontal: isTablet ? 24 : 20,
  },
});
