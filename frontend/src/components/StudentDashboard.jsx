import React, { useState, useEffect } from 'react';
import { getCourseResources, requestEnrollment, getMyEnrollmentRequests, getMyApprovedCourses, fetchActiveCourses, getExamsByCourse, getQuestions, submitExam, checkSubmission, getStudentSubmissions } from '../api';
import VideoResources from './VideoResources';
import '../styles.css';

const StudentDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('courses');
    const [availableCourses, setAvailableCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [enrollmentRequests, setEnrollmentRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [enrollmentMessage, setEnrollmentMessage] = useState('');
    const [resourcesByCourse, setResourcesByCourse] = useState({});
    const [expandedCourseResources, setExpandedCourseResources] = useState(null);
    const [examsByCourse, setExamsByCourse] = useState({});
    const [expandedCourseExams, setExpandedCourseExams] = useState(null);

    // Sınav katılma için yeni state'ler
    const [showExamModal, setShowExamModal] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [examQuestions, setExamQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [examResult, setExamResult] = useState(null);
    const [mySubmissions, setMySubmissions] = useState([]);

    // Mevcut dersleri getir
    const fetchAvailableCourses = async () => {
        setLoading(true);
        try {
            const data = await fetchActiveCourses();
            setAvailableCourses(data || []);
        } catch (error) {
            console.error('Dersler getirilemedi:', error);
            setMessage('Dersler getirilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Kayıtlı olduğum dersleri getir
    const fetchMyCourses = async () => {
        setLoading(true);
        try {
            const data = await getMyApprovedCourses();
            setMyCourses(data || []);
        } catch (error) {
            console.error('Kayıtlı dersler getirilemedi:', error);
            setMessage('Kayıtlı dersler getirilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Katılım isteklerimi getir
    const fetchEnrollmentRequests = async () => {
        setLoading(true);
        try {
            const data = await getMyEnrollmentRequests();
            setEnrollmentRequests(data || []);
        } catch (error) {
            console.error('Katılım istekleri getirilemedi:', error);
            setMessage('Katılım istekleri getirilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Katılım isteği gönder
    const sendEnrollmentRequest = async () => {
        if (!selectedCourse) return;

        try {
            const result = await requestEnrollment(selectedCourse.id, enrollmentMessage);
            if (result && !result.error) {
                setMessage('Katılım isteğiniz başarıyla gönderildi');
                setShowEnrollmentForm(false);
                setSelectedCourse(null);
                setEnrollmentMessage('');
                fetchEnrollmentRequests();
            } else {
                setMessage(result?.error || 'Katılım isteği gönderilemedi');
            }
        } catch (error) {
            console.error('Katılım isteği gönderilirken hata:', error);
            setMessage('Katılım isteği gönderilirken hata oluştu');
        }
    };

    // Tarih formatı
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('tr-TR');
    };

    // Durum rengi
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ffa500';
            case 'APPROVED': return '#4caf50';
            case 'REJECTED': return '#f44336';
            default: return '#666';
        }
    };

    // Durum metni
    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Bekliyor';
            case 'APPROVED': return 'Onaylandı';
            case 'REJECTED': return 'Reddedildi';
            default: return status;
        }
    };

    // Derse kayıtlı mıyım kontrolü
    const isEnrolledInCourse = (courseId) => {
        return myCourses.some(enrollment => enrollment.course.id === courseId);
    };

    // Bu derse istek göndermiş miyim kontrolü
    const hasRequestedCourse = (courseId) => {
        return enrollmentRequests.some(request => request.course?.id === courseId);
    };

    // Kayıtlı olduğum bir dersin dokümanlarını getir
    const loadCourseResources = async (courseId) => {
        if (!courseId) return;
        try {
            const data = await getCourseResources(courseId);
            setResourcesByCourse(prev => ({ ...prev, [courseId]: data || [] }));
        } catch (error) {
            console.error('Öğrenci için ders dokumanlari getirilemedi:', error);
        }
    };

    // Kayıtlı olduğum bir dersin sınavlarını getir
    const loadCourseExams = async (courseId) => {
        if (!courseId) return;
        try {
            console.log('Öğrenci: Sınavlar yükleniyor, courseId:', courseId);
            const data = await getExamsByCourse(courseId);
            console.log('Öğrenci: Sınavlar yüklendi:', data);
            setExamsByCourse(prev => ({ ...prev, [courseId]: data || [] }));
        } catch (error) {
            console.error('Öğrenci için ders sınavları getirilemedi:', error);
            setExamsByCourse(prev => ({ ...prev, [courseId]: [] }));
        }
    };

    // Sınava katıl
    const joinExam = async (exam) => {
        try {
            // Daha önce gönderilmiş mi kontrol et
            const submission = await checkSubmission(exam.id, user.id);
            if (submission && submission.id) {
                alert('Bu sınavı zaten gönderdiniz!');
                return;
            }

            // Soruları yükle
            const questions = await getQuestions(exam.id);
            console.log('Sorular yüklendi:', questions);

            if (!questions || questions.length === 0) {
                alert('Bu sınavda soru bulunmuyor!');
                return;
            }

            setCurrentExam(exam);
            setExamQuestions(questions);
            setAnswers({});
            setShowExamModal(true);
        } catch (error) {
            console.error('Sınav yüklenirken hata:', error);
            alert('Sınav yüklenirken hata oluştu!');
        }
    };

    // Cevap değiştir
    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    // Sınavı gönder
    const handleSubmitExam = async () => {
        if (!currentExam) return;

        // Tüm sorular cevaplanmış mı kontrol et
        const unansweredCount = examQuestions.filter(q => !answers[q.id]).length;
        if (unansweredCount > 0) {
            if (!confirm(`${unansweredCount} soru cevaplanmadı. Yine de göndermek istiyor musunuz?`)) {
                return;
            }
        }

        if (!confirm('Sınavı göndermek istediğinizden emin misiniz? Gönderildikten sonra değiştirilemez!')) {
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitExam(currentExam.id, user.id, answers);
            console.log('Sınav gönderildi:', result);

            setExamResult(result);
            setShowExamModal(false);
            setShowResultModal(true);
            setMessage('Sınav başarıyla gönderildi!');

            // Gönderimlerimi yenile
            loadMySubmissions();
        } catch (error) {
            console.error('Sınav gönderme hatası:', error);
            alert(error.message || 'Sınav gönderilemedi!');
        } finally {
            setSubmitting(false);
        }
    };

    // Gönderimlerimi yükle
    const loadMySubmissions = async () => {
        try {
            const submissions = await getStudentSubmissions(user.id);
            setMySubmissions(submissions || []);
        } catch (error) {
            console.error('Gönderimler yüklenemedi:', error);
        }
    };

    useEffect(() => {
        fetchAvailableCourses();
        if (activeTab === 'my-courses') {
            fetchMyCourses();
        } else if (activeTab === 'requests') {
            fetchEnrollmentRequests();
        }
        loadMySubmissions();
    }, [activeTab, user.id]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="student-dashboard">
            <div className="dashboard-header">
                <h2>Öğrenci Paneli</h2>
                <p>Hoş geldin, {user.fullName || user.username}</p>
            </div>

            {message && (
                <div className={`message ${message.includes('başarıyla') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="enrollment-tabs">
                <button
                    className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    Tüm Dersler ({availableCourses.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'my-courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-courses')}
                >
                    Kayıtlı Derslerim ({myCourses.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    İsteklerim ({enrollmentRequests.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                >
                    Sınav Sonuçlarım ({mySubmissions.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                >
                    Video Kaynakları
                </button>
            </div>

            <div className="enrollment-content">
                {loading ? (
                    <div className="loading">Yükleniyor...</div>
                ) : (
                    <div>
                        {/* Tüm Dersler Sekmesi */}
                        {activeTab === 'courses' && (
                            <div>
                                <div className="section-header">
                                    <h3>Mevcut Dersler</h3>
                                </div>

                                <div className="course-grid">
                                    {availableCourses.length === 0 ? (
                                        <div className="no-requests">Henüz ders bulunmuyor</div>
                                    ) : (
                                        availableCourses.map(course => (
                                            <div key={course.id} className="course-card">
                                                <h4>{course.title}</h4>
                                                <p>{course.description}</p>
                                                <div className="course-info">
                                                    <span>Öğretmen: {course.teacher?.fullName || course.teacher?.username}</span>
                                                    <span>Oluşturma: {formatDate(course.createdAt)}</span>
                                                </div>
                                                <div className="course-actions">
                                                    {isEnrolledInCourse(course.id) ? (
                                                        <span className="enrollment-status enrolled">Kayıtlısınız</span>
                                                    ) : hasRequestedCourse(course.id) ? (
                                                        <span className="enrollment-status pending">İstek Gönderildi</span>
                                                    ) : (
                                                        <button
                                                            className="enroll-button"
                                                            onClick={() => {
                                                                setSelectedCourse(course);
                                                                setShowEnrollmentForm(true);
                                                            }}
                                                        >
                                                            Katılım İsteği Gönder
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Kayıtlı Derslerim Sekmesi */}
                        {activeTab === 'my-courses' && (
                            <div>
                                <div className="section-header">
                                    <h3>Kayıtlı Derslerim</h3>
                                </div>

                                <div className="course-grid">
                                    {myCourses.length === 0 ? (
                                        <div className="no-requests">Henüz kayıtlı olduğunuz ders bulunmuyor</div>
                                    ) : (
                                        myCourses.map(enrollment => (
                                            <div key={enrollment.id} className="course-card enrolled">
                                                <h4>{enrollment.course.title}</h4>
                                                <p>{enrollment.course.description}</p>
                                                <div className="course-info">
                                                    <span>Öğretmen: {enrollment.course.teacher?.fullName}</span>
                                                    <span>Kayıt Tarihi: {formatDate(enrollment.respondedAt)}</span>
                                                </div>
                                                <div className="course-actions">
                                                    <span className="enrollment-status enrolled">Aktif Kayıt</span>
                                                    <button
                                                        className="enroll-button"
                                                        style={{ marginLeft: '8px', padding: '6px 10px', fontSize: '12px' }}
                                                        onClick={() => {
                                                            const courseId = enrollment.course.id;
                                                            const newExpanded = expandedCourseResources === courseId ? null : courseId;
                                                            setExpandedCourseResources(newExpanded);
                                                            if (newExpanded) {
                                                                loadCourseResources(courseId);
                                                            }
                                                        }}
                                                    >
                                                        Dokümanları Gör
                                                    </button>
                                                    <button
                                                        className="enroll-button"
                                                        style={{ marginLeft: '8px', padding: '6px 10px', fontSize: '12px' }}
                                                        onClick={() => {
                                                            const courseId = enrollment.course.id;
                                                            const newExpanded = expandedCourseExams === courseId ? null : courseId;
                                                            setExpandedCourseExams(newExpanded);
                                                            if (newExpanded) {
                                                                loadCourseExams(courseId);
                                                            }
                                                        }}
                                                    >
                                                        Sınavları Gör
                                                    </button>
                                                </div>
                                                {expandedCourseResources === enrollment.course.id && (
                                                    <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                        <h5>Ders Dokümanları</h5>
                                                        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#555' }}>
                                                            Bu derse kayıtlı olduğunuz için aşağıdaki dokümanlara erişebilirsiniz.
                                                        </div>
                                                        <div>
                                                            {(!resourcesByCourse[enrollment.course.id] || resourcesByCourse[enrollment.course.id].length === 0) ? (
                                                                <div style={{ fontSize: '13px', color: '#777' }}>
                                                                    Bu ders için henüz doküman yok.
                                                                </div>
                                                            ) : (
                                                                <ul style={{ listStyle: 'none', paddingLeft: 0, maxHeight: '150px', overflowY: 'auto' }}>
                                                                    {resourcesByCourse[enrollment.course.id].map(res => (
                                                                    <li key={res.id} style={{ marginBottom: '6px' }}>
                                                                        <a
                                                                            href={`http://localhost:8081/api/resources/${res.id}/download`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ textDecoration: 'none', color: '#1976d2', fontSize: '13px' }}
                                                                        >
                                                                            {res.originalFilename || res.fileName || `Doküman #${res.id}`}
                                                                        </a>
                                                                        <span style={{ marginLeft: '6px', fontSize: '11px', color: '#999' }}>
                                                                            ({res.resourceType || 'MATERIAL'})
                                                                        </span>
                                                                    </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {expandedCourseExams === enrollment.course.id && (
                                                    <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                        <h5>Ders Sınavları</h5>
                                                        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#555' }}>
                                                            Bu derse kayıtlı olduğunuz için aşağıdaki sınavlara katılabilirsiniz.
                                                        </div>
                                                        <div>
                                                            {(!examsByCourse[enrollment.course.id] || examsByCourse[enrollment.course.id].length === 0) ? (
                                                                <div style={{ fontSize: '13px', color: '#777' }}>
                                                                    Bu ders için henüz sınav yok.
                                                                </div>
                                                            ) : (
                                                                <ul style={{ listStyle: 'none', paddingLeft: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                                                    {examsByCourse[enrollment.course.id].map(exam => {
                                                                        const now = new Date();
                                                                        const startTime = exam.startTime ? new Date(exam.startTime) : null;
                                                                        const endTime = exam.endTime ? new Date(exam.endTime) : null;

                                                                        let statusText = 'Bilinmeyen Durum';
                                                                        let statusColor = '#999';

                                                                        if (!exam.isActive) {
                                                                            statusText = 'Pasif';
                                                                            statusColor = '#999';
                                                                        } else if (startTime && startTime > now) {
                                                                            statusText = 'Henüz Başlamadı';
                                                                            statusColor = '#ff9800';
                                                                        } else if (endTime && endTime < now) {
                                                                            statusText = 'Süresi Doldu';
                                                                            statusColor = '#f44336';
                                                                        } else {
                                                                            statusText = 'Aktif - Katılabilirsiniz';
                                                                            statusColor = '#4caf50';
                                                                        }

                                                                        return (
                                                                            <li key={exam.id} style={{
                                                                                marginBottom: '12px',
                                                                                padding: '10px',
                                                                                border: '1px solid #e0e0e0',
                                                                                borderRadius: '4px',
                                                                                backgroundColor: exam.isActive && startTime && endTime && startTime <= now && endTime >= now ? '#f0fff0' : '#f9f9f9'
                                                                            }}>
                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    alignItems: 'center',
                                                                                    marginBottom: '6px'
                                                                                }}>
                                                                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{exam.title}</div>
                                                                                    <div style={{
                                                                                        fontSize: '11px',
                                                                                        color: statusColor,
                                                                                        fontWeight: 'bold',
                                                                                        padding: '2px 6px',
                                                                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                                                                        borderRadius: '3px'
                                                                                    }}>
                                                                                        {statusText}
                                                                                    </div>
                                                                                </div>

                                                                                {exam.description && (
                                                                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                                                                                        <strong>Açıklama:</strong> {exam.description}
                                                                                    </div>
                                                                                )}

                                                                                <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.4' }}>
                                                                                    {exam.startTime && (
                                                                                        <div><strong>Başlangıç:</strong> {new Date(exam.startTime).toLocaleString('tr-TR')}</div>
                                                                                    )}
                                                                                    {exam.endTime && (
                                                                                        <div><strong>Bitiş:</strong> {new Date(exam.endTime).toLocaleString('tr-TR')}</div>
                                                                                    )}
                                                                                    {exam.duration && (
                                                                                        <div><strong>Süre:</strong> {exam.duration} dakika</div>
                                                                                    )}
                                                                                    {exam.questions && exam.questions.length > 0 && (
                                                                                        <div><strong>Soru Sayısı:</strong> {exam.questions.length}</div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Sınav durumuna göre buton */}
                                                                                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                                                                                    {exam.isActive && startTime && endTime && startTime <= now && endTime >= now ? (
                                                                                        <button
                                                                                            style={{
                                                                                                padding: '6px 12px',
                                                                                                backgroundColor: '#4caf50',
                                                                                                color: 'white',
                                                                                                border: 'none',
                                                                                                borderRadius: '4px',
                                                                                                cursor: 'pointer',
                                                                                                fontSize: '12px',
                                                                                                fontWeight: 'bold'
                                                                                            }}
                                                                                            onClick={() => {
                                                                                                // Sınava katılma işlemi burada olacak
                                                                                                joinExam(exam);
                                                                                            }}
                                                                                        >
                                                                                            Sınava Katıl
                                                                                        </button>
                                                                                    ) : (
                                                                                        <div style={{
                                                                                            fontSize: '11px',
                                                                                            color: '#999',
                                                                                            fontStyle: 'italic'
                                                                                        }}>
                                                                                            {!exam.isActive ? 'Sınav pasif durumda' :
                                                                                             startTime && startTime > now ? 'Sınav henüz başlamadı' :
                                                                                             endTime && endTime < now ? 'Sınav süresi doldu' :
                                                                                             'Sınava katılılamıyor'}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* İsteklerim Sekmesi */}
                        {activeTab === 'requests' && (
                            <div>
                                <div className="section-header">
                                    <h3>Katılım İsteklerim</h3>
                                </div>

                                <div className="requests-list">
                                    {enrollmentRequests.length === 0 ? (
                                        <div className="no-requests">Henüz katılım isteği göndermediniz</div>
                                    ) : (
                                        enrollmentRequests.map(request => (
                                            <div key={request.id} className={`request-item ${request.status.toLowerCase()}`}>
                                                <div className="request-header">
                                                    <h4>{request.course?.title}</h4>
                                                    <span className={`status-badge ${request.status.toLowerCase()}`}>
                                                        {getStatusText(request.status)}
                                                    </span>
                                                </div>
                                                <div className="request-details">
                                                    <span><strong>Öğretmen:</strong> {request.course?.teacher?.fullName}</span>
                                                    <span><strong>İstek Tarihi:</strong> {formatDate(request.requestedAt)}</span>
                                                    {request.respondedAt && (
                                                        <span><strong>Yanıt Tarihi:</strong> {formatDate(request.respondedAt)}</span>
                                                    )}
                                                </div>
                                                {request.message && (
                                                    <div className="request-message">
                                                        <strong>Mesajınız:</strong> {request.message}
                                                    </div>
                                                )}
                                                {request.responseMessage && (
                                                    <div className="response-message">
                                                        <strong>Öğretmen Yanıtı:</strong> {request.responseMessage}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sınav Sonuçlarım Sekmesi */}
                        {activeTab === 'results' && (
                            <div>
                                <div className="section-header">
                                    <h3>Sınav Sonuçlarım</h3>
                                </div>

                                <div className="enrollment-list">
                                    {mySubmissions.length === 0 ? (
                                        <div className="no-requests">Henüz sınav sonucu yok</div>
                                    ) : (
                                        mySubmissions.map(submission => (
                                            <div key={submission.id} className="enrollment-card">
                                                <div className="card-header">
                                                    <h3>{submission.examTitle}</h3>
                                                    <span className="status" style={{
                                                        color: submission.percentage >= 50 ? '#4caf50' : '#f44336',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {submission.percentage >= 50 ? 'Geçti ✓' : 'Kaldı ✗'}
                                                    </span>
                                                </div>
                                                <div className="card-body">
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gap: '15px',
                                                        marginBottom: '15px'
                                                    }}>
                                                        <div style={{
                                                            padding: '15px',
                                                            backgroundColor: '#f0f7ff',
                                                            borderRadius: '8px',
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                                                                {submission.score} / {submission.maxScore}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                                Aldığınız Puan
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            padding: '15px',
                                                            backgroundColor: submission.percentage >= 50 ? '#f0fff4' : '#fff5f5',
                                                            borderRadius: '8px',
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '24px',
                                                                fontWeight: 'bold',
                                                                color: submission.percentage >= 50 ? '#4caf50' : '#f44336'
                                                            }}>
                                                                %{submission.percentage.toFixed(1)}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                                Başarı Oranı
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: '#666' }}>
                                                        <strong>Gönderim Tarihi:</strong> {formatDate(submission.submittedAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Video Kaynakları Sekmesi */}
                        {activeTab === 'videos' && (
                            <div>
                                <div className="section-header">
                                    <h3>Video Kaynakları</h3>
                                </div>

                                <div className="video-resources">
                                    <VideoResources />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Katılım İsteği Formu */}
            {showEnrollmentForm && selectedCourse && (
                <div className="enrollment-form-overlay">
                    <div className="enrollment-form">
                        <h3>Katılım İsteği Gönder</h3>
                        <h4>{selectedCourse.title}</h4>
                        <p><strong>Öğretmen:</strong> {selectedCourse.teacher?.fullName}</p>
                        <p><strong>Açıklama:</strong> {selectedCourse.description}</p>

                        <div className="form-group">
                            <label>İstek Mesajınız (İsteğe bağlı):</label>
                            <textarea
                                value={enrollmentMessage}
                                onChange={(e) => setEnrollmentMessage(e.target.value)}
                                placeholder="Bu derse neden katılmak istediğinizi kısaca açıklayın..."
                                rows="3"
                            />
                        </div>

                        <div className="form-buttons">
                            <button onClick={sendEnrollmentRequest}>İstek Gönder</button>
                            <button onClick={() => {
                                setShowEnrollmentForm(false);
                                setSelectedCourse(null);
                                setEnrollmentMessage('');
                            }}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sınav Modal */}
            {showExamModal && currentExam && (
                <div className="exam-modal-overlay">
                    <div className="exam-modal">
                        <h3>{currentExam.title}</h3>
                        <div className="exam-info">
                            <div><strong>Açıklama:</strong> {currentExam.description}</div>
                            <div><strong>Başlangıç:</strong> {new Date(currentExam.startTime).toLocaleString('tr-TR')}</div>
                            <div><strong>Bitiş:</strong> {new Date(currentExam.endTime).toLocaleString('tr-TR')}</div>
                            <div><strong>Süre:</strong> {currentExam.duration} dakika</div>
                        </div>

                        <div className="questions-list">
                            {examQuestions.map(question => (
                                <div key={question.id} className="question-item">
                                    <div className="question-text">
                                        <strong>{question.questionType === 'MULTIPLE_CHOICE' ? 'Seçenekli Soru' : 'Açık Uçlu Soru'}</strong>
                                        <p>{question.text}</p>
                                    </div>
                                    <div className="question-options">
                                        {question.questionType === 'MULTIPLE_CHOICE' ? (
                                            // Çoktan seçmeli soru
                                            question.options && question.options.length > 0 ? (
                                                question.options.map((option, index) => (
                                                    <div key={option.id} className="option-item">
                                                        <input
                                                            type="radio"
                                                            id={`q${question.id}o${index}`}
                                                            name={`question_${question.id}`}
                                                            value={option.id}
                                                            checked={answers[question.id] === option.id}
                                                            onChange={() => handleAnswerChange(question.id, option.id)}
                                                        />
                                                        <label htmlFor={`q${question.id}o${index}`} style={{ marginLeft: '6px' }}>
                                                            {option.text}
                                                        </label>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ color: '#f44336', fontSize: '12px' }}>
                                                    Bu soruda seçenek bulunmuyor!
                                                </div>
                                            )
                                        ) : (
                                            // Açık uçlu soru
                                            <div className="open-answer">
                                                <textarea
                                                    value={answers[question.id] || ''}
                                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    placeholder="Cevabınızı buraya yazın..."
                                                    rows="3"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="exam-actions">
                            <button
                                onClick={handleSubmitExam}
                                disabled={submitting}
                                style={{ backgroundColor: submitting ? '#ccc' : '#4caf50', cursor: submitting ? 'not-allowed' : 'pointer' }}
                            >
                                {submitting ? 'Gönderiliyor...' : 'Sınavı Gönder'}
                            </button>
                            <button onClick={() => setShowExamModal(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sonuç Modal */}
            {showResultModal && examResult && (
                <div className="result-modal-overlay">
                    <div className="result-modal">
                        <h3>Sınav Sonucu</h3>
                        <div className="result-info">
                            <div><strong>Ders:</strong> {examResult.courseTitle}</div>
                            <div><strong>Sınav:</strong> {examResult.examTitle}</div>
                            <div><strong>Not:</strong> {examResult.grade} / {examResult.totalPoints}</div>
                            <div><strong>Durum:</strong> {examResult.passed ? 'Geçti' : 'Kaldı'}</div>
                        </div>

                        <div className="result-actions">
                            <button onClick={() => setShowResultModal(false)}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
