import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../../supabase-client';

const AuthContext = createContext();

export const createMember = async (email, password, name, role, status) => {
  try {
    const createResult = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          role: role,
          status: status,
        }
      }
    });

    if (createResult.error) {
      throw createResult.error;
    }

    const memberResult = await supabase.from('member').insert({
      email: email,
      name: name,
      id: createResult.data.user.id,
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

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {
     setSession(session);
    })
 
     supabase.auth.onAuthStateChange((_event, session) => {
       setSession(session);

       if (session) {
        fetchUserRole(session.user.id);
      }
     });
   }, []);

   const signIn = async (email, password) => {
    try {
      const {data, error} = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      if (error) {
        setError(error.message);
        return {success: false, error: error.message};
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
          return {success: false, error: "Error fetching user role"};
        }

        setUserRole(roleData.role);
        return {
          success: true, 
          data: data,
          role: roleData.role
        };
      }
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      return {success: false, error: errorMessage};
    }
  }

  const signOut = async () => {
    const {error} = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      console.log("signed out");
    }
  }

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from('permission')
      .select('role')
      .eq('member_id', userId)
      .single();

    if (!error) {
      setUserRole(data.role);
    } else {
      console.error('Error fetching role:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signIn, signOut, createMember, userRole }}>
        {children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => {
  return useContext(AuthContext);
};


   