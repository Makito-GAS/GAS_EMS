import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../../supabase-client';
import supabaseAdmin from '../../supabase-admin';

const AuthContext = createContext();

export const createMember = async (email, password, name, role, status, gender, department) => {
  try {
    // Use admin client to create user without affecting current session
    const createResult = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: role,
        status: status,
      }
    });

    if (createResult.error) {
      throw createResult.error;
    }

    const memberResult = await supabase.from('member').insert({
      email: email,
      name: name,
      id: createResult.data.user.id,
      gender: gender,
      department: department
    });

    if (memberResult.error) {
      throw memberResult.error;
    }

    const permissionResult = await supabase.from('permission').insert({
      role: role,
      member_id: createResult.data.user.id,
      status: status,
    });

    if (permissionResult.error) {
      throw permissionResult.error;
    }

    return { success: true, data: createResult.data };
  } catch (error) {
    console.error('Error creating member:', error);
    return { success: false, error: error.message };
  }
} 

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null); 
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const signUpNewUser = async (email, password) => {
    try {
      const {data, error} = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError("failed to create user");
        return {success: false, error: error};
      } else {
        setError(null);
        return {success: true, data: data};
      }
    } catch (err) {
      setError("failed to create user");
      return {success: false, error: err};
    }
  }

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('permission')
        .select('role')
        .eq('member_id', userId)
        .single();

      if (!error && data) {
        setUserRole(data.role);
        // Store role in localStorage for persistence
        localStorage.setItem('userRole', data.role);
      } else {
        console.error('Error fetching role:', error);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Try to get role from localStorage first
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
        }
        // Then fetch fresh role from database
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Try to get role from localStorage first
        const storedRole = localStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
        }
        // Then fetch fresh role from database
        fetchUserRole(session.user.id);
      } else {
        // Clear role when logged out
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      } else {
        setError(null);
        // Fetch user role after successful login
        const { data: roleData, error: roleError } = await supabase
          .from('permission')
          .select('role')
          .eq('member_id', data.user.id)
          .single();

        if (roleError) {
          console.error('Error fetching role:', roleError);
          return { success: false, error: "Error fetching user role" };
        }

        setUserRole(roleData.role);
        localStorage.setItem('userRole', roleData.role);
        
        return {
          success: true,
          data: data,
          role: roleData.role
        };
      }
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setUserRole(null);
      localStorage.removeItem('userRole');
      console.log("signed out");
    }
  };

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signIn, signOut, createMember, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};


   