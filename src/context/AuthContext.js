import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { createUserProfile } from "../services/UserService";
import { deleteAccountWithPassword } from "../services/UserService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
    } catch (err) {
      console.error("Firebase Auth failed:", err);
      setLoading(false);
      setUser(null); // fallback
    }

    return () => unsubscribe && unsubscribe();
  }, []);

  const register = async (email, password, username) => {
    try {
      setLoading(true);
      setError("");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await createUserProfile(userCredential.user, username);
      setUser(userCredential.user);
    } catch (err) {
      setError(err.message);
      console.log("Register Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
    } catch (err) {
      setError(err.message);
      console.log("Login Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.log("Logout Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!user) throw new Error("No user logged in");
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
    } catch (err) {
      console.error("Password Update Error:", err);
      throw err;
    }
  };

  const deleteAccount = async (password) => {
    try {
      setLoading(true);
      await deleteAccountWithPassword(password);
      setUser(null);
      await logout();
    } catch (err) {
      console.error("Delete Account Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        updatePassword,
        deleteAccount,
        loading,
        error,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
