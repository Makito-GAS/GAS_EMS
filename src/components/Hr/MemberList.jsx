import React, { useEffect, useState } from 'react';
import supabase from '../../../supabase-client';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('member')
        .select(`
          id, name, email, department, created_at,
          permission:permission(role, status)
        `)
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setMembers([]);
      } else {
        // Flatten permission
        const mapped = (data || []).map(m => ({
          ...m,
          role: m.permission?.[0]?.role || 'employee',
          status: m.permission?.[0]?.status || 'active',
        }));
        setMembers(mapped);
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return (
    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
      <span className="font-medium">Error!</span> {error}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-2">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-gray-700">List of Member</span>
        <div className="flex gap-2">
          <button className="text-xs text-gray-400 border rounded px-2 py-1">Sort</button>
          <button className="text-xs text-gray-400 border rounded px-2 py-1">Filter</button>
          <button className="text-xs text-gray-400">See All</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">EMPLOYEE NAME</th>
              <th className="py-2">EMAIL</th>
              <th className="py-2">TYPE</th>
              <th className="py-2">DEPARTMENT</th>
              <th className="py-2">STATUS</th>
              <th className="py-2">JOINED</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.id || i} className="border-b last:border-0">
                <td className="flex items-center gap-2 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                    {m.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">{m.name}</div>
                  </div>
                </td>
                <td>{m.email}</td>
                <td>{m.role}</td>
                <td><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{m.department}</span></td>
                <td><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{m.status}</span></td>
                <td><span className="text-xs text-gray-400">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '-'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberList; 