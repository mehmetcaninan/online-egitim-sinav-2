import React, { useState, useEffect } from 'react';

// API fonksiyonlarını import et
function getAuthHeader() {
    const auth = localStorage.getItem('auth')
    console.log('DEBUG: getAuthHeader - Raw auth from localStorage:', auth)
    if (!auth) {
        console.log('DEBUG: getAuthHeader - No auth token found')
        return {}
    }
    const header = { Authorization: `Basic ${auth}` }
    console.log('DEBUG: getAuthHeader - Generated header:', header)
    return header
}

const VideoResources = ({ userRole, userId }) => {
    const [videos, setVideos] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        videoUrl: '',
        videoType: 'LECTURE',
        course: { id: '' }
    });

    const videoTypes = [
        { value: 'LECTURE', label: 'Ders' },
        { value: 'TUTORIAL', label: 'Eğitim' },
        { value: 'DEMONSTRATION', label: 'Gösterim' },
        { value: 'EXERCISE', label: 'Alıştırma' },
        { value: 'OTHER', label: 'Diğer' }
    ];

    useEffect(() => {
        fetchVideos();
        if (userRole === 'TEACHER') {
            fetchCourses();
        }
    }, [userRole]);

    const fetchVideos = async () => {
        try {
            const endpoint = userRole === 'TEACHER' ? '/api/videos/my-videos' : '/api/videos';
            const auth = localStorage.getItem('auth');

            const response = await fetch(`http://localhost:8081${endpoint}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(auth),
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setVideos(data);
            }
        } catch (error) {
            console.error('Video yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const auth = localStorage.getItem('auth');
            // Mevcut endpoint'i kullan
            const response = await fetch(`http://localhost:8081/api/courses/teacher/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(auth),
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Yüklenen dersler:', data); // Debug için
                setCourses(data);
            } else {
                console.error('Dersler yüklenirken hata - Response:', response.status);
            }
        } catch (error) {
            console.error('Dersler yüklenirken hata:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.videoUrl) {
            alert('Başlık ve video URL zorunludur!');
            return;
        }

        try {
            const url = editingVideo
                ? `http://localhost:8081/api/videos/${editingVideo.id}`
                : 'http://localhost:8081/api/videos';

            const method = editingVideo ? 'PUT' : 'POST';

            console.log('DEBUG: createVideo called with:', formData);
            const currentUser = localStorage.getItem('currentUser');
            const auth = localStorage.getItem('auth');

            if (!auth || !currentUser) {
                console.error('ERROR: Authentication is null or name is null');
                alert('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
                return;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    course: formData.course.id ? { id: parseInt(formData.course.id) } : null
                })
            });

            if (response.ok) {
                fetchVideos();
                resetForm();
                alert(editingVideo ? 'Video güncellendi!' : 'Video eklendi!');
            } else {
                alert('İşlem başarısız!');
            }
        } catch (error) {
            console.error('Video kaydetme hatası:', error);
            alert('Bir hata oluştu!');
        }
    };

    const handleEdit = (video) => {
        setEditingVideo(video);
        setFormData({
            title: video.title || '',
            description: video.description || '',
            videoUrl: video.videoUrl || '',
            videoType: video.videoType || 'LECTURE',
            course: { id: video.course?.id || '' }
        });
        setShowForm(true);
    };

    const handleDelete = async (videoId) => {
        if (!confirm('Bu videoyu silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8081/api/videos/${videoId}`, {
                method: 'DELETE',
                headers: {
                    ...getAuthHeader()
                }
            });

            if (response.ok) {
                fetchVideos();
                alert('Video silindi!');
            } else {
                alert('Silme işlemi başarısız!');
            }
        } catch (error) {
            console.error('Video silme hatası:', error);
            alert('Bir hata oluştu!');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            videoUrl: '',
            videoType: 'LECTURE',
            course: { id: '' }
        });
        setEditingVideo(null);
        setShowForm(false);
    };

    const getVideoTypeLabel = (type) => {
        const typeObj = videoTypes.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    };

    if (loading) {
        return <div className="loading">Yükleniyor...</div>;
    }

    return (
        <div className="video-resources">
            <div className="video-header">
                <h2>Video Kaynakları</h2>
                {userRole === 'TEACHER' && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        Yeni Video Ekle
                    </button>
                )}
            </div>

            {showForm && (
                <div className="video-form-overlay">
                    <div className="video-form">
                        <h3>{editingVideo ? 'Video Düzenle' : 'Yeni Video Ekle'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Başlık *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Video URL *</label>
                                <input
                                    type="url"
                                    value={formData.videoUrl}
                                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Video Türü</label>
                                <select
                                    value={formData.videoType}
                                    onChange={(e) => setFormData({...formData, videoType: e.target.value})}
                                >
                                    {videoTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Ders</label>
                                <select
                                    value={formData.course.id}
                                    onChange={(e) => setFormData({...formData, course: { id: e.target.value }})}
                                >
                                    <option value="">Ders Seçin</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.title || course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingVideo ? 'Güncelle' : 'Ekle'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="video-list">
                {videos.length === 0 ? (
                    <div className="no-videos">Henüz video eklenmemiş.</div>
                ) : (
                    videos.map(video => (
                        <div key={video.id} className="video-card">
                            <div className="video-thumbnail">
                                <div className="default-thumbnail">📹</div>
                            </div>

                            <div className="video-info">
                                <h3>{video.title}</h3>
                                {video.description && (
                                    <p className="video-description">{video.description}</p>
                                )}

                                <div className="video-meta">
                                    <span className="video-type">{getVideoTypeLabel(video.videoType)}</span>
                                    {video.course && (
                                        <span className="video-course">{video.course.title || video.course.name}</span>
                                    )}
                                </div>

                                <div className="video-actions">
                                    <a
                                        href={video.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-primary"
                                    >
                                        İzle
                                    </a>

                                    {userRole === 'TEACHER' && (
                                        <>
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => handleEdit(video)}
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(video.id)}
                                            >
                                                Sil
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VideoResources;
