import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router';

interface Message {
  message: string;
  senderId: string;
}

export default function Chat({ socket }: { socket: Socket }) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mySocketId, setMySocketId] = useState('');
  const [isPartnerConnected, setIsPartnerConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    const handleConnect = () => {
      console.log('Connected to socket:', socket.id);
      setMySocketId(socket.id || '');
      socket.emit('join_chat', userId);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
      socket.on('connect', handleConnect);
    }

    socket.on('chat_start', () => {
      setIsPartnerConnected(true);
      alert('Partner connected! You can start chatting.');
    });

    socket.on('chat_end', () => {
      alert('Partner disconnected. Chat ended.');
      setIsPartnerConnected(false);
    });

    socket.on('receive_message', (data: { message: string, senderId: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          message: data.message,
          senderId: data.senderId,
          
        }
      ]);
    });

    socket.on('error_message', (msg: string) => {
      alert(msg);
      navigate('/');
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('chat_start');
      socket.off('chat_end');
      socket.off('receive_message');
      socket.off('error_message');

      socket.disconnect();
    };
  }, [socket, userId, navigate]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      return;
    }

    const myMsg: Message = {
      message: inputMessage.trim(),
      senderId: socket.id || 'me',
     
    };

    setMessages((prev) => [...prev, myMsg]);

    socket.emit('send_message', {
      connectionId: userId,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveChat = () => {
    navigate('/');
  };

  return (
    <div>
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <button onClick={handleLeaveChat}>Back</button>
        <h3>Wave Chat</h3>
        <p>Room: {userId}</p>
        <p>Status: {isPartnerConnected ? 'Connected' : 'Waiting...'}</p>
      </div>

      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {messages.map((msg, index) => {
              const checkSender = msg.senderId === (mySocketId || 'me');
              return (
                <li key={index} style={{ textAlign: checkSender ? 'right' : 'left', marginBottom: '10px' }}>
                  <strong>{checkSender ? 'Me' : 'Partner'}: </strong>
                  <span>{msg.message}</span>
                  <br />
                </li>
              );
            })}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div>
        <input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!isPartnerConnected}
          style={{ width: '80%', marginRight: '10px' }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || !isPartnerConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
}
