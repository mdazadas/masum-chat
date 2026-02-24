import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Edit2, Mail, User, Calendar, Loader2, Trash2, Upload, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { insforge, BUCKETS } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import BottomNav from '../components/BottomNav';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import BlurImage from '../components/BlurImage';

const MyProfile = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const { profileData: globalProfile, setProfileData, refreshProfile } = useData();
    const [editingField, setEditingField] = useState<'name' | 'about' | null>(null);
    const [showPhotoSheet, setShowPhotoSheet] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const [tempName, setTempName] = useState(globalProfile?.name || '');
    const [tempAbout, setTempAbout] = useState(globalProfile?.bio || '');

    // Sync temp states when global data arrives or changes
    useEffect(() => {
        if (globalProfile) {
            if (!editingField || editingField !== 'name') setTempName(globalProfile.name || '');
            if (!editingField || editingField !== 'about') setTempAbout(globalProfile.bio || '');
        }
    }, [globalProfile, editingField]);

    useEffect(() => {
        if (!userId || globalProfile) return;
        refreshProfile();
    }, [userId, globalProfile, refreshProfile]);

    const handleSaveName = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { error: authError } = await insforge.auth.setProfile({ name: tempName });
            if (authError) throw authError;

            const { error: dbError } = await insforge.database
                .from('profiles')
                .update({ name: tempName })
                .eq('id', userId);

            if (dbError) throw dbError;

            await refreshProfile();
            showToast('Name updated successfully', 'success');
            setEditingField(null);
        } catch (err) {
            showToast('Failed to update name', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAbout = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { error } = await insforge.database
                .from('profiles')
                .update({ bio: tempAbout })
                .eq('id', userId);

            if (error) throw error;

            await refreshProfile();
            showToast('Bio updated successfully', 'success');
            setEditingField(null);
        } catch (err) {
            showToast('Failed to update bio', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && userId) {
            setShowPhotoSheet(false);
            setLoading(true);
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                const { data, error } = await insforge.storage
                    .from(BUCKETS.avatars)
                    .upload(filePath, file);

                if (error) throw error;
                if (!data?.url) throw new Error('Upload failed');

                const avatarUrl = data.url;
                await insforge.auth.setProfile({ avatar_url: avatarUrl });
                await insforge.database
                    .from('profiles')
                    .update({ avatar_url: avatarUrl })
                    .eq('id', userId);

                await refreshProfile();
                showToast('Profile photo updated', 'success');
            } catch (err) {
                showToast('Failed to upload photo', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleRemovePhoto = async () => {
        if (!userId) return;
        setShowRemoveConfirm(false);
        setShowPhotoSheet(false);
        // Optimistic update — update UI instantly before DB call
        if (globalProfile) {
            setProfileData({ ...globalProfile, avatar_url: null });
        }
        setLoading(true);
        try {
            // Only update DB (skip auth.setProfile which hangs on null)
            const { error } = await insforge.database
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', userId);
            if (error) throw error;
            await refreshProfile();
            showToast('Profile photo removed', 'info');
        } catch (err) {
            showToast('Failed to remove photo', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Get email from profiles table (globalProfile.email)
    const userEmail = globalProfile?.email || '';

    // Loading state
    if (!globalProfile && userId) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--surface-color)', gap: '16px' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-container" style={{ position: 'relative' }}>
            {loading && <LoadingOverlay message="Saving..." transparent />}

            {/* Header Nav */}
            <div className="profile-nav">
                <button className="nav-icon-btn" onClick={() => navigate('/home')}>
                    <ArrowLeft size={24} />
                </button>
                <h3>Profile</h3>
            </div>

            <div className="profile-content">
                {/* Profile Header */}
                <div className="profile-header">
                    <div
                        className="profile-avatar-container"
                        onClick={() => setShowPhotoSheet(true)}
                        style={{ position: 'relative', borderRadius: '50%', cursor: 'pointer' }}
                    >
                        <Avatar
                            src={globalProfile?.avatar_url}
                            name={globalProfile?.name || userEmail || 'User'}
                            size={160}
                            style={{ border: '3px solid var(--border-color)', flexShrink: 0 }}
                        />
                        <div className="avatar-change-overlay">
                            {loading ? <Loader2 className="animate-spin" size={22} /> : <Camera size={22} />}
                        </div>
                        <input
                            type="file"
                            id="profile-upload"
                            hidden
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                    </div>
                    <div className="profile-main-info">
                        <h2>{globalProfile?.name}</h2>
                        <p>@{globalProfile?.username}</p>
                    </div>
                </div>

                {/* Editable Sections */}
                <div className="profile-section">
                    <div className="profile-row">
                        <div className="profile-row-label">Full Name</div>
                        {editingField === 'name' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    style={{ margin: 0, padding: '10px 14px' }}
                                    autoFocus
                                    disabled={loading}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button className="profile-save-btn" onClick={handleSaveName} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button className="profile-cancel-btn" onClick={() => { setTempName(globalProfile?.name || ''); setEditingField(null); }} disabled={loading}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="profile-row-value">{globalProfile?.name}</div>
                                <div className="profile-row-subtext">This is your display name.</div>
                                <button
                                    className="profile-edit-btn"
                                    onClick={() => setEditingField('name')}
                                    disabled={editingField !== null}
                                    style={{ opacity: editingField !== null ? 0.3 : 1 }}
                                >
                                    <Edit2 size={18} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="profile-row">
                        <div className="profile-row-label">About</div>
                        {editingField === 'about' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                <textarea
                                    className="input-field"
                                    value={tempAbout}
                                    onChange={(e) => setTempAbout(e.target.value)}
                                    style={{ margin: 0, padding: '10px 14px', minHeight: '80px', width: '100%', resize: 'none' }}
                                    autoFocus
                                    disabled={loading}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button className="profile-save-btn" onClick={handleSaveAbout} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button className="profile-cancel-btn" onClick={() => { setTempAbout(globalProfile?.bio || ''); setEditingField(null); }} disabled={loading}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="profile-row-value">{globalProfile?.bio || 'Hey there! I am using Masum Chat.'}</div>
                                <button
                                    className="profile-edit-btn"
                                    onClick={() => setEditingField('about')}
                                    disabled={editingField !== null}
                                    style={{ opacity: editingField !== null ? 0.3 : 1 }}
                                >
                                    <Edit2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Read-only Sections */}
                <div className="profile-section">
                    <div className="profile-row">
                        <div className="profile-row-label">Username</div>
                        <div className="profile-row-value" style={{ color: 'var(--text-secondary)' }}>@{globalProfile?.username}</div>
                        <div className="profile-row-subtext">Username cannot be changed.</div>
                        <User size={18} style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    </div>

                    <div className="profile-row">
                        <div className="profile-row-label">Email ID</div>
                        <div className="profile-row-value" style={{ color: 'var(--text-secondary)' }}>
                            {userEmail || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Not available</span>}
                        </div>
                        <Mail size={18} style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    </div>

                    <div className="profile-row">
                        <div className="profile-row-label">Account Created</div>
                        <div className="profile-row-value" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(globalProfile?.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <Calendar size={18} style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    </div>
                </div>

                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/settings')}
                        className="btn btn-outline"
                        style={{
                            color: 'var(--primary-color)',
                            borderColor: 'var(--border-color)',
                            background: 'var(--surface-color)',
                            padding: '12px',
                            fontWeight: 600
                        }}
                    >
                        Account Settings
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>Created with ❤️ by MD Azad</p>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav activeTab="profile" />

            {/* ─── Photo Action Sheet ─── */}
            {showPhotoSheet && (
                <div
                    className="overlay-backdrop"
                    onClick={() => setShowPhotoSheet(false)}
                    style={{ zIndex: 9999 }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'var(--surface-color)',
                            borderRadius: '20px 20px 0 0',
                            padding: '12px 0 32px',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
                            zIndex: 10000
                        }}
                    >
                        {/* Handle bar */}
                        <div style={{
                            width: '40px', height: '4px', borderRadius: '2px',
                            background: 'var(--border-color)', margin: '0 auto 20px auto'
                        }} />

                        {/* Preview Avatar */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <Avatar
                                src={globalProfile?.avatar_url}
                                name={globalProfile?.name || 'User'}
                                size={88}
                                style={{ border: '3px solid var(--primary-color)', flexShrink: 0 }}
                            />
                        </div>

                        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {globalProfile?.name}
                        </p>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            @{globalProfile?.username}
                        </p>

                        <div style={{ borderTop: '1px solid var(--border-color)' }}>
                            {/* View Photo — only if photo exists */}
                            {globalProfile?.avatar_url && (
                                <button
                                    onClick={() => { setShowPhotoSheet(false); setShowPhotoModal(true); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                                        padding: '16px 24px', background: 'none', border: 'none',
                                        color: 'var(--text-primary)', fontSize: '16px', cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                >
                                    <Eye size={20} color="var(--primary-color)" />
                                    View Photo
                                </button>
                            )}

                            {/* Upload / Change Photo */}
                            <button
                                onClick={() => document.getElementById('profile-upload')?.click()}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px 24px', background: 'none', border: 'none',
                                    color: 'var(--text-primary)', fontSize: '16px', cursor: 'pointer',
                                    borderBottom: globalProfile?.avatar_url ? '1px solid var(--border-color)' : 'none'
                                }}
                            >
                                <Upload size={20} color="var(--primary-color)" />
                                {globalProfile?.avatar_url ? 'Change Photo' : 'Upload Photo'}
                            </button>

                            {/* Remove Photo — only if photo exists */}
                            {globalProfile?.avatar_url && (
                                <button
                                    onClick={() => { setShowPhotoSheet(false); setShowRemoveConfirm(true); }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                                        padding: '16px 24px', background: 'none', border: 'none',
                                        color: '#dc3545', fontSize: '16px', cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={20} color="#dc3545" />
                                    Remove Photo
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Remove Photo Confirmation ─── */}
            {showRemoveConfirm && (
                <div className="overlay-backdrop" style={{ zIndex: 9999 }}>
                    <div className="context-menu-card" style={{ padding: '24px', width: '85%', maxWidth: '340px', backgroundColor: 'var(--surface-color)' }}>
                        <h3 style={{ marginBottom: '12px' }}>Remove Photo?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                            Your profile photo will be removed. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-outline"
                                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}
                                onClick={() => setShowRemoveConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#ffffff' }}
                                onClick={handleRemovePhoto}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Fullscreen Photo Viewer ─── */}
            {showPhotoModal && globalProfile?.avatar_url && (
                <div className="chat-camera-overlay" style={{ background: 'rgba(0,0,0,0.95)', justifyContent: 'center', zIndex: 10000 }}>
                    <button
                        className="nav-icon-btn"
                        onClick={() => setShowPhotoModal(false)}
                        style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <img
                        src={globalProfile?.avatar_url}
                        alt="Profile"
                        style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                    />
                </div>
            )}
        </div>
    );
};

export default MyProfile;
