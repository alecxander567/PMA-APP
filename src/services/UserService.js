import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

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