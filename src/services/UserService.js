import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";

export const createUserProfile = async (user, username) => {
  try {
    const userDoc = doc(db, "users", user.uid);

    const userData = {
      username: username,
      email: user.email,
      createdAt: new Date().toISOString(),
      uid: user.uid,
    };

    await setDoc(userDoc, userData);
  } catch (error) {
    throw error;
  }
};

export const deleteAccountWithPassword = async (password) => {
  if (!auth.currentUser) throw new Error("No user is logged in.");

  const user = auth.currentUser;
  const userId = user.uid;
  const credential = EmailAuthProvider.credential(user.email, password);

  try {
    await reauthenticateWithCredential(user, credential);

    const usersSnapshot = await getDocs(collection(db, "users"));
    const batchUserUpdates = [];
    usersSnapshot.forEach((uDoc) => {
      const userRef = doc(db, "users", uDoc.id);
      batchUserUpdates.push(
        updateDoc(userRef, {
          friends: arrayRemove(userId),
          friendRequests: arrayRemove(userId),
        })
      );
    });
    await Promise.all(batchUserUpdates);

    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const batchProjectUpdates = [];
    projectsSnapshot.forEach((pDoc) => {
      const projectRef = doc(db, "projects", pDoc.id);
      batchProjectUpdates.push(
        updateDoc(projectRef, {
          members: arrayRemove(userId),
        })
      );
    });
    await Promise.all(batchProjectUpdates);

    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);

    await deleteUser(user);

  } catch (err) {
    console.error("Account deletion failed:", err);
    throw err;
  }
};
