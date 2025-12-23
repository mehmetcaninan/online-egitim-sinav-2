import React, { useState, useEffect } from 'react';
import { fetchClassrooms, getCourseResources, getCourseStudents, getCoursesByTeacher, getExamsByCourse, getExamSubmissions } from '../api';
import VideoResources from './VideoResources';
import '../styles.css';

// API base URL - backend 8081 portunda çalışıyor
const API_BASE_URL = 'http://localhost:8081';

const TeacherDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [showExamForm, setShowExamForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        classroomIds: []
    });
    const [classrooms, setClassrooms] = useState([]);
    const [examForm, setExamForm] = useState({
        title: '',
        description: '',
        courseId: '',
        startTime: '',
        endTime: ''
    });
    const [examQuestions, setExamQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctOptionIndex: null,
        answerKey: '',
        points: 1.0
    });
    const [resourcesByCourse, setResourcesByCourse] = useState({});
    const [expandedCourseResources, setExpandedCourseResources] = useState(null);
    const [selectedCourseForStudents, setSelectedCourseForStudents] = useState('');
    const [courseStudents, setCourseStudents] = useState([]);
    const [loadingCourseStudents, setLoadingCourseStudents] = useState(false);
    const [exams, setExams] = useState([]);
    const [examsByCourse, setExamsByCourse] = useState({});
    const [loadingExams, setLoadingExams] = useState(false);
    const [selectedCourseForExams, setSelectedCourseForExams] = useState('');
    const [allExams, setAllExams] = useState([]); // Tüm sınavları saklamak için
    const [selectedExamDetails, setSelectedExamDetails] = useState(null);
    const [showExamDetails, setShowExamDetails] = useState(false);
    const [loadingExamDetails, setLoadingExamDetails] = useState(false);

    // Sınav sonuçları için state'ler
    const [selectedExamForResults, setSelectedExamForResults] = useState(null);
    const [examSubmissions, setExamSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Bekleyen katılım isteklerini getir
    const fetchPendingRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/enrollments/pending/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(data);
            }
        } catch (error) {
            console.error('Bekleyen istekler getirilemedi:', error);
            setMessage('Bekleyen istekler getirilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Tüm katılım isteklerini getir
    const fetchAllRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/enrollments/all/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setAllRequests(data);
            }
        } catch (error) {
            console.error('Tüm istekler getirilemedi:', error);
            setMessage('Tüm istekler getirilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Katılım isteğini onayla
    const approveRequest = async (enrollmentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/enrollments/approve/${enrollmentId}`, {
                method: 'POST'
            });

            if (response.ok) {
                setMessage('Katılım isteği onaylandı');
                fetchPendingRequests();
                fetchAllRequests();
            } else {
                setMessage('Onaylama işlemi başarısız');
            }
        } catch (error) {
            console.error('Onaylama hatası:', error);
            setMessage('Onaylama işleminde hata oluştu');
        }
    };

    // Katılım isteğini reddet
    const rejectRequest = async (enrollmentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/enrollments/reject/${enrollmentId}`, {
                method: 'POST'
            });

            if (response.ok) {
                setMessage('Katılım isteği reddedildi');
                fetchPendingRequests();
                fetchAllRequests();
            } else {
                setMessage('Reddetme işlemi başarısız');
            }
        } catch (error) {
            console.error('Reddetme hatası:', error);
            setMessage('Reddetme işleminde hata oluştu');
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

    // Öğretmenin derslerini getir
    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await getCoursesByTeacher(user.id);
            setCourses(data || []);
        } catch (error) {
            console.error('Dersler getirilemedi:', error);
            setMessage('Dersler getirilemedi');
        } finally {
            setLoading(false);
        }
    };

    // Bir dersin dokumanlarini yukle
    const loadCourseResources = async (courseId) => {
        if (!courseId) return;
        try {
            const data = await getCourseResources(courseId);
            setResourcesByCourse(prev => ({ ...prev, [courseId]: data || [] }));
        } catch (error) {
            console.error('Ders dokumanlari yuklenemedi:', error);
        }
    };

    const loadCourseStudents = async (courseId) => {
        if (!courseId) {
            setCourseStudents([]);
            return;
        }
        setLoadingCourseStudents(true);
        try {
            const data = await getCourseStudents(courseId);
            setCourseStudents(data || []);
        } catch (error) {
            console.error('Ders öğrencileri getirilemedi:', error);
            setCourseStudents([]);
        } finally {
            setLoadingCourseStudents(false);
        }
    };

    // Sınıfları getir
    const loadClassrooms = async () => {
        try {
            const data = await fetchClassrooms();
            setClassrooms(data || []);
        } catch (error) {
            console.error('Sınıflar yüklenemedi:', error);
        }
    };

    // Yeni ders oluştur
    const createCourse = async () => {
        if (!courseForm.title.trim()) {
            setMessage('Ders adı zorunludur');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: courseForm.title,
                    description: courseForm.description,
                    teacherId: user.id,
                    classroomIds: courseForm.classroomIds || []
                })
            });

            if (response.ok) {
                setMessage('Ders başarıyla oluşturuldu');
                setCourseForm({ title: '', description: '', classroomIds: [] });
                setShowCourseForm(false);
                fetchCourses();
            } else {
                const errorText = await response.text();
                setMessage('Ders oluşturulamadı: ' + errorText);
            }
        } catch (error) {
            console.error('Ders oluşturma hatası:', error);
            setMessage('Ders oluşturma hatası');
        }
    };

    // Sınıf seçimini değiştir
    const handleClassroomToggle = (classroomId) => {
        setCourseForm(prev => {
            const currentIds = prev.classroomIds || [];
            const newIds = currentIds.includes(classroomId)
                ? currentIds.filter(id => id !== classroomId)
                : [...currentIds, classroomId];
            return { ...prev, classroomIds: newIds };
        });
    };

    // Ders güncelle
    const updateCourse = async () => {
        if (!editingCourse || !courseForm.title.trim()) {
            setMessage('Ders adı zorunludur');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/courses/${editingCourse.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: courseForm.title,
                    description: courseForm.description,
                    classroomIds: courseForm.classroomIds || []
                })
            });

            if (response.ok) {
                setMessage('Ders başarıyla güncellendi');
                setEditingCourse(null);
                setCourseForm({ title: '', description: '', classroomIds: [] });
                fetchCourses();
            } else {
                const errorText = await response.text();
                setMessage('Ders güncellenemedi: ' + errorText);
            }
        } catch (error) {
            console.error('Ders güncelleme hatası:', error);
            setMessage('Ders güncelleme hatası');
        }
    };

    // Ders sil
    const deleteCourse = async (courseId) => {
        if (!window.confirm('Bu dersi silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setMessage('Ders başarıyla silindi');
                fetchCourses();
            } else {
                const errorText = await response.text();
                setMessage('Ders silinemedi: ' + errorText);
            }
        } catch (error) {
            console.error('Ders silme hatası:', error);
            setMessage('Ders silme hatası');
        }
    };

    // Ders düzenleme için formu aç
    const startEditingCourse = (course) => {
        // Dersin mevcut sınıflarını bul
        const courseClassroomIds = [];
        classrooms.forEach(classroom => {
            if (classroom.courses && classroom.courses.some(c => c.id === course.id)) {
                courseClassroomIds.push(classroom.id);
            }
        });

        setEditingCourse(course);
        setCourseForm({
            title: course.title,
            description: course.description || '',
            classroomIds: courseClassroomIds
        });
    };

    // Sınavları getir - IMPROVED VERSION
    const fetchExams = async (courseId) => {
        if (!courseId) {
            console.log('fetchExams: courseId yok, liste temizleniyor');
            setExams([]);
            return;
        }
        console.log('fetchExams: Sınavlar yükleniyor, courseId:', courseId);
        setLoadingExams(true);
        try {
            // API çağrısından önce kısa bir bekleme ekle
            await new Promise(resolve => setTimeout(resolve, 200));

            const data = await getExamsByCourse(courseId);
            console.log('fetchExams: Sınavlar yüklendi:', data);
            console.log('fetchExams: Sınav sayısı:', data?.length || 0);

            // Sınavları state'e set et
            setExams(data || []);
            setExamsByCourse(prev => ({ ...prev, [courseId]: data || [] }));

            // Debug: Her sınavın detaylarını logla
            if (data && data.length > 0) {
                data.forEach((exam, index) => {
                    console.log(`fetchExams: Sınav ${index + 1} - ID: ${exam.id}, Title: ${exam.title}, Active: ${exam.isActive}`);
                });
            }
        } catch (error) {
            console.error('Sınavlar getirilemedi:', error);
            setExams([]);
        } finally {
            setLoadingExams(false);
        }
    };

    // Öğretmenin tüm sınavlarını getir
    const fetchAllExams = async () => {
        if (!user.id) return;
        setLoadingExams(true);
        try {
            // Tüm derslerin sınavlarını topla
            const allExamsData = [];
            for (const course of courses) {
                try {
                    const data = await getExamsByCourse(course.id);
                    if (data && data.length > 0) {
                        allExamsData.push(...data);
                    }
                } catch (error) {
                    console.error(`Ders ${course.id} için sınavlar getirilemedi:`, error);
                }
            }
            setAllExams(allExamsData);
            console.log('Tüm sınavlar yüklendi:', allExamsData.length);
        } catch (error) {
            console.error('Tüm sınavlar getirilemedi:', error);
        } finally {
            setLoadingExams(false);
        }
    };

    // Soru ekle
    const addQuestionToForm = () => {
        if (!currentQuestion.text.trim()) {
            setMessage('Soru metni zorunludur');
            return;
        }
        if (currentQuestion.type === 'MULTIPLE_CHOICE') {
            if (currentQuestion.correctOptionIndex === null || currentQuestion.correctOptionIndex === undefined) {
                setMessage('Doğru cevap seçeneği belirtilmelidir');
                return;
            }
            if (currentQuestion.options.filter(o => o.trim()).length < 2) {
                setMessage('En az 2 seçenek doldurulmalıdır');
                return;
            }
        } else if (currentQuestion.type === 'CLASSIC') {
            if (!currentQuestion.answerKey.trim()) {
                setMessage('Klasik soru için anahtar metin zorunludur');
                return;
            }
        }
        setExamQuestions([...examQuestions, { ...currentQuestion }]);
        setCurrentQuestion({
            text: '',
            type: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correctOptionIndex: null,
            answerKey: '',
            points: 1.0
        });
        setMessage('Soru eklendi');
    };

    // Soruyu listeden sil
    const removeQuestion = (index) => {
        setExamQuestions(examQuestions.filter((_, i) => i !== index));
    };

    // Sınav oluştur
    const createExam = async () => {
        if (!examForm.title.trim() || !examForm.courseId) {
            setMessage('Sınav adı ve ders seçimi zorunludur');
            return;
        }
        if (!examForm.startTime || !examForm.endTime) {
            setMessage('Başlangıç ve bitiş tarihi zorunludur');
            return;
        }
        if (examQuestions.length === 0) {
            setMessage('En az bir soru eklenmelidir');
            return;
        }

        // courseId'yi önce kaydet çünkü form temizlenecek
        const createdCourseId = parseInt(examForm.courseId);
        console.log('createExam: Başlangıç - CourseId:', createdCourseId, 'Title:', examForm.title);
        
        try {
            const examPayload = {
                title: examForm.title,
                description: examForm.description,
                courseId: createdCourseId,
                startTime: examForm.startTime,
                endTime: examForm.endTime,
                createdById: user.id,
                isTest: false
            };
            console.log('createExam: Gönderilen payload:', examPayload);
            
            // Önce sınavı oluştur
            const examResponse = await fetch('http://localhost:8080/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(examPayload)
            });

            console.log('createExam: Response status:', examResponse.status);

            if (!examResponse.ok) {
                const errorText = await examResponse.text();
                console.error('Sınav oluşturma hatası:', errorText);
                setMessage('Sınav oluşturulamadı: ' + errorText);
                return;
            }

            const exam = await examResponse.json();
            console.log('createExam: Sınav oluşturuldu:', exam);

            const examId = exam.id;

            // Sonra soruları ekle
            let successCount = 0;
            for (const question of examQuestions) {
                const questionData = {
                    text: question.text,
                    type: question.type,
                    points: question.points
                };
                
                if (question.type === 'MULTIPLE_CHOICE') {
                    const filteredOptions = question.options.filter(o => o.trim());
                    if (filteredOptions.length < 2) {
                        console.warn('Soru atlandı - yeterli seçenek yok:', question);
                        continue;
                    }
                    questionData.options = filteredOptions;
                    questionData.correctOptionIndex = question.correctOptionIndex;
                } else {
                    questionData.answerKey = question.answerKey;
                }

                const questionResponse = await fetch(`http://localhost:8080/api/exams/${examId}/questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(questionData)
                });

                if (questionResponse.ok) {
                    successCount++;
                } else {
                    const errorText = await questionResponse.text();
                    console.error('Soru eklenemedi:', question, errorText);
                }
            }

            console.log(`${successCount}/${examQuestions.length} soru eklendi`);

            setMessage(`Sınav ve ${successCount} soru başarıyla oluşturuldu`);
            
            // Formu temizle
            setExamForm({
                title: '',
                description: '',
                courseId: '',
                startTime: '',
                endTime: ''
            });
            setExamQuestions([]);
            setCurrentQuestion({
                text: '',
                type: 'MULTIPLE_CHOICE',
                options: ['', '', '', ''],
                correctOptionIndex: null,
                answerKey: '',
                points: 1.0
            });
            setShowExamForm(false);
            
            // Sınavları yeniden yükle - ders seçimini güncelle ve listeyi yenile
            console.log('Sınav oluşturduktan sonra liste güncelleniyor...');

            // Önce ders seçimini güncelley (eğer değilse)
            if (!selectedCourseForExams || selectedCourseForExams != createdCourseId) {
                console.log('Ders seçimi güncelleniyor:', createdCourseId);
                setSelectedCourseForExams(createdCourseId.toString());
            }

            // Kısa bir bekleme sonrası sınavları yükle (backend'in işlem tamamlaması için)
            setTimeout(async () => {
                try {
                    console.log('Sınavlar yeniden yükleniyor, courseId:', createdCourseId);
                    await fetchExams(createdCourseId);
                    console.log('Sınavlar başarıyla yeniden yüklendi');
                } catch (error) {
                    console.error('Sınav listesi yenileme hatası:', error);
                }
            }, 500);

        } catch (error) {
            console.error('Sınav oluşturma hatası:', error);
            setMessage('Sınav oluşturma hatası: ' + error.message);
        }
    };

    // Sınav detaylarını görüntüle
    const viewExamDetails = async (examId) => {
        if (!examId) return;
        setLoadingExamDetails(true);
        setShowExamDetails(true);
        try {
            // Önce sınavı getir
            const response = await fetch(`http://localhost:8080/api/exams/${examId}`);
            if (!response.ok) {
                throw new Error('Sınav detayları alınamadı');
            }
            const examData = await response.json();
            setSelectedExamDetails(examData);

            // Sonra soruları getir
            const questionsResponse = await fetch(`http://localhost:8080/api/exams/${examId}/questions`);
            if (!questionsResponse.ok) {
                throw new Error('Soru detayları alınamadı');
            }
            const questionsData = await questionsResponse.json();
            setExamQuestions(questionsData);
        } catch (error) {
            console.error('Detaylar alınırken hata oluştu:', error);
            setMessage('Detaylar alınamadı: ' + error.message);
        } finally {
            setLoadingExamDetails(false);
        }
    };

    // Sınav sonuçlarını getir
    const fetchExamSubmissions = async (examId) => {
        if (!examId) {
            setExamSubmissions([]);
            return;
        }
        setLoadingSubmissions(true);
        try {
            const data = await getExamSubmissions(examId);
            setExamSubmissions(data || []);
        } catch (error) {
            console.error('Sınav sonuçları getirilemedi:', error);
            setExamSubmissions([]);
            setMessage('Sınav sonuçları getirilemedi');
        } finally {
            setLoadingSubmissions(false);
        }
    };

    useEffect(() => {
        fetchCourses();
        loadClassrooms();
        if (activeTab === 'pending') {
            fetchPendingRequests();
        } else if (activeTab === 'all') {
            fetchAllRequests();
        }
    }, [activeTab, user.id]);

    useEffect(() => {
        if (showCourseForm) {
            loadClassrooms();
        }
    }, [showCourseForm]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Sınav sonuçları sekmesi açıldığında tüm sınavları yükle
    useEffect(() => {
        if (activeTab === 'results' && courses.length > 0) {
            fetchAllExams();
        }
    }, [activeTab, courses]);

    return (
        <div className="teacher-dashboard">
            <div className="dashboard-header">
                <h2>Öğretmen Paneli</h2>
                <p>Hoş geldin, {user.fullName || user.username}</p>
            </div>

            {message && (
                <div className={`message ${message.includes('başarıyla') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="enrollment-tabs">
                <button
                    className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Bekleyen İstekler ({pendingRequests.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Tüm İstekler ({allRequests.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    Derslerim ({courses.length})
                </button>
                <button
                    className={`tab-button ${activeTab === 'exams' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exams')}
                >
                    Sınavlarım
                </button>
                <button
                    className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
                    onClick={() => setActiveTab('results')}
                >
                    Sınav Sonuçları
                </button>
                <button
                    className={`tab-button ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Ders Öğrencileri
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
                        {/* Bekleyen İstekler Sekmesi */}
                        {activeTab === 'pending' && (
                            <div className="enrollment-list">
                                {pendingRequests.length === 0 ? (
                                    <div className="no-requests">Bekleyen katılım isteği bulunmuyor</div>
                                ) : (
                                    pendingRequests.map(request => (
                                        <div key={request.id} className="enrollment-card">
                                            <div className="card-header">
                                                <h3>{request.courseTitle}</h3>
                                                <span className="status" style={{color: getStatusColor(request.status)}}>
                                                    {getStatusText(request.status)}
                                                </span>
                                            </div>
                                            <div className="card-body">
                                                <div className="student-info">
                                                    <strong>Öğrenci:</strong> {request.userFullName} ({request.userName})
                                                </div>
                                                {request.message && (
                                                    <div className="request-message">
                                                        <strong>Mesaj:</strong> {request.message}
                                                    </div>
                                                )}
                                                <div className="request-date">
                                                    <strong>Talep Tarihi:</strong> {formatDate(request.requestedAt)}
                                                </div>
                                            </div>
                                            <div className="card-actions">
                                                <button
                                                    className="approve-btn"
                                                    onClick={() => approveRequest(request.id)}
                                                >
                                                    Onayla
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => rejectRequest(request.id)}
                                                >
                                                    Reddet
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Tüm İstekler Sekmesi */}
                        {activeTab === 'all' && (
                            <div className="enrollment-list">
                                {allRequests.length === 0 ? (
                                    <div className="no-requests">Hiç katılım isteği bulunmuyor</div>
                                ) : (
                                    allRequests.map(request => (
                                        <div key={request.id} className="enrollment-card">
                                            <div className="card-header">
                                                <h3>{request.courseTitle}</h3>
                                                <span className="status" style={{color: getStatusColor(request.status)}}>
                                                    {getStatusText(request.status)}
                                                </span>
                                            </div>
                                            <div className="card-body">
                                                <div className="student-info">
                                                    <strong>Öğrenci:</strong> {request.userFullName} ({request.userName})
                                                </div>
                                                {request.message && (
                                                    <div className="request-message">
                                                        <strong>Mesaj:</strong> {request.message}
                                                    </div>
                                                )}
                                                <div className="request-date">
                                                    <strong>Talep Tarihi:</strong> {formatDate(request.requestedAt)}
                                                </div>
                                                {request.respondedAt && (
                                                    <div className="response-date">
                                                        <strong>Yanıt Tarihi:</strong> {formatDate(request.respondedAt)}
                                                    </div>
                                                )}
                                            </div>
                                            {request.status === 'PENDING' && (
                                                <div className="card-actions">
                                                    <button
                                                        className="approve-btn"
                                                        onClick={() => approveRequest(request.id)}
                                                    >
                                                        Onayla
                                                    </button>
                                                    <button
                                                        className="reject-btn"
                                                        onClick={() => rejectRequest(request.id)}
                                                    >
                                                        Reddet
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Derslerim Sekmesi */}
                        {activeTab === 'courses' && (
                            <div>
                                <div className="section-header">
                                    <h3>Derslerim</h3>
                                    <button
                                        className="add-btn"
                                        onClick={() => setShowCourseForm(true)}
                                    >
                                        + Yeni Ders Oluştur
                                    </button>
                                </div>

                                {/* Ders Düzenleme Formu */}
                                {editingCourse && (
                                    <div className="form-modal">
                                        <div className="form-content">
                                            <h4>Ders Düzenle</h4>
                                            <div className="form-group">
                                                <label>Ders Adı:</label>
                                                <input
                                                    type="text"
                                                    value={courseForm.title}
                                                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                                                    placeholder="Matematik 101"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Açıklama:</label>
                                                <textarea
                                                    value={courseForm.description}
                                                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                                                    placeholder="Ders hakkında açıklama..."
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Sınıflar (Bu dersi hangi sınıflara atamak istersiniz?):</label>
                                                <div style={{ 
                                                    border: '1px solid #ddd', 
                                                    borderRadius: '4px', 
                                                    padding: '10px', 
                                                    maxHeight: '200px', 
                                                    overflowY: 'auto',
                                                    backgroundColor: '#f9f9f9'
                                                }}>
                                                    {classrooms.length === 0 ? (
                                                        <p style={{ color: '#666', fontSize: '14px' }}>Henüz sınıf bulunmamaktadır. Admin panelinden sınıf oluşturabilirsiniz.</p>
                                                    ) : (
                                                        classrooms.map(classroom => (
                                                            <label 
                                                                key={classroom.id} 
                                                                style={{ 
                                                                    display: 'block', 
                                                                    padding: '8px',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '4px',
                                                                    marginBottom: '4px',
                                                                    backgroundColor: courseForm.classroomIds?.includes(classroom.id) ? '#e3f2fd' : 'transparent'
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={courseForm.classroomIds?.includes(classroom.id) || false}
                                                                    onChange={() => handleClassroomToggle(classroom.id)}
                                                                    style={{ marginRight: '8px' }}
                                                                />
                                                                {classroom.name}
                                                                {classroom.description && (
                                                                    <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                                                                        - {classroom.description}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                                {courseForm.classroomIds && courseForm.classroomIds.length > 0 && (
                                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                        {courseForm.classroomIds.length} sınıf seçildi
                                                    </p>
                                                )}
                                            </div>
                                            <div className="form-buttons">
                                                <button onClick={updateCourse}>Kaydet</button>
                                                <button onClick={() => {
                                                    setEditingCourse(null);
                                                    setCourseForm({ title: '', description: '', classroomIds: [] });
                                                }}>İptal</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Ders Oluşturma Formu */}
                                {showCourseForm && (
                                    <div className="form-modal">
                                        <div className="form-content">
                                            <h4>Yeni Ders Oluştur</h4>
                                            <div className="form-group">
                                                <label>Ders Adı:</label>
                                                <input
                                                    type="text"
                                                    value={courseForm.title}
                                                    onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                                                    placeholder="Matematik 101"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Açıklama:</label>
                                                <textarea
                                                    value={courseForm.description}
                                                    onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                                                    placeholder="Ders hakkında açıklama..."
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Sınıflar (Bu dersi hangi sınıflara atamak istersiniz?):</label>
                                                <div style={{ 
                                                    border: '1px solid #ddd', 
                                                    borderRadius: '4px', 
                                                    padding: '10px', 
                                                    maxHeight: '200px', 
                                                    overflowY: 'auto',
                                                    backgroundColor: '#f9f9f9'
                                                }}>
                                                    {classrooms.length === 0 ? (
                                                        <p style={{ color: '#666', fontSize: '14px' }}>Henüz sınıf bulunmamaktadır. Admin panelinden sınıf oluşturabilirsiniz.</p>
                                                    ) : (
                                                        classrooms.map(classroom => (
                                                            <label 
                                                                key={classroom.id} 
                                                                style={{ 
                                                                    display: 'block', 
                                                                    padding: '8px',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '4px',
                                                                    marginBottom: '4px',
                                                                    backgroundColor: courseForm.classroomIds?.includes(classroom.id) ? '#e3f2fd' : 'transparent'
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={courseForm.classroomIds?.includes(classroom.id) || false}
                                                                    onChange={() => handleClassroomToggle(classroom.id)}
                                                                    style={{ marginRight: '8px' }}
                                                                />
                                                                {classroom.name}
                                                                {classroom.description && (
                                                                    <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                                                                        - {classroom.description}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                                {courseForm.classroomIds && courseForm.classroomIds.length > 0 && (
                                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                        {courseForm.classroomIds.length} sınıf seçildi
                                                    </p>
                                                )}
                                            </div>
                                            <div className="form-buttons">
                                                <button onClick={createCourse}>Oluştur</button>
                                                <button onClick={() => setShowCourseForm(false)}>İptal</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Ders Listesi */}
                                <div className="course-grid">
                                    {courses.map(course => (
                                        <div key={course.id} className="course-card">
                                            <h4>{course.title}</h4>
                                            <p>{course.description}</p>
                                            <div className="course-info">
                                                <span>Oluşturma: {formatDate(course.createdAt)}</span>
                                                <span className={`status ${course.active ? 'active' : 'inactive'}`}>
                                                    {course.active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </div>
                                            <div className="course-actions" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                <button
                                                    className="exam-btn"
                                                    onClick={() => {
                                                        setSelectedCourse(course);
                                                        setExamForm({...examForm, courseId: course.id});
                                                        setShowExamForm(true);
                                                    }}
                                                    style={{ flex: 1 }}
                                                >
                                                    Sınav Oluştur
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const newExpanded = expandedCourseResources === course.id ? null : course.id;
                                                        setExpandedCourseResources(newExpanded);
                                                        if (newExpanded) {
                                                            loadCourseResources(course.id);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '5px 10px',
                                                        fontSize: '12px',
                                                        backgroundColor: '#4CAF50',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        flex: 1
                                                    }}
                                                >
                                                    Dokümanlar
                                                </button>
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => {
                                                        loadClassrooms();
                                                        startEditingCourse(course);
                                                    }}
                                                    style={{ 
                                                        padding: '5px 10px', 
                                                        fontSize: '12px', 
                                                        backgroundColor: '#2196F3', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer' 
                                                    }}
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => deleteCourse(course.id)}
                                                    style={{ 
                                                        padding: '5px 10px', 
                                                        fontSize: '12px', 
                                                        backgroundColor: '#f44336', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer' 
                                                    }}
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                            {expandedCourseResources === course.id && (
                                                <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                    <h5>Ders Dokümanları</h5>
                                                    <div style={{ marginBottom: '8px', fontSize: '12px', color: '#555' }}>
                                                        Bu derse kayıtlı öğrenciler bu dokümanları görebilir.
                                                    </div>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Yeni Doküman Yükle:</label>
                                                        <div style={{ marginTop: '5px' }}>
                                                            {/* Basit upload alanı - Upload.jsx'i yeniden kullanmak yerine hafif bir form */}
                                                            <input
                                                                type="file"
                                                                onChange={async (e) => {
                                                                    if (!e.target.files || !e.target.files[0]) return;
                                                                    const file = e.target.files[0];
                                                                    try {
                                                                        const { uploadResource } = await import('../api');
                                                                        await uploadResource(course.id, file, 'DOCUMENT');
                                                                        await loadCourseResources(course.id);
                                                                        setMessage('Doküman başarıyla yüklendi');
                                                                    } catch (error) {
                                                                        console.error('Doküman yükleme hatası:', error);
                                                                        setMessage('Doküman yüklenemedi');
                                                                    } finally {
                                                                        e.target.value = '';
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {(!resourcesByCourse[course.id] || resourcesByCourse[course.id].length === 0) ? (
                                                            <div style={{ fontSize: '13px', color: '#777' }}>
                                                                Bu ders için henüz doküman yok.
                                                            </div>
                                                        ) : (
                                                            <ul style={{ listStyle: 'none', paddingLeft: 0, maxHeight: '150px', overflowY: 'auto' }}>
                                                                {resourcesByCourse[course.id].map(res => (
                                                                    <li key={res.id} style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                        <div>
                                                                            <a
                                                                                href={`http://localhost:8080/api/resources/${res.id}/download`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                style={{ textDecoration: 'none', color: '#1976d2', fontSize: '13px' }}
                                                                            >
                                                                                {res.originalFilename || res.fileName || `Doküman #${res.id}`}
                                                                            </a>
                                                                            <span style={{ marginLeft: '6px', fontSize: '11px', color: '#999' }}>
                                                                                ({res.resourceType || 'MATERIAL'})
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            style={{
                                                                                marginLeft: '8px',
                                                                                padding: '3px 8px',
                                                                                fontSize: '11px',
                                                                                backgroundColor: '#f44336',
                                                                                color: '#fff',
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            onClick={async () => {
                                                                                if (!window.confirm('Bu dokümanı silmek istediğinizden emin misiniz?')) {
                                                                                    return;
                                                                                }
                                                                                try {
                                                                                    const { deleteResource } = await import('../api');
                                                                                    const ok = await deleteResource(res.id);
                                                                                    if (ok) {
                                                                                        setMessage('Doküman silindi');
                                                                                        loadCourseResources(course.id);
                                                                                    } else {
                                                                                        setMessage('Doküman silinemedi');
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Doküman silme hatası:', error);
                                                                                    setMessage('Doküman silinirken hata oluştu');
                                                                                }
                                                                            }}
                                                                        >
                                                                            Sil
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ders Öğrencileri Sekmesi */}
                        {activeTab === 'students' && (
                            <div>
                                <div className="section-header">
                                    <h3>Ders Öğrencileri</h3>
                                </div>
                                <div className="form-row" style={{ alignItems: 'flex-end', gap: '10px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Ders Seçin:</label>
                                        <select
                                            value={selectedCourseForStudents}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedCourseForStudents(val);
                                                if (val) {
                                                    loadCourseStudents(val);
                                                } else {
                                                    setCourseStudents([]);
                                                }
                                            }}
                                        >
                                            <option value="">Ders seçin</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>{course.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        className="add-btn"
                                        style={{ height: '38px' }}
                                        onClick={() => loadCourseStudents(selectedCourseForStudents)}
                                        disabled={!selectedCourseForStudents || loadingCourseStudents}
                                    >
                                        Listele
                                    </button>
                                </div>

                                <div style={{ marginTop: '15px' }}>
                                    {loadingCourseStudents ? (
                                        <div className="loading">Öğrenciler yükleniyor...</div>
                                    ) : courseStudents.length === 0 ? (
                                        <div className="no-requests">Seçilen derse kayıtlı öğrenci bulunamadı</div>
                                    ) : (
                                        <div className="enrollment-list">
                                            {courseStudents.map(student => (
                                                <div key={student.id} className="enrollment-card">
                                                    <div className="card-header">
                                                        <h3>{student.fullName || student.username}</h3>
                                                        <span className="status" style={{color: '#4caf50'}}>Öğrenci</span>
                                                    </div>
                                                    <div className="card-body">
                                                        <div><strong>Kullanıcı adı:</strong> {student.username}</div>
                                                        <div><strong>E-posta:</strong> {student.email || '-'}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sınavlarım Sekmesi */}
                        {activeTab === 'exams' && (
                            <div>
                                <div className="section-header">
                                    <h3>Sınavlarım</h3>
                                    <button
                                        className="add-btn"
                                        onClick={() => setShowExamForm(true)}
                                    >
                                        + Yeni Sınav Oluştur
                                    </button>
                                </div>

                                {/* Ders Seçimi ve Sınav Listesi */}
                                <div className="form-row" style={{ alignItems: 'flex-end', gap: '10px', marginTop: '15px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Ders Seçin:</label>
                                        <select
                                            value={selectedCourseForExams}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSelectedCourseForExams(val);
                                                if (val) {
                                                    fetchExams(val);
                                                } else {
                                                    setExams([]);
                                                }
                                            }}
                                        >
                                            <option value="">Ders seçin</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>{course.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        className="add-btn"
                                        style={{ height: '38px' }}
                                        onClick={() => fetchExams(selectedCourseForExams)}
                                        disabled={!selectedCourseForExams || loadingExams}
                                    >
                                        Listele
                                    </button>
                                </div>

                                {/* Sınav Listesi */}
                                <div style={{ marginTop: '15px' }}>
                                    {loadingExams ? (
                                        <div className="loading">Sınavlar yükleniyor...</div>
                                    ) : exams.length === 0 ? (
                                        <div className="no-requests">
                                            {selectedCourseForExams ? (
                                                <div>
                                                    <div>Bu derse ait sınav bulunamadı</div>
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                        Seçili Ders ID: {selectedCourseForExams}
                                                    </div>
                                                </div>
                                            ) : 'Lütfen bir ders seçin'}
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                                                Toplam {exams.length} sınav bulundu
                                            </div>
                                            <div className="enrollment-list">
                                                {exams.map(exam => {
                                                    console.log('Rendering exam:', exam);
                                                    return (
                                                        <div key={exam.id} className="enrollment-card">
                                                            <div className="card-header">
                                                                <h3>{exam.title || 'Başlıksız Sınav'}</h3>
                                                                <span className="status" style={{color: exam.isActive ? '#4caf50' : '#999'}}>
                                                                    {exam.isActive ? 'Aktif' : 'Pasif'}
                                                                </span>
                                                            </div>
                                                            <div className="card-body">
                                                                <div style={{ fontSize: '11px', color: '#999', marginBottom: '5px' }}>
                                                                    ID: {exam.id} | Course ID: {exam.course?.id || 'null'}
                                                                </div>
                                                                {exam.description && (
                                                                    <div><strong>Açıklama:</strong> {exam.description}</div>
                                                                )}
                                                                {exam.startTime && (
                                                                    <div><strong>Başlangıç:</strong> {new Date(exam.startTime).toLocaleString('tr-TR')}</div>
                                                                )}
                                                                {exam.endTime && (
                                                                    <div><strong>Bitiş:</strong> {new Date(exam.endTime).toLocaleString('tr-TR')}</div>
                                                                )}
                                                                {exam.duration && (
                                                                    <div><strong>Süre:</strong> {exam.duration} dakika</div>
                                                                )}
                                                                <div><strong>Soru Sayısı:</strong> {exam.questions?.length || exam.questionCount || 0}</div>
                                                            </div>
                                                            <div className="card-actions" style={{ marginTop: '10px' }}>
                                                                <button
                                                                    onClick={() => viewExamDetails(exam.id)}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        backgroundColor: '#2196F3',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '14px'
                                                                    }}
                                                                >
                                                                    📋 Detayları Gör
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sınav Oluşturma Formu */}
                                {showExamForm && (
                                    <div className="form-modal">
                                        <div className="form-content">
                                            <h4>Yeni Sınav Oluştur</h4>
                                            <div className="form-group">
                                                <label>Ders:</label>
                                                <select
                                                    value={examForm.courseId}
                                                    onChange={(e) => setExamForm({...examForm, courseId: e.target.value})}
                                                >
                                                    <option value="">Ders Seçin</option>
                                                    {courses.map(course => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.title}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Sınav Adı:</label>
                                                <input
                                                    type="text"
                                                    value={examForm.title}
                                                    onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                                                    placeholder="Matematik Ara Sınav"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Açıklama:</label>
                                                <textarea
                                                    value={examForm.description}
                                                    onChange={(e) => setExamForm({...examForm, description: e.target.value})}
                                                    placeholder="Sınav hakkında açıklama..."
                                                />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Başlangıç Tarihi ve Saati:</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={examForm.startTime}
                                                        onChange={(e) => setExamForm({...examForm, startTime: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Bitiş Tarihi ve Saati:</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={examForm.endTime}
                                                        onChange={(e) => setExamForm({...examForm, endTime: e.target.value})}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                                                <h5>Sorular ({examQuestions.length})</h5>
                                                
                                                {/* Soru Ekleme Formu */}
                                                <div style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '4px', marginBottom: '15px', backgroundColor: '#f9f9f9' }}>
                                                    <div className="form-group">
                                                        <label>Soru Metni:</label>
                                                        <textarea
                                                            value={currentQuestion.text}
                                                            onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                                                            placeholder="Soru metnini giriniz..."
                                                            rows="3"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Soru Tipi:</label>
                                                        <select
                                                            value={currentQuestion.type}
                                                            onChange={(e) => setCurrentQuestion({...currentQuestion, type: e.target.value})}
                                                        >
                                                            <option value="MULTIPLE_CHOICE">Çoktan Seçmeli</option>
                                                            <option value="CLASSIC">Klasik</option>
                                                        </select>
                                                    </div>
                                                    {currentQuestion.type === 'MULTIPLE_CHOICE' ? (
                                                        <>
                                                            <div className="form-group">
                                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Seçenekler (Doğru cevabı işaretleyin):</label>
                                                                {currentQuestion.options.map((opt, idx) => (
                                                                    <div key={idx} style={{ 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        marginBottom: '10px',
                                                                        padding: '8px',
                                                                        backgroundColor: currentQuestion.correctOptionIndex === idx ? '#e8f5e9' : '#fff',
                                                                        border: currentQuestion.correctOptionIndex === idx ? '2px solid #4caf50' : '1px solid #ddd',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        <input
                                                                            type="radio"
                                                                            name="correctOption"
                                                                            checked={currentQuestion.correctOptionIndex === idx}
                                                                            onChange={() => setCurrentQuestion({...currentQuestion, correctOptionIndex: idx})}
                                                                            style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
                                                                        />
                                                                        <span style={{ marginRight: '8px', fontWeight: 'bold', minWidth: '30px' }}>
                                                                            {String.fromCharCode(65 + idx)}:
                                                                        </span>
                                                                        <input
                                                                            type="text"
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const newOptions = [...currentQuestion.options];
                                                                                newOptions[idx] = e.target.value;
                                                                                setCurrentQuestion({...currentQuestion, options: newOptions});
                                                                            }}
                                                                            placeholder={`Seçenek ${idx + 1} metnini giriniz...`}
                                                                            style={{ 
                                                                                flex: 1, 
                                                                                padding: '8px 12px', 
                                                                                border: '1px solid #ccc', 
                                                                                borderRadius: '4px', 
                                                                                fontSize: '14px',
                                                                                backgroundColor: '#fff',
                                                                                minWidth: '200px'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))}
                                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                                    * En az 2 seçenek doldurulmalıdır. Doğru cevabı işaretlemeyi unutmayın.
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="form-group">
                                                            <label>Anahtar Metin (Doğru Cevap):</label>
                                                            <input
                                                                type="text"
                                                                value={currentQuestion.answerKey}
                                                                onChange={(e) => setCurrentQuestion({...currentQuestion, answerKey: e.target.value})}
                                                                placeholder="Kısa anahtar metin giriniz..."
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="form-group">
                                                        <label>Puan:</label>
                                                        <input
                                                            type="number"
                                                            value={currentQuestion.points}
                                                            onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseFloat(e.target.value) || 1.0})}
                                                            min="0.5"
                                                            step="0.5"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={addQuestionToForm}
                                                        style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Soruyu Ekle
                                                    </button>
                                                </div>

                                                {/* Eklenen Sorular Listesi */}
                                                {examQuestions.length > 0 && (
                                                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', padding: '10px', borderRadius: '4px' }}>
                                                        {examQuestions.map((q, idx) => (
                                                            <div key={idx} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <strong>Soru {idx + 1}:</strong> {q.text}
                                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                                            Tip: {q.type === 'MULTIPLE_CHOICE' ? 'Çoktan Seçmeli' : 'Klasik'} | Puan: {q.points}
                                                                        </div>
                                                                        {q.type === 'MULTIPLE_CHOICE' && q.correctOptionIndex !== null && (
                                                                            <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '3px' }}>
                                                                                Doğru Cevap: {q.options[q.correctOptionIndex]}
                                                                            </div>
                                                                        )}
                                                                        {q.type === 'CLASSIC' && q.answerKey && (
                                                                            <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '3px' }}>
                                                                                Anahtar: {q.answerKey}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeQuestion(idx)}
                                                                        style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                                    >
                                                                        Sil
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="form-buttons">
                                                <button onClick={createExam} disabled={examQuestions.length === 0}>Sınavı Oluştur</button>
                                                <button onClick={() => {
                                                    setShowExamForm(false);
                                                    setExamQuestions([]);
                                                    setCurrentQuestion({
                                                        text: '',
                                                        type: 'MULTIPLE_CHOICE',
                                                        options: ['', '', '', ''],
                                                        correctOptionIndex: null,
                                                        answerKey: '',
                                                        points: 1.0
                                                    });
                                                }}>İptal</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sınav Sonuçları Sekmesi */}
                        {activeTab === 'results' && (
                            <div>
                                <div className="section-header">
                                    <h3>Sınav Sonuçları</h3>
                                </div>

                                {loadingExams ? (
                                    <div className="loading">Sınavlar yükleniyor...</div>
                                ) : allExams.length === 0 ? (
                                    <div className="no-requests">Henüz sınav bulunmuyor</div>
                                ) : (
                                    <div className="enrollment-list">
                                        {allExams.map(exam => (
                                            <div key={exam.id} className="enrollment-card">
                                                <div className="card-header">
                                                    <h3>{exam.title}</h3>
                                                    <span className="status" style={{color: exam.isActive ? '#4caf50' : '#999'}}>
                                                        {exam.isActive ? 'Aktif' : 'Pasif'}
                                                    </span>
                                                </div>
                                                <div className="card-body">
                                                    {exam.description && (
                                                        <div><strong>Açıklama:</strong> {exam.description}</div>
                                                    )}
                                                    <div><strong>Ders:</strong> {exam.course?.title || 'Bilinmiyor'}</div>
                                                    {exam.startTime && (
                                                        <div><strong>Başlangıç:</strong> {formatDate(exam.startTime)}</div>
                                                    )}
                                                    {exam.endTime && (
                                                        <div><strong>Bitiş:</strong> {formatDate(exam.endTime)}</div>
                                                    )}
                                                </div>
                                                <div className="card-actions">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedExamForResults(exam);
                                                            fetchExamSubmissions(exam.id);
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#4caf50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        📊 Sonuçları Görüntüle
                                                    </button>
                                                </div>

                                                {/* Seçili sınavın sonuçları */}
                                                {selectedExamForResults?.id === exam.id && (
                                                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                                        <h4>Sınav Sonuçları</h4>
                                                        {loadingSubmissions ? (
                                                            <div className="loading">Sonuçlar yükleniyor...</div>
                                                        ) : examSubmissions.length === 0 ? (
                                                            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                                Bu sınava henüz kimse katılmadı
                                                            </div>
                                                        ) : (
                                                            <div style={{ overflowX: 'auto' }}>
                                                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                                                    <thead>
                                                                        <tr style={{ backgroundColor: '#e0e0e0' }}>
                                                                            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ccc' }}>Öğrenci</th>
                                                                            <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Puan</th>
                                                                            <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Yüzde</th>
                                                                            <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Durum</th>
                                                                            <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>Tarih</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {examSubmissions.map(submission => (
                                                                            <tr key={submission.id}>
                                                                                <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                                                                    {submission.student?.fullName || submission.student?.username || 'Bilinmiyor'}
                                                                                </td>
                                                                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>
                                                                                    {submission.score || 0} / {submission.maxScore || 100}
                                                                                </td>
                                                                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>
                                                                                    <span style={{
                                                                                        fontWeight: 'bold',
                                                                                        color: submission.percentage >= 50 ? '#4caf50' : '#f44336'
                                                                                    }}>
                                                                                        %{submission.percentage?.toFixed(1) || 0}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc' }}>
                                                                                    <span style={{
                                                                                        padding: '4px 12px',
                                                                                        borderRadius: '12px',
                                                                                        fontSize: '12px',
                                                                                        fontWeight: 'bold',
                                                                                        backgroundColor: submission.percentage >= 50 ? '#e8f5e9' : '#ffebee',
                                                                                        color: submission.percentage >= 50 ? '#4caf50' : '#f44336'
                                                                                    }}>
                                                                                        {submission.percentage >= 50 ? 'Geçti' : 'Kaldı'}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ccc', fontSize: '12px' }}>
                                                                                    {formatDate(submission.submittedAt)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
                                                                    <strong>Özet:</strong>
                                                                    <div style={{ marginTop: '5px', fontSize: '14px' }}>
                                                                        Toplam Katılımcı: {examSubmissions.length} |
                                                                        Geçen: {examSubmissions.filter(s => s.percentage >= 50).length} |
                                                                        Kalan: {examSubmissions.filter(s => s.percentage < 50).length} |
                                                                        Ortalama: %{examSubmissions.length > 0
                                                                            ? (examSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / examSubmissions.length).toFixed(1)
                                                                            : 0}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Video Kaynakları Sekmesi */}
                        {activeTab === 'videos' && (
                            <VideoResources userRole="TEACHER" userId={user.id} />
                        )}
                    </div>
                )}
            </div>

            {/* Sınav Detayları Modal */}
            {showExamDetails && selectedExamDetails && (
                <div className="form-modal" onClick={() => setShowExamDetails(false)}>
                    <div className="form-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                            <h3>{selectedExamDetails.title}</h3>
                            <button
                                onClick={() => setShowExamDetails(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕ Kapat
                            </button>
                        </div>

                        {loadingExamDetails ? (
                            <div className="loading">Yükleniyor...</div>
                        ) : (
                            <div>
                                <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>Açıklama:</strong> {selectedExamDetails.description || 'Yok'}
                                    </div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong>Durum:</strong>
                                        <span style={{
                                            marginLeft: '10px',
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            backgroundColor: selectedExamDetails.isActive ? '#e8f5e9' : '#ffebee',
                                            color: selectedExamDetails.isActive ? '#4caf50' : '#f44336',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {selectedExamDetails.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                    {selectedExamDetails.startTime && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong>Başlangıç:</strong> {formatDate(selectedExamDetails.startTime)}
                                        </div>
                                    )}
                                    {selectedExamDetails.endTime && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong>Bitiş:</strong> {formatDate(selectedExamDetails.endTime)}
                                        </div>
                                    )}
                                    {selectedExamDetails.duration && (
                                        <div>
                                            <strong>Süre:</strong> {selectedExamDetails.duration} dakika
                                        </div>
                                    )}
                                </div>

                                <h4 style={{ marginBottom: '15px' }}>Sorular ({examQuestions.length})</h4>

                                {examQuestions.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        Bu sınavda henüz soru bulunmuyor
                                    </div>
                                ) : (
                                    <div>
                                        {examQuestions.map((question, idx) => (
                                            <div key={question.id} style={{
                                                marginBottom: '20px',
                                                padding: '15px',
                                                backgroundColor: 'white',
                                                border: '2px solid #e0e0e0',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <strong style={{ fontSize: '16px' }}>Soru {idx + 1}:</strong>
                                                    <span style={{
                                                        marginLeft: '10px',
                                                        padding: '2px 8px',
                                                        backgroundColor: '#e3f2fd',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {question.type === 'MULTIPLE_CHOICE' ? 'Çoktan Seçmeli' : 'Klasik'}
                                                    </span>
                                                    <span style={{
                                                        marginLeft: '10px',
                                                        padding: '2px 8px',
                                                        backgroundColor: '#fff3e0',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {question.points} Puan
                                                    </span>
                                                </div>
                                                <div style={{ marginBottom: '15px', fontSize: '15px', lineHeight: '1.6' }}>
                                                    {question.text}
                                                </div>

                                                {question.type === 'MULTIPLE_CHOICE' && question.options ? (
                                                    <div>
                                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                                            <strong>Seçenekler:</strong>
                                                        </div>
                                                        {(() => {
                                                            // options'ı array'e çevir
                                                            let optionsArray = question.options;

                                                            // Eğer string ise, || ile ayrılmış olabilir
                                                            if (typeof optionsArray === 'string') {
                                                                // Önce || ile ayrılmış mı kontrol et
                                                                if (optionsArray.includes('||')) {
                                                                    optionsArray = optionsArray.split('||').map(opt => opt.trim()).filter(opt => opt);
                                                                } else {
                                                                    // JSON parse dene
                                                                    try {
                                                                        optionsArray = JSON.parse(optionsArray);
                                                                    } catch (e) {
                                                                        console.error('Options parse hatası:', e, 'Raw value:', optionsArray);
                                                                        // Son çare: virgül ile ayır
                                                                        optionsArray = optionsArray.split(',').map(opt => opt.trim()).filter(opt => opt);
                                                                    }
                                                                }
                                                            }

                                                            // Eğer hala array değilse boş array kullan
                                                            if (!Array.isArray(optionsArray)) {
                                                                console.warn('Options array değil:', optionsArray);
                                                                optionsArray = [];
                                                            }

                                                            return optionsArray.map((option, optIdx) => (
                                                                <div
                                                                    key={optIdx}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        marginBottom: '6px',
                                                                        backgroundColor: question.correctOptionIndex === optIdx ? '#e8f5e9' : '#f5f5f5',
                                                                        border: question.correctOptionIndex === optIdx ? '2px solid #4caf50' : '1px solid #e0e0e0',
                                                                        borderRadius: '6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <span style={{
                                                                        fontWeight: 'bold',
                                                                        marginRight: '10px',
                                                                        minWidth: '25px'
                                                                    }}>
                                                                        {String.fromCharCode(65 + optIdx)})
                                                                    </span>
                                                                    <span>{option}</span>
                                                                    {question.correctOptionIndex === optIdx && (
                                                                        <span style={{
                                                                            marginLeft: 'auto',
                                                                            color: '#4caf50',
                                                                            fontWeight: 'bold',
                                                                            fontSize: '12px'
                                                                        }}>
                                                                            ✓ Doğru Cevap
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                ) : question.type === 'CLASSIC' && question.answerKey ? (
                                                    <div style={{
                                                        padding: '12px',
                                                        backgroundColor: '#e8f5e9',
                                                        borderRadius: '6px',
                                                        border: '1px solid #4caf50'
                                                    }}>
                                                        <strong style={{ color: '#4caf50' }}>Cevap Anahtarı:</strong>
                                                        <div style={{ marginTop: '6px' }}>{question.answerKey}</div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
