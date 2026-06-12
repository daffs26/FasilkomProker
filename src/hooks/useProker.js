import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

export function useProker(prokerId) {
  const [proker, setProker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prokerId) return;
    const docRef = doc(db, 'prokers', prokerId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProker({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProker(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to proker:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [prokerId]);

  const updateProkerDetails = async (updates) => {
    const docRef = doc(db, 'prokers', prokerId);
    await updateDoc(docRef, updates);
  };

  return { proker, loading, updateProkerDetails };
}

export function useProkerSubcollection(prokerId, subcollectionName, orderField = 'createdAt', orderDir = 'asc') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!prokerId || !subcollectionName) return;
    const colRef = collection(db, 'prokers', prokerId, subcollectionName);
    
    let q = colRef;
    if (orderField) {
      q = query(colRef, orderBy(orderField, orderDir));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      console.warn(`Firestore query failed for ${subcollectionName} (likely missing index). Falling back to unordered query.`, error);
      
      const unsubscribeNoOrder = onSnapshot(colRef, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        // Sort in JS as fallback if needed
        if (orderField) {
          items.sort((a, b) => {
            const valA = a[orderField] || '';
            const valB = b[orderField] || '';
            if (valA < valB) return orderDir === 'asc' ? -1 : 1;
            if (valA > valB) return orderDir === 'asc' ? 1 : -1;
            return 0;
          });
        }
        setData(items);
        setLoading(false);
      });
      return () => unsubscribeNoOrder();
    });

    return () => unsubscribe();
  }, [prokerId, subcollectionName, orderField, orderDir]);

  const addItem = async (item) => {
    const colRef = collection(db, 'prokers', prokerId, subcollectionName);
    await addDoc(colRef, {
      ...item,
      createdAt: new Date().toISOString(),
    });
  };

  const updateItem = async (itemId, updates) => {
    const docRef = doc(db, 'prokers', prokerId, subcollectionName, itemId);
    await updateDoc(docRef, updates);
  };

  const deleteItem = async (itemId) => {
    const docRef = doc(db, 'prokers', prokerId, subcollectionName, itemId);
    await deleteDoc(docRef);
  };

  return { data, loading, addItem, updateItem, deleteItem };
}
