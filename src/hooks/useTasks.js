import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export const useTasks = (projectId, userEmail) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const addTask = async (taskData) => {
    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        ...taskData,
        projectId: projectId,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding task:", error);
      return { success: false, error: error.message };
    }
  };

  const editTask = async (taskId, updatedData) => {
    try {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedData } : task
        )
      );

      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error editing task:", error);
      return { success: false, error: error.message };
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    return await editTask(taskId, { completed });
  };

  const deleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await deleteDoc(taskRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting task:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    tasks,
    loading,
    addTask,
    editTask,
    toggleTaskCompletion,
    deleteTask,
  };
};
