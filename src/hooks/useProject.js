import { db } from "../services/firebase";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export const useProjects = (userEmail) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "projects"),
      where("members", "array-contains", userEmail)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const createProject = async (projectData) => {
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating project:", error);
      return { success: false, error: error.message };
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        ...projectData,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating project:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const projectRef = doc(db, "projects", projectId);
      await deleteDoc(projectRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting project:", error);
      return { success: false, error: error.message };
    }
  };

  return { createProject, updateProject, deleteProject, projects, loading };
};
