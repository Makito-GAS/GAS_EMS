import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../../supabase-client';
import { FaPaperPlane, FaUser, FaArrowLeft } from 'react-icons/fa';
import { Navigate, useNavigate } from 'react-router-dom';

const Chat = () => {
  const { session } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Fetch users and subscribe to new messages
  useEffect(() => {
    if (session?.user) {
      fetchUsers();
      const subscription = subscribeToMessages();
      subscriptionRef.current = subscription;

      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
        }
      };
    }
  }, [session]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (selectedUser && session?.user) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser, session]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('member')
        .select('id, name, email')
        .neq('id', session.user.id)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchMessages = async (userId) => {
    try {
      if (!session?.user) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          sender_id,
          receiver_id,
          sender:member!messages_sender_id_fkey (
            id,
            name,
            email
          ),
          receiver:member!messages_receiver_id_fkey (
            id,
            name,
            email
          )
        `)
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(
        msg => msg.receiver_id === session.user.id && !msg.is_read
      );
      if (unreadMessages?.length > 0) {
        await markMessagesAsRead(unreadMessages.map(msg => msg.id));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (messageIds) => {
    try {
      if (!session?.user || !messageIds?.length) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('receiver_id', session.user.id);

      if (error) {
        console.error('Error marking messages as read:', error);
        // Don't throw the error, just log it
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't throw the error, just log it
    }
  };

  const subscribeToMessages = () => {
    if (!session?.user) return null;

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${session.user.id}`
      }, payload => {
        if (payload.new) {
          setMessages(prev => [...prev, payload.new]);
          // Only mark as read if it's a new message
          if (!payload.new.is_read) {
            markMessagesAsRead([payload.new.id]);
          }
        }
      })
      .subscribe();

    return subscription;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !session?.user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: session.user.id,
            receiver_id: selectedUser.id,
            content: newMessage.trim()
          }
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Users List */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('messages')}</h2>
        </div>
        <div className="overflow-y-auto h-full">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <FaUser className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                  <FaUser className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === session.user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_id === session.user.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('typeMessage')}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {t('selectUserToChat')}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Chat; 