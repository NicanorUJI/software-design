// src/services/firestoreHelpers.ts
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from './firebase';

export const col = (name: string) => collection(db, name);
export const ref = (name: string, id: string) => doc(db, name, id);

// convert Firebase Timestamp | number -> number
export function tsToMs(t: Timestamp | number | undefined): number {
  if (!t) return Date.now();
  if (typeof t === 'number') return t;
  return t.toMillis();
}

// convenience for createdAt serverTimestamp
export const nowServer = () => serverTimestamp();
export {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, where,
};
