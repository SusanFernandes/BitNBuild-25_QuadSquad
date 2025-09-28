import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface UserFinancialProfile {
  annual_income?: number;
  age?: number;
  city?: string;
  current_investments?: {
    "80C"?: number;
    "80D"?: number;
    "80G"?: number;
    "24b"?: number;
  };
  cibil_score?: number;
  credit_utilization?: number;
  home_loan_emi?: number;
  outstanding_loan?: number;
  risk_profile?: 'conservative' | 'moderate' | 'aggressive';
  dependents?: number;
  nri_status?: boolean;
  is_onboarded?: boolean;
}

interface UserContextType {
  user: User | null;
  financialProfile: UserFinancialProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateFinancialProfile: (profile: Partial<UserFinancialProfile>) => Promise<void>;
  completeOnboarding: (profile: UserFinancialProfile) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [financialProfile, setFinancialProfile] = useState<UserFinancialProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      const storedProfile = await AsyncStorage.getItem('userFinancialProfile');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      if (storedProfile) {
        setFinancialProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('userFinancialProfile');
      setUser(null);
      setFinancialProfile(null);
    } catch (error) {
      console.error('Error logging out user:', error);
      throw error;
    }
  };

  const updateFinancialProfile = async (profile: Partial<UserFinancialProfile>) => {
    try {
      const updatedProfile = { ...financialProfile, ...profile };
      await AsyncStorage.setItem('userFinancialProfile', JSON.stringify(updatedProfile));
      setFinancialProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating financial profile:', error);
      throw error;
    }
  };

  const completeOnboarding = async (profile: UserFinancialProfile) => {
    try {
      const completeProfile = { ...profile, is_onboarded: true };
      await AsyncStorage.setItem('userFinancialProfile', JSON.stringify(completeProfile));
      setFinancialProfile(completeProfile);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const createUser = async (userData: any) => {
    try {
      setIsLoading(true);
      
      const newUser: User = {
        id: '21412414',
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      };
      
      await login(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserContextType = {
    user,
    financialProfile,
    isLoading,
    isAuthenticated: !!user,
    isOnboarded: financialProfile?.is_onboarded || false,
    login,
    logout,
    updateFinancialProfile,
    completeOnboarding,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
