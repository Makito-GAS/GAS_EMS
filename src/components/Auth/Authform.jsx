import React from 'react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link , useNavigate} from 'react-router-dom'
import AnimatedLogo from '../Sidebar/AnimatedLogo'

const Authform = () => {

    const [email, setEmail] = useState('');//just string
    const [password, setPassword] = useState('');//just string
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    

    const { session, signIn } = useAuth();//get the session and signin fuction from the AuthContext
    console.log(session);
    console.log(email, password);

    const handleSignIn = async (e) => {
      e.preventDefault();
      setError(null); // Clear any previous errors
      
      // Basic validation
      if (!email || !password) {
        setError("Please enter both email and password");
        return;
      }

      setLoading(true);
      try {
        const result = await signIn(email, password);
        if (result.success) {
          // Navigate based on role
          if (result.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (result.role === 'employee') {
            navigate('/');
          } else {
            setError("Invalid user role");
          }
        } else {
          setError(result.error || "Invalid email or password");
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }

  return (
    <div className='mx-auto min-h-screen  bg-gray-900 text-white'>

      

        <form className='max-w-md m-auto pt24' onSubmit={handleSignIn}>
        <AnimatedLogo/> 
          <div className='flex flex-col py-4'>
          <input
           type="email" 
           placeholder="Email"
          className='p-3 mt-6'
           onChange={(e)=>setEmail(e.target.value)}
          />
          <input 
          type="password"
           placeholder="Password"
            className='p-3 mt-6'
            onChange={(e)=>setPassword(e.target.value)}
            />
             <button 
            type="submit" 
            disabled={loading}
             className='mt-6 w-full bg-blue-500 text-white p-3 rounded-md'
             > log in 
             </button>
             {error && <p className='text-red-500 text-center mt-4'>{error}</p>} {/*if there is an error, show the error*/}
             <p className='text-center mt-4'>forgot password?</p>
          </div>
           
        </form>
        

    </div>
  )
}

export default Authform