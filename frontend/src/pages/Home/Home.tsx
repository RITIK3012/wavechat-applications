import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useNavigate } from 'react-router';

export default function Home({ socket }: { socket: Socket }) {
  const [connectionId, setConnectionId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('error_message', (msg) => {
      alert(msg);
      setIsConnecting(false);
    });

    return () => {
      socket.off('error_message');
    };
  }, [socket]);

  const handleConnect = () => {
    if (!connectionId.trim()) {
      alert('Please enter a connection ID');
      return;
    }

    setIsConnecting(true);
    navigate(`/chat/${connectionId.trim()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        width: '300px'
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>Wave Chat</h1>
        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Enter Connection ID:
          </label>
          <input
            type="text"
            placeholder="Enter ID"
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isConnecting}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ display: 'block', marginTop: '5px', color: '#888' }}>
            Share this ID to chat
          </small>
        </div>

        <button
          onClick={handleConnect}
          disabled={!connectionId.trim() || isConnecting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            opacity: (!connectionId.trim() || isConnecting) ? 0.6 : 1
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
