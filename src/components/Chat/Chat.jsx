import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../../supabase-client';
import { FaPaperPlane, FaUser, FaArrowLeft, FaCheck, FaCheckDouble, FaBell, FaEllipsisV } from 'react-icons/fa';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const notificationSound = useRef(new Audio('/notification.mp3'));

  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Fetch users and subscribe to new messages
  useEffect(() => {
    if (session?.user) {
      fetchUsers();
      fetchUnreadCounts();
      const subscription = subscribeToMessages();
      subscriptionRef.current = subscription;

      // Check if notifications are enabled in settings
      const savedNotificationSetting = localStorage.getItem('notifications');
      if (savedNotificationSetting !== null) {
        setNotificationsEnabled(savedNotificationSetting === 'true');
      }

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

  const fetchUnreadCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, count')
        .eq('receiver_id', session?.user?.id)
        .eq('is_read', false)
        .group('sender_id');

      if (error) throw error;

      const counts = data.reduce((acc, { sender_id, count }) => {
        acc[sender_id] = parseInt(count);
        return acc;
      }, {});

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

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
        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [userId]: 0
        }));
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

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Play notification sound and show toast for new messages
  const handleNewMessage = (message) => {
    if (notificationsEnabled) {
      // Play sound
      notificationSound.current.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });

      // Show toast notification
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3">
          <FaBell className="text-blue-500" />
          <div>
            <p className="font-medium text-gray-800 dark:text-white">New Message</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{message.content}</p>
          </div>
        </div>
      ), {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const subscribeToMessages = () => {
    if (!session?.user) return null;

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${session.user.id},receiver_id.eq.${selectedUser?.id}),and(sender_id.eq.${selectedUser?.id},receiver_id.eq.${session.user.id}))`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
          // Update unread counts for new messages
          if (payload.new.receiver_id === session.user.id) {
            setUnreadCounts(prev => ({
              ...prev,
              [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
            }));
            markMessagesAsRead([payload.new.id]);
            handleNewMessage(payload.new);
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? payload.new : msg
          ));
        }
      })
      .subscribe();

    return subscription;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !session?.user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: session.user.id,
            receiver_id: selectedUser.id,
            content: newMessage.trim(),
            is_read: false
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      // Update local state with the new message
      if (data) {
        setMessages(prev => [...prev, data]);
      }
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('messages')}</h2>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-full transition-colors ${
              notificationsEnabled 
                ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <FaBell />
          </button>
        </div>
        <div className="overflow-y-auto h-full">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
              } ${unreadCounts[user.id] > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all duration-200"
                      style={{
                        ringColor: unreadCounts[user.id] > 0 ? 'rgb(59 130 246)' : 'transparent'
                      }}>
                      <FaUser className="text-blue-600 dark:text-blue-400" />
                    </div>
                    {unreadCounts[user.id] > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-white text-xs font-bold">
                          {unreadCounts[user.id] > 99 ? '99+' : unreadCounts[user.id]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium truncate ${
                        unreadCounts[user.id] > 0 
                          ? 'text-gray-900 dark:text-white font-semibold' 
                          : 'text-gray-800 dark:text-white'
                      }`}>
                        {user.name}
                      </p>
                      {unreadCounts[user.id] > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        unreadCounts[user.id] > 0 
                          ? 'text-gray-700 dark:text-gray-200' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {user.email}
                      </p>
                      {unreadCounts[user.id] > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add your menu handler here
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <FaEllipsisV className="text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500">
                    <FaUser className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedUser.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`p-2 rounded-full transition-colors ${
                      notificationsEnabled 
                        ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <FaBell />
                  </button>
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
                      className={`max-w-[70%] rounded-lg p-3 shadow-sm transition-all duration-200 ${
                        message.sender_id === session.user.id
                          ? 'bg-blue-600 text-white'
                          : message.is_read 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                            : 'bg-blue-100 dark:bg-blue-900 text-gray-800 dark:text-white ring-2 ring-blue-500/20'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                        {message.sender_id === session.user.id && (
                          <span className="text-xs">
                            {message.is_read ? (
                              <FaCheckDouble className="text-blue-300" />
                            ) : (
                              <FaCheck className="text-gray-300" />
                            )}
                          </span>
                        )}
                      </div>
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