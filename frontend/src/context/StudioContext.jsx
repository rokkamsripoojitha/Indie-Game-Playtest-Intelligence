import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setStudioHeaderId } from '../services/api';
import { useAuth } from './AuthContext';

const StudioContext = createContext(null);

export const StudioProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [studios, setStudios] = useState([]);
  const [activeStudio, setActiveStudioState] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const setActiveStudio = (studio) => {
    setActiveStudioState(studio);
    if (studio?._id) {
      setStudioHeaderId(studio._id);
      localStorage.setItem('active_studio_id', studio._id);
    } else {
      setStudioHeaderId(null);
      localStorage.removeItem('active_studio_id');
    }
  };

  const loadStudios = async () => {
    if (!isLoggedIn) {
      setStudios([]);
      setActiveStudio(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.getMyStudios();
      const studioList = res.studios || [];
      setStudios(studioList);

      const savedId = localStorage.getItem('active_studio_id');
      const found = studioList.find(s => s._id === savedId) || studioList[0] || null;
      setActiveStudio(found);
    } catch (err) {
      console.warn('Error loading user studios:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBuilds = async () => {
    if (!activeStudio?._id) {
      setBuilds([]);
      return;
    }
    try {
      const res = await api.listBuilds(activeStudio._id);
      setBuilds(res.builds || []);
    } catch (err) {
      console.warn('Error loading builds:', err);
    }
  };

  const loadSessions = async () => {
    if (!activeStudio?._id) {
      setSessions([]);
      return;
    }
    try {
      const res = await api.listSessions(activeStudio._id);
      setSessions(res.sessions || []);
    } catch (err) {
      console.warn('Error loading sessions:', err);
    }
  };

  useEffect(() => {
    loadStudios();
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeStudio?._id) {
      loadBuilds();
      loadSessions();
    } else {
      setBuilds([]);
      setSessions([]);
    }
  }, [activeStudio?._id]);

  const userRole = activeStudio?.myRole || 'tester';

  const value = {
    studios,
    activeStudio,
    setActiveStudio,
    userRole,
    isDeveloper: userRole === 'developer',
    isStudioAdmin: userRole === 'studio_admin',
    isTester: userRole === 'tester',
    builds,
    sessions,
    loading,
    refreshStudios: loadStudios,
    refreshBuilds: loadBuilds,
    refreshSessions: loadSessions
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
