import { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const useProfile = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (userId, profileData) => {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    setIsUpdating(true);
    setError(null);

    try {
      const userRef = doc(db, "users", userId);

      const cleanedData = {};
      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== undefined) {
          cleanedData[key] = profileData[key];
        }
      });

      await updateDoc(userRef, cleanedData);

      const updatedSnap = await getDoc(userRef);

      if (!updatedSnap.exists()) {
        throw new Error("Profile not found after update");
      }

      const updatedProfile = updatedSnap.data();

      return { success: true, data: updatedProfile };
    } catch (err) {
      console.error("Update profile error:", err);
      const errorMessage = err.message || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  const getProfile = async (userId) => {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        return { success: false, error: "Profile not found" };
      }

      return { success: true, data: snap.data() };
    } catch (err) {
      console.error("Get profile error:", err);
      const errorMessage = err.message || "Failed to get profile";
      return { success: false, error: errorMessage };
    }
  };

  return {
    updateProfile,
    getProfile,
    isUpdating,
    error,
  };
};
