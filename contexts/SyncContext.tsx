import React, { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useUser, useUI } from '../lib/state';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { name, info, topic, format, memory, setName, setInfo, setTopic, setFormat, setMemory } = useUser();
  const { documentContent, setDocumentContent, transcript, setTranscript } = useUI();
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!user) {
      isInitialLoadRef.current = true;
      return;
    }

    const loadUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.displayName && !name) setName(data.displayName);
          if (data.info) setInfo(data.info);
          if (data.topic) setTopic(data.topic);
          if (data.format) setFormat(data.format);
          if (data.memory) setMemory(data.memory);
          if (data.documentContent) setDocumentContent(data.documentContent);
          if (data.transcript) setTranscript(data.transcript);
        } else {
          // Create the user document if it doesn't exist
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: 'user',
            createdAt: serverTimestamp(),
          });
          if (user.displayName) setName(user.displayName);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        isInitialLoadRef.current = false;
      }
    };

    loadUserData();
  }, [user, setName, setInfo, setTopic, setFormat, setMemory, setDocumentContent, setTranscript]);

  useEffect(() => {
    if (!user || isInitialLoadRef.current) return;

    const saveUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          displayName: name,
          info,
          topic,
          format,
          memory,
          documentContent,
          transcript,
        });
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    };

    const timeoutId = setTimeout(saveUserData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [user, name, info, topic, format, memory, documentContent, transcript]);

  return <>{children}</>;
};
