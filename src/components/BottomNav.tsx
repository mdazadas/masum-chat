import { useNavigate } from 'react-router-dom';
import { MessageSquare, Phone, UserCircle, Settings } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'chats' | 'profile' | 'calls' | 'settings';
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
    const navigate = useNavigate();

    return (
        <nav className="bottom-nav">
            <div
                className={`bottom-nav-item ${activeTab === 'chats' ? 'active' : ''}`}
                onClick={() => navigate('/home')}
                style={{ cursor: 'pointer' }}
            >
                <MessageSquare size={24} />
                <span>Chats</span>
            </div>
            <div
                className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => navigate('/profile/me')}
                style={{ cursor: 'pointer' }}
            >
                <UserCircle size={24} />
                <span>Profile</span>
            </div>
            <div
                className={`bottom-nav-item ${activeTab === 'calls' ? 'active' : ''}`}
                onClick={() => navigate('/calls')}
                style={{ cursor: 'pointer' }}
            >
                <Phone size={24} />
                <span>Calls</span>
            </div>
            <div
                className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => navigate('/settings')}
                style={{ cursor: 'pointer' }}
            >
                <Settings size={24} />
                <span>Settings</span>
            </div>
        </nav>
    );
};

export default BottomNav;
