import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  getDocs,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { getAuth } from "firebase/auth";

export default function useAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const sendFriendRequest = async (userId) => {
    if (!currentUser) return;

    try {
      const receiverRef = doc(db, "users", userId);

      await updateDoc(receiverRef, {
        friendRequests: arrayUnion(currentUser.uid),
      });

      console.log(`Friend request sent to document ID: ${userId}`);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const acceptFriendRequest = async (senderDocId) => {
    if (!currentUser) return;

    try {
      const currentUserDoc = users.find((u) => u.uid === currentUser.uid);
      if (!currentUserDoc) {
        console.error("Current user document not found");
        return;
      }

      const senderDoc = users.find((u) => u.id === senderDocId);
      if (!senderDoc) {
        console.error("Sender document not found");
        return;
      }

      const currentUserRef = doc(db, "users", currentUserDoc.id);
      const senderRef = doc(db, "users", senderDocId);

      await updateDoc(currentUserRef, {
        friends: arrayUnion(senderDoc.uid),
        friendRequests: arrayRemove(senderDoc.uid),
      });

      await updateDoc(senderRef, {
        friends: arrayUnion(currentUser.uid),
      });

      console.log(`Friend request accepted from ${senderDoc.uid}`);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const refreshUsers = async () => {
    if (!currentUser) return;

    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Error refreshing users:", error);
    }
  };

  return {
    users,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    refreshUsers,
  };
}
