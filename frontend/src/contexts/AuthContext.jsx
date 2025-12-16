import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,

  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase-config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userTier, setUserTier] = useState(null);
  const [userCompanyId, setUserCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login functions
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  function register(email, password, name) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(async (result) => {
        await updateProfile(result.user, { displayName: name });
        await createUserProfile(result.user, { displayName: name });
        return result;
      });


  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Helper to create/update Firestore profile
  async function createUserProfile(user, additionalData = {}) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: additionalData.displayName || user.displayName || "",
        photoURL: user.photoURL || "",
        tier: "freemium",
        companyId: null,
        role: "Usuario",
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    } else {
      await updateDoc(userRef, { lastLoginAt: new Date() });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log("AuthContext: User detected", user.email);
          // Set user immediately to unblock UI
          setCurrentUser(user);
          
          // Background operations
          try {
              const idTokenResult = await user.getIdTokenResult(); // Remove true to use cached if available
              const role = idTokenResult.claims.role || "Usuario";
              const companyId = idTokenResult.claims.companyId || null;
              
              let tier = "freemium";
              if (role === "Superuser" || role === "Admin") {
                tier = "premium";
              } else {
                tier = idTokenResult.claims.tier || (companyId ? "premium" : "freemium");
              }

              setUserRole(role);
              setUserCompanyId(companyId);
              setUserTier(tier);
              
              // Non-blocking profile sync
              createUserProfile(user).catch(e => console.error("Profile sync failed", e));
          } catch (e) {
              console.error("Error fetching claims", e);
          }
        } else {
          console.log("AuthContext: No user");
          setCurrentUser(null);
          setUserRole(null);
          setUserTier(null);
          setUserCompanyId(null);
        }
      } catch (err) {
        console.error("AuthContext Error:", err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userTier,
    userCompanyId,
    login,
    loginWithGoogle,
    logout,
    register,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
