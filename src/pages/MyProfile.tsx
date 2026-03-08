import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Edit2, X, Check, User, Mail, Camera, Eye, Upload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import BottomNav from '../components/BottomNav';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';
import Avatar from '../components/Avatar';
import FloatingActionSheet from '../components/FloatingActionSheet';

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
        if (!userId || !tempName.trim()) return;

        const oldName = globalProfile?.name;
        // Optimistic update
        if (globalProfile) setProfileData({ ...globalProfile, name: tempName.trim() });

        setLoading(true);
        try {
            await Promise.all([
                insforge.auth.setProfile({ name: tempName.trim() }),
                insforge.database
                    .from('profiles')
                    .update({ name: tempName.trim() })
                    .eq('id', userId)
            ]);

            // Broadcast real-time update
            insforge.realtime.publish('presence:global', 'UPDATE_profile', {
                id: userId,
                name: tempName.trim()
            }).catch(() => { });

            await refreshProfile();
            showToast('Name updated successfully', 'success');
            setEditingField(null);
        } catch (err) {
            console.error('Update name error:', err);
            showToast('Failed to update name', 'error');
            if (globalProfile) setProfileData({ ...globalProfile, name: oldName });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAbout = async () => {
        if (!userId) return;

        const oldBio = globalProfile?.bio;
        // Optimistic update
        if (globalProfile) setProfileData({ ...globalProfile, bio: tempAbout.trim() });

        setLoading(true);
        try {
            await Promise.all([
                insforge.auth.setProfile({ bio: tempAbout.trim() }),
                insforge.database
                    .from('profiles')
                    .update({ bio: tempAbout.trim() })
                    .eq('id', userId)
            ]);

            // Broadcast real-time update
            insforge.realtime.publish('presence:global', 'UPDATE_profile', {
                id: userId,
                bio: tempAbout.trim()
            }).catch(() => { });

            await refreshProfile();
            showToast('Bio updated successfully', 'success');
            setEditingField(null);
        } catch (err) {
            console.error('Update bio error:', err);
            showToast('Failed to update bio', 'error');
            if (globalProfile) setProfileData({ ...globalProfile, bio: oldBio });
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
                const filePath = `${userId}/avatar-${Date.now()}`;
                const { data: uploadData, error: uploadErr } = await insforge.storage
                    .from('avatars')
                    .upload(filePath, file);

                if (uploadErr || !uploadData) throw uploadErr || new Error('Upload failed');
                const avatarUrl = uploadData.url;

                // Sync with both Database and Auth
                await Promise.all([
                    insforge.database.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId),
                    insforge.auth.setProfile({ avatar_url: avatarUrl })
                ]);

                // Broadcast real-time update
                insforge.realtime.publish('presence:global', 'UPDATE_profile', {
                    id: userId,
                    avatar_url: avatarUrl
                }).catch(() => { });

                await refreshProfile();
                showToast('Profile photo updated', 'success');
            } catch (err) {
                console.error('Upload avatar error:', err);
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

        const oldAvatar = globalProfile?.avatar_url;
        // Optimistic update
        if (globalProfile) {
            setProfileData({ ...globalProfile, avatar_url: null });
        }

        setLoading(true);
        try {
            await Promise.all([
                insforge.database.from('profiles').update({ avatar_url: null }).eq('id', userId),
                insforge.auth.setProfile({ avatar_url: null })
            ]);

            // Broadcast real-time update
            insforge.realtime.publish('presence:global', 'UPDATE_profile', {
                id: userId,
                avatar_url: null
            }).catch(() => { });

            await refreshProfile();
            showToast('Profile photo removed', 'info');
        } catch (err) {
            console.error('handleRemovePhoto error:', err);
            showToast('Failed to remove photo', 'error');
            if (globalProfile) {
                setProfileData({ ...globalProfile, avatar_url: oldAvatar });
            }
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
        <div className="profile-container w-full h-[100dvh] bg-surface-color flex flex-col relative overflow-hidden text-text-primary">
            {loading && <LoadingOverlay message="Syncing..." transparent />}

            {/* Glass Header */}
            <div className="profile-nav glass-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%', gap: '16px', padding: '0 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--primary-dark)' }}>Profile</h3>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-hero-section">
                    <div
                        className="profile-avatar-wrapper"
                        onClick={() => setShowPhotoSheet(true)}
                    >
                        <div className="avatar-ring" />
                        <Avatar
                            src={globalProfile?.avatar_url}
                            name={globalProfile?.name || globalProfile?.username || 'User'}
                            size={140}
                        />
                        <div className="avatar-edit-badge">
                            <Camera size={20} />
                        </div>
                    </div>
                    <div className="profile-hero-text">
                        <h2>{globalProfile?.name}</h2>
                        <p className="username-badge">@{globalProfile?.username}</p>
                    </div>
                </div>

                {/* Editable Sections */}
                <div className="profile-section-title">Public Info</div>

                <div className="premium-field-card">
                    <div className="field-header">
                        <div className="field-label-wrapper">
                            <User size={16} className="field-icon primary" />
                            <span className="field-label">Full Name</span>
                        </div>
                        {editingField !== 'name' && (
                            <button className="field-edit-btn" onClick={() => setEditingField('name')}>
                                <Edit2 size={16} />
                            </button>
                        )}
                    </div>
                    {editingField === 'name' ? (
                        <div className="field-edit-area">
                            <input
                                type="text"
                                className="premium-input"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                autoFocus
                                disabled={loading}
                                placeholder="Enter your name"
                            />
                            <div className="field-actions">
                                <button className="action-circle-btn cancel" onClick={() => setEditingField(null)} disabled={loading}>
                                    <X size={18} />
                                </button>
                                <button className="action-circle-btn save" onClick={handleSaveName} disabled={loading || !tempName.trim()}>
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="field-read-area">
                            <span className="field-value main-text">{globalProfile?.name}</span>
                            <span className="field-hint">This name is visible to your contacts.</span>
                        </div>
                    )}
                </div>

                <div className="premium-field-card">
                    <div className="field-header">
                        <div className="field-label-wrapper">
                            <Mail size={16} className="field-icon primary" />
                            <span className="field-label">About</span>
                        </div>
                        {editingField !== 'about' && (
                            <button className="field-edit-btn" onClick={() => setEditingField('about')}>
                                <Edit2 size={16} />
                            </button>
                        )}
                    </div>
                    {editingField === 'about' ? (
                        <div className="field-edit-area">
                            <textarea
                                className="premium-input textarea"
                                value={tempAbout}
                                onChange={(e) => setTempAbout(e.target.value)}
                                autoFocus
                                disabled={loading}
                                maxLength={150}
                                placeholder="Tell people about yourself"
                            />
                            <div className="field-footer-actions">
                                <span className="char-count">{tempAbout.length}/150</span>
                                <div className="field-actions">
                                    <button className="action-circle-btn cancel" onClick={() => setEditingField(null)} disabled={loading}>
                                        <X size={18} />
                                    </button>
                                    <button className="action-circle-btn save" onClick={handleSaveAbout} disabled={loading}>
                                        <Check size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="field-read-area">
                            <span className="field-value about-text">{globalProfile?.bio || 'Hey there! I am using Masum Chat.'}</span>
                        </div>
                    )}
                </div>

                {/* Read-only Sections */}
                <div className="profile-section-title mt-4">Account Details</div>

                <div className="premium-field-card readonly">
                    <div className="field-header">
                        <div className="field-label-wrapper">
                            <span className="field-label">Username</span>
                        </div>
                    </div>
                    <div className="field-read-area">
                        <span className="field-value ghost">@{globalProfile?.username}</span>
                        <span className="field-hint">Usernames are permanent unique identifiers.</span>
                    </div>
                </div>

                <div className="premium-field-card readonly">
                    <div className="field-header">
                        <div className="field-label-wrapper">
                            <span className="field-label">Email Address</span>
                        </div>
                    </div>
                    <div className="field-read-area">
                        <span className="field-value">{userEmail || 'Not available'}</span>
                    </div>
                </div>

                <div className="premium-field-card readonly">
                    <div className="field-header">
                        <div className="field-label-wrapper">
                            <span className="field-label">Joined On</span>
                        </div>
                    </div>
                    <div className="field-read-area">
                        <span className="field-value highlight">
                            {new Date(globalProfile?.created_at || Date.now()).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>



                <div className="profile-footer">
                    <button onClick={() => navigate('/settings')} className="account-settings-btn ripple">
                        Manage Account
                    </button>
                    <p className="credit-text">Designed with ❤️ by MD Azad</p>
                </div>
            </div>

            <BottomNav activeTab="profile" />

            <input
                type="file"
                id="profile-upload"
                hidden
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
            />

            {/* Photo Management Sheet */}
            <FloatingActionSheet
                isOpen={showPhotoSheet}
                onClose={() => setShowPhotoSheet(false)}
                title="Profile Photo"
                subtitle={`@${globalProfile?.username}`}
            >
                <div className="sheet-avatar-preview">
                    <Avatar src={globalProfile?.avatar_url} name={globalProfile?.name || 'User'} size={100} />
                </div>

                <div className="sheet-options-grid">
                    {globalProfile?.avatar_url && (
                        <button className="sheet-option-item" onClick={() => { setShowPhotoSheet(false); setShowPhotoModal(true); }}>
                            <div className="option-icon view"><Eye size={20} /></div>
                            <span>View Full</span>
                        </button>
                    )}
                    <button className="sheet-option-item" onClick={() => document.getElementById('profile-upload')?.click()}>
                        <div className="option-icon upload"><Upload size={20} /></div>
                        <span>{globalProfile?.avatar_url ? 'Update' : 'Upload'}</span>
                    </button>
                    {globalProfile?.avatar_url && (
                        <button className="sheet-option-item delete" onClick={() => { setShowPhotoSheet(false); setShowRemoveConfirm(true); }}>
                            <div className="option-icon trash"><Trash2 size={20} /></div>
                            <span>Remove</span>
                        </button>
                    )}
                </div>
            </FloatingActionSheet>

            {/* Fullscreen Viewer */}
            {showPhotoModal && globalProfile?.avatar_url && createPortal(
                <div className="fullscreen-photo-overlay" onClick={() => setShowPhotoModal(false)}>
                    <button className="close-fullscreen-btn"><X size={28} /></button>
                    <img
                        src={globalProfile?.avatar_url}
                        alt="Profile"
                        onClick={e => e.stopPropagation()}
                        className="fullscreen-image"
                    />
                </div>,
                document.body
            )}

            {/* Confirmation Dialog */}
            {showRemoveConfirm && createPortal(
                <div className="modal-backdrop" onClick={() => setShowRemoveConfirm(false)}>
                    <div className="premium-modal-card" onClick={e => e.stopPropagation()}>
                        <h3>Remove Photo?</h3>
                        <p>Your profile picture will be reset to a default avatar. You can upload a new one at any time.</p>
                        <div className="modal-actions">
                            <button className="modal-btn secondary" onClick={() => setShowRemoveConfirm(false)}>Cancel</button>
                            <button className="modal-btn danger" onClick={handleRemovePhoto}>Confirm</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                .profile-container {
                    background: var(--background-color);
                }
                .glass-header {
                    background: var(--surface-color);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    border-bottom: 1px solid var(--border-color);
                }
                .profile-content {
                    flex: 1;
                    padding: 20px;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    overflow-y: auto;
                    padding-bottom: 100px;
                }
                .profile-hero-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 32px;
                    padding-top: 20px;
                }
                .profile-avatar-wrapper {
                    position: relative;
                    cursor: pointer;
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .profile-avatar-wrapper:active { transform: scale(0.95); }
                .avatar-ring {
                    position: absolute;
                    inset: -4px;
                    border: 2px solid var(--primary-color);
                    border-radius: 50%;
                    opacity: 0.2;
                    animation: pulseRing 2s infinite;
                }
                @keyframes pulseRing {
                    0% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.05); opacity: 0.1; }
                    100% { transform: scale(1); opacity: 0.2; }
                }
                .avatar-edit-badge {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    background: var(--primary-color);
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .profile-hero-text {
                    text-align: center;
                    margin-top: 16px;
                }
                .profile-hero-text h2 {
                    font-size: 24px;
                    font-weight: 800;
                    color: var(--text-primary);
                    margin: 0;
                }
                .username-badge {
                    display: inline-block;
                    margin-top: 4px;
                    background: var(--secondary-color);
                    padding: 4px 12px;
                    border-radius: 20px;
                    color: var(--primary-color);
                    font-weight: 700;
                    font-size: 13px;
                }
                .profile-section-title {
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--primary-color);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0 0 12px 12px;
                }
                .profile-section-title.mt-4 {
                    margin-top: 32px;
                }
                .premium-field-card {
                    background: var(--surface-color);
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .premium-field-card.readonly {
                    background: transparent;
                    border: 1px dashed var(--border-color);
                    box-shadow: none;
                }
                .field-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .field-label-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .field-icon.primary {
                    color: var(--primary-color);
                }
                .field-label {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-secondary);
                }
                .field-edit-btn {
                    color: var(--primary-color);
                    background: var(--primary-light);
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .field-edit-btn:active { transform: scale(0.9); }
                
                .field-read-area {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .field-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .field-value.about-text {
                    font-size: 16px;
                    font-weight: 500;
                    line-height: 1.5;
                }
                .field-value.ghost {
                    color: var(--text-secondary);
                }
                .field-value.highlight {
                    color: var(--primary-color);
                }
                .field-hint {
                    font-size: 13px;
                    color: var(--text-secondary);
                    font-weight: 500;
                }
                
                .field-edit-area {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-top: 12px;
                }
                .premium-input {
                    background: var(--background-color);
                    color: var(--text-primary);
                    border: 2px solid var(--primary-color);
                    border-radius: 14px;
                    padding: 16px;
                    font-size: 16px;
                    font-weight: 600;
                    width: 100%;
                    outline: none;
                    transition: all 0.2s;
                }
                .premium-input:focus {
                    box-shadow: 0 0 0 4px var(--primary-light);
                }
                .premium-input.textarea {
                    min-height: 120px;
                    resize: none;
                    font-weight: 500;
                    line-height: 1.5;
                }
                
                .field-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .field-footer-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                .action-circle-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .action-circle-btn:active { transform: scale(0.9); }
                .action-circle-btn.save { 
                    background: var(--primary-color); 
                    color: white; 
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                .action-circle-btn.cancel { 
                    background: var(--border-color); 
                    color: var(--text-secondary); 
                }
                .char-count {
                    font-size: 13px;
                    color: var(--text-secondary);
                    font-weight: 700;
                }
                .profile-footer {
                    margin-top: 24px;
                    padding-bottom: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }
                .account-settings-btn {
                    width: 100%;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1.5px solid var(--border-color);
                    background: var(--surface-color);
                    color: var(--text-primary);
                    font-weight: 700;
                    font-size: 15px;
                }
                .credit-text { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
                
                .sheet-avatar-preview {
                    display: flex;
                    justify-content: center;
                    margin: 10px 0 24px;
                }
                .sheet-options-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    padding: 0 16px;
                }
                .sheet-option-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    background: var(--secondary-color);
                    padding: 20px;
                    border-radius: 20px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sheet-option-item:active { background: #e2e8f0; transform: scale(0.95); }
                .sheet-option-item.delete { background: #fee2e2; }
                .option-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .option-icon.view { color: var(--primary-color); }
                .option-icon.upload { color: #3b82f6; }
                .option-icon.trash { color: #ef4444; }
                .sheet-option-item span { font-size: 13px; font-weight: 800; color: var(--text-primary); }
                .sheet-option-item.delete span { color: #ef4444; }

                .fullscreen-photo-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.95);
                    backdrop-filter: blur(20px);
                    z-index: 20000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    animation: fadeIn 0.3s ease;
                }
                .fullscreen-image {
                    max-width: 100%;
                    max-height: 80vh;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .close-fullscreen-btn {
                    position: absolute;
                    top: 40px;
                    right: 20px;
                    color: white;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(8px);
                    z-index: 30000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    animation: fadeIn 0.2s ease;
                }
                .premium-modal-card {
                    background: var(--surface-color);
                    padding: 32px;
                    border-radius: 32px;
                    width: 100%;
                    max-width: 400px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    text-align: center;
                }
                .premium-modal-card h3 { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
                .premium-modal-card p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; }
                .modal-actions { display: flex; gap: 12px; }
                .modal-btn { flex: 1; padding: 14px; border-radius: 16px; border: none; font-weight: 700; cursor: pointer; }
                .modal-btn.secondary { background: var(--secondary-color); color: var(--text-secondary); }
                .modal-btn.danger { background: #ef4444; color: white; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default MyProfile;
