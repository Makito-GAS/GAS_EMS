import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import supabase from '../../../supabase-client';
import supabaseAdmin from '../../../supabase-admin';
import { FaPaperPlane, FaUser, FaArrowLeft, FaCheck, FaCheckDouble, FaBell, FaEllipsisV, FaSearch, FaTimes, FaComments } from 'react-icons/fa';
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
  const [isConnected, setIsConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    members: [],
    messages: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Fetch users and subscribe to new messages
  useEffect(() => {
    if (session?.user) {
      fetchUsers();
      fetchUnreadCounts();
      
      // Set up WebSocket connection monitoring
      const connectionChannel = supabase.channel('chat-connection');
      
      connectionChannel
        .on('system', { event: 'disconnected' }, () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
        })
        .on('system', { event: 'connected' }, () => {
          setIsConnected(true);
          console.log('WebSocket reconnected');
          // Refresh data after reconnection
          fetchUsers();
          fetchUnreadCounts();
        })
        .subscribe();

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
        connectionChannel.unsubscribe();
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
      // First, get all unread messages
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', session?.user?.id)
        .eq('is_read', false);

      if (error) throw error;

      // Count messages per sender
      const counts = {};
      data.forEach(({ sender_id }) => {
        counts[sender_id] = (counts[sender_id] || 0) + 1;
      });

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

      // Update messages in smaller batches to avoid URL length issues
      const batchSize = 10;
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        
        // Use direct SQL query through admin client
        const { error: updateError } = await supabaseAdmin
          .from('messages')
          .update({ is_read: true })
          .in('id', batch)
          .eq('receiver_id', session.user.id)
          .select();

        if (updateError) {
          console.error('Error in batch update:', updateError);
          continue;
        }

        // Update local state immediately
        setMessages(prev => 
          prev.map(msg => 
            batch.includes(msg.id) ? { ...msg, is_read: true } : msg
          )
        );

        // Update unread counts for the current user
        if (selectedUser) {
          setUnreadCounts(prev => ({
            ...prev,
            [selectedUser.id]: 0
          }));
        }
      }
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
    try {
      const channel = supabase.channel('messages-channel', {
        config: {
          broadcast: { self: true }
        }
      });

      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${session.user.id}`
        }, (payload) => {
          // Handle new message
          if (payload.new) {
            const newMessage = {
              id: payload.new.id,
              content: payload.new.content,
              created_at: payload.new.created_at,
              is_read: payload.new.is_read,
              sender_id: payload.new.sender_id,
              receiver_id: payload.new.receiver_id
            };
            setMessages(prev => [...prev, newMessage]);
            updateUnreadCount(payload.new.sender_id);
            
            // Play notification sound if enabled
            if (notificationsEnabled) {
              notificationSound.current.play().catch(err => {
                console.error('Error playing notification sound:', err);
              });
            }
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to messages');
          } else if (status === 'CLOSED') {
            console.log('Subscription closed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error occurred');
          }
        });

      return channel;
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      return null;
    }
  };

  const updateUnreadCount = (senderId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [senderId]: (prev[senderId] || 0) + 1
    }));
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

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({ members: [], messages: [] });
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      setShowSearchResults(true);

      // Search members
      const { data: memberResults, error: memberError } = await supabase
        .from('member')
        .select('id, name, email')
        .neq('id', session.user.id)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (memberError) throw memberError;

      // Search messages
      const { data: messageResults, error: messageError } = await supabase
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
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messageError) throw messageError;

      setSearchResults({
        members: memberResults || [],
        messages: messageResults || []
      });
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Failed to search');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ members: [], messages: [] });
    setShowSearchResults(false);
  };

  const handleMemberSelect = (member) => {
    setSelectedUser(member);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleMessageSelect = (message) => {
    const otherUser = message.sender_id === session.user.id ? message.receiver : message.sender;
    setSelectedUser(otherUser);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Format time (e.g., "2:30 PM")
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format date (e.g., "Mar 15")
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    // If message is from today, show "Today"
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${timeStr}`;
    }
    
    // If message is from yesterday, show "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    }
    
    // If message is from this year, show date without year
    if (date.getFullYear() === now.getFullYear()) {
      return `${dateStr} at ${timeStr}`;
    }
    
    // If message is from a different year, show full date
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Users List */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search members and messages..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && searchQuery && (
          <div className="flex-1 overflow-y-auto">
            {/* Member Results */}
            {searchResults.members.length > 0 && (
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">Members</h3>
                {searchResults.members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberSelect(member)}
                    className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                        <FaUser className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{member.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Message Results */}
            {searchResults.messages.length > 0 && (
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">Messages</h3>
                {searchResults.messages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => handleMessageSelect(message)}
                    className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                        <FaComments className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {message.sender_id === session.user.id ? 'You' : message.sender.name}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {searchResults.members.length === 0 && searchResults.messages.length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No results found
              </div>
            )}
          </div>
        )}

        {/* Regular Users List */}
        {!showSearchResults && (
          <div className="flex-1 overflow-y-auto">
            {users.map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                  selectedUser?.id === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                } ${unreadCounts[user.id] > 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all duration-200 ${
                        unreadCounts[user.id] > 0 ? 'ring-red-500' : 'ring-transparent'
                      }`}>
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
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add your menu handler here
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
                            >
                              <FaEllipsisV className="text-gray-500 dark:text-gray-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                messages.map((message, index) => {
                  // Check if we need to show date separator
                  const showDateSeparator = index === 0 || 
                    new Date(message.created_at).toDateString() !== 
                    new Date(messages[index - 1].created_at).toDateString();

                  const messageDate = new Date(message.created_at);
                  const dateStr = messageDate.toLocaleDateString([], { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  return (
                    <React.Fragment key={message.id}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm text-gray-600 dark:text-gray-400">
                            {dateStr}
                          </div>
                        </div>
                      )}
                      <div
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
                              {formatMessageTime(message.created_at)}
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
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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