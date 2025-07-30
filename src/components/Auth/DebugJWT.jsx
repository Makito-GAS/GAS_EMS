import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../context/AuthContext';

const DebugJWT = () => {
  const { session } = useAuth();
  const [decoded, setDecoded] = useState(null);

  useEffect(() => {
    if (session && session.access_token) {
      try {
        const decodedToken = jwtDecode(session.access_token);
        setDecoded(decodedToken);
      } catch (err) {
        setDecoded({ error: 'Failed to decode JWT', details: err.toString() });
      }
    } else {
      setDecoded(null);
    }
  }, [session]);

  return (
    <div style={{ background: '#f8f8f8', padding: 16, borderRadius: 8, margin: 16 }}>
      <h3>Decoded JWT</h3>
      {decoded ? (
        <pre style={{ fontSize: 14, overflowX: 'auto' }}>{JSON.stringify(decoded, null, 2)}</pre>
      ) : (
        <p>No JWT found. Are you logged in?</p>
      )}
      <div style={{ marginTop: 8, color: '#444' }}>
        <strong>user_role:</strong> {decoded && decoded.user_role ? decoded.user_role : 'Not present'}
      </div>
    </div>
  );
};

export default DebugJWT;
