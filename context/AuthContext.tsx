'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, UserProfile } from '@/types/auth';

interface AuthContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userProfile: UserProfile;
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  selectedHospitalId: string | null;
  setSelectedHospitalId: (id: string | null) => void;
  isBedModalOpen: boolean;
  setIsBedModalOpen: (open: boolean) => void;
}

const defaultProfile: UserProfile = {
  uid: 'demo-user-1',
  email: 'dispatcher@arcresponder.net',
  role: 'DISPATCHER',
  assignedHospitalId: 'HOSP-1'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('DISPATCHER');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>('HOSP-1');
  const [isBedModalOpen, setIsBedModalOpen] = useState<boolean>(false);

  const userProfile: UserProfile = {
    ...defaultProfile,
    role: userRole
  };

  return (
    <AuthContext.Provider
      value={{
        userRole,
        setUserRole,
        userProfile,
        selectedVehicleId,
        setSelectedVehicleId,
        selectedHospitalId,
        setSelectedHospitalId,
        isBedModalOpen,
        setIsBedModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
