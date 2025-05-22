import React from 'react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link , useNavigate} from 'react-router-dom'

const CreateUser = () => {

    const [email, setEmail] = useState('');//just string
    const [password, setPassword] = useState('');//just string
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const { session, signUpNewUser } = useAuth();//get the session and signUpNewUser from the AuthContext
   console.log(session);
    console.log(email, password);

    const handleSignUp = async (e) => {
      e.preventDefault();
      setLoading(true);
        try{
          const result = await signUpNewUser(email, password);
          if(result.success){
            navigate('/admin');
          }
        }catch(error){
          setError("Error creating user");
        }finally{
          setLoading(false);
        }

    
      
    }

  return (
    <div>

        <form className='max-w-md m-auto pt24' onSubmit={handleSignUp}>
           
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
             >Creates in User
             </button>
             {error && <p className='text-red-500 text-center mt-4'>{error}</p>} {/*if there is an error, show the error*/}
          </div>
           
        </form>
        

    </div>
  )
}

export default CreateUser