import React from 'react'

const AccountToggle = () => {
  return (
    <div
    className='bordr-b mb-4 mt-2 pb-4 border-stone-300'
    >AccountToggle
    <button
     className='flex p-0.5 hover:bg-stone-200 rounded transition-colors relative gap-2 w-full items-center'>
     {/* user image 
        <img 
            src={session?.user?.image}
            alt='user-image'
            className='w-6 h-6 rounded-full'
        />
        <p className='text-white'>{session?.user?.name}</p>
     */}
     <p>userdetails</p>
    </button>


    </div>
  )
}

export default AccountToggle