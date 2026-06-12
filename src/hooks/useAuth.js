import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Helper to get or create unique device ID
function getOrCreateDeviceId() {
  let id = localStorage.getItem('FasilkomProker_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('FasilkomProker_device_id', id);
  }
  return id;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceBlocked, setDeviceBlocked] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Subscribe to user profile in real-time
        const profileRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (profileSnap) => {
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            const activeDevices = data.activeDevices || [];
            const deviceId = getOrCreateDeviceId();
            const isSessionActive = sessionStorage.getItem('FasilkomProker_session_active') === 'true';

            if (activeDevices.includes(deviceId)) {
              // Current device is already authorized
              setProfile(data);
              setDeviceBlocked(false);
              sessionStorage.setItem('FasilkomProker_session_active', 'true');
            } else if (!isSessionActive && activeDevices.length < 2) {
              // New tab/session, and space is available -> register device
              setProfile(data);
              setDeviceBlocked(false);
              sessionStorage.setItem('FasilkomProker_session_active', 'true');
              try {
                await updateDoc(profileRef, {
                  activeDevices: arrayUnion(deviceId)
                });
              } catch (err) {
                console.error("Gagal mendaftarkan device:", err);
              }
            } else {
              // Blocked (exceeded limit of 2 devices or kicked by another device)
              setProfile(data);
              setDeviceBlocked(true);
              sessionStorage.removeItem('FasilkomProker_session_active');
            }
          } else {
            setProfile(null); // No profile yet -> onboarding
            setDeviceBlocked(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setDeviceBlocked(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const resetDevices = async () => {
    if (!user) return;
    const deviceId = getOrCreateDeviceId();
    const profileRef = doc(db, 'users', user.uid);
    sessionStorage.setItem('FasilkomProker_session_active', 'true');
    setDeviceBlocked(false);
    try {
      await updateDoc(profileRef, {
        activeDevices: [deviceId]
      });
    } catch (err) {
      console.error("Gagal mereset perangkat:", err);
    }
  };

  const logout = async () => {
    if (user) {
      const deviceId = getOrCreateDeviceId();
      const profileRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(profileRef, {
          activeDevices: arrayRemove(deviceId)
        });
      } catch (err) {
        console.error("Gagal menghapus device id saat logout:", err);
      }
    }
    sessionStorage.removeItem('FasilkomProker_session_active');
    await signOut(auth);
  };

  return { user, profile, loading, deviceBlocked, resetDevices, logout };
}
