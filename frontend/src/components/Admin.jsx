import React, { useState, useEffect } from 'react'
import { setUserRole, getClassroomCourses, getCourseStudents } from '../api'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [view, setView] = useState('users') // users, pending, rejected, classrooms
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showClassroomModal, setShowClassroomModal] = useState(false)
  const [newClassroomName, setNewClassroomName] = useState('')
  const [newClassroomDescription, setNewClassroomDescription] = useState('')
  const [selectedStudentForClassroom, setSelectedStudentForClassroom] = useState(null)
  const [editingClassroom, setEditingClassroom] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editingStudentClassroom, setEditingStudentClassroom] = useState(null)
  const [selectedClassroomForCourses, setSelectedClassroomForCourses] = useState('')
  const [classroomCourses, setClassroomCourses] = useState([])
  const [loadingClassroomCourses, setLoadingClassroomCourses] = useState(false)
  const [courseStudents, setCourseStudents] = useState([])
  const [loadingCourseStudents, setLoadingCourseStudents] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    loadUsers()
    loadClassrooms()
  }, [])

  const testBackendConnection = async () => {
    try {
      setDebugInfo('🔍 Backend bağlantısı test ediliyor...')

      // İlk test: health endpoint'i (daha güvenilir)
      const response = await fetch('http://localhost:8081/actuator/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        const data = await response.json()
        setDebugInfo('✅ Backend health check başarılı: ' + (data.status || 'OK'))
        return true
      }

      // İkinci test: courses/active endpoint'i (authentication gerektirmez)
      const coursesResponse = await fetch('http://localhost:8081/api/courses/active', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      })

      if (coursesResponse.ok || coursesResponse.status === 200) {
        setDebugInfo(`✅ Backend çalışıyor (Active Courses API: ${coursesResponse.status})`)
        return true
      }

      setDebugInfo(`⚠️ Backend yanıt verdi ama status: ${coursesResponse.status}`)
      return false

    } catch (error) {
      setDebugInfo(`❌ Backend bağlantı hatası: ${error.message}`)
      console.error('Backend connection test failed:', error)
      return false
    }
  }

  async function loadUsers() {
    setLoading(true)
    setDebugInfo('')

    // Backend bağlantı testi
    const backendWorking = await testBackendConnection()
    if (!backendWorking) {
      setMessage('Backend sunucusuna bağlanılamıyor. Lütfen backend\'in çalıştığından emin olun.')
      setLoading(false)
      return
    }

    try {
      console.log('Admin: Kullanıcıları yüklemeye çalışıyor...')
      setDebugInfo('Kullanıcılar yükleniyor...')

      // Port numarasını 8081'e değiştir
      const response = await fetch('http://localhost:8081/api/admin/users', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const userData = await response.json()
      console.log('Admin: Kullanıcılar yüklendi:', userData)
      setDebugInfo(`✅ ${userData.length} kullanıcı yüklendi`)

      // Tüm kullanıcıları göster - debug için
      console.log('Admin: Kullanıcı detayları:', userData.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        approved: u.approved
      })))

      setUsers(userData || [])
      setMessage('') // Hata mesajını temizle

    } catch (e) {
      console.error('Admin: Kullanıcı yükleme hatası:', e)
      setMessage('Kullanıcılar yüklenirken hata oluştu: ' + e.message)
      setDebugInfo(`❌ Kullanıcı yükleme hatası: ${e.message}`)
      setUsers([]) // Boş liste göster, hata durumunda da admin paneli çalışsın
    } finally {
      setLoading(false)
    }
  }

  async function changeRole(userId, newRole) {
    try {
      console.log('Admin: Rol değiştiriliyor...', { userId, newRole })
      await setUserRole(userId, newRole)
      setMessage(`Kullanıcı rolü ${newRole} olarak güncellendi ve onaylandı`)
      await loadUsers()
    } catch (e) {
      console.error('Admin: Rol değiştirme hatası:', e)
      setMessage('Rol güncellenirken hata oluştu: ' + e.message)
    }
  }

  async function loadClassrooms() {
    try {
      setDebugInfo('Sınıflar yükleniyor...')
      // Port numarasını 8081'e değiştir
      const response = await fetch('http://localhost:8081/api/admin/classrooms', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        const data = await response.json()
        setClassrooms(data || [])
        setDebugInfo(`✅ ${data.length} sınıf yüklendi`)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Admin: Sınıflar yüklenirken hata:', error)
      setDebugInfo(`❌ Sınıf yükleme hatası: ${error.message}`)
    }
  }

  async function loadClassroomCourses(classroomId) {
    if (!classroomId) {
      setClassroomCourses([])
      setCourseStudents([])
      setSelectedCourseId(null)
      return
    }
    setLoadingClassroomCourses(true)
    try {
      const courses = await getClassroomCourses(classroomId)
      setClassroomCourses(courses || [])
      setCourseStudents([])
      setSelectedCourseId(null)
    } catch (error) {
      console.error('Admin: Sınıf dersleri yüklenemedi:', error)
      setClassroomCourses([])
    } finally {
      setLoadingClassroomCourses(false)
    }
  }

  async function loadCourseStudentsAdmin(course) {
    if (!course || !course.id) {
      setCourseStudents([])
      setSelectedCourseId(null)
      return
    }

    // Toggle: aynı kurs ise kapat
    if (selectedCourseId === course.id) {
      setSelectedCourseId(null)
      setCourseStudents([])
      return
    }

    setSelectedCourseId(course.id)
    setLoadingCourseStudents(true)
    try {
      const students = await getCourseStudents(course.id)
      setCourseStudents(students || [])
    } catch (error) {
      console.error('Admin: Ders öğrencileri yüklenemedi:', error)
      setCourseStudents([])
    } finally {
      setLoadingCourseStudents(false)
    }
  }

  async function createClassroom() {
    try {
      if (!newClassroomName.trim()) {
        setMessage('Sınıf adı zorunludur')
        return
      }

      const response = await fetch('http://localhost:8081/api/admin/classrooms', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newClassroomName,
          description: newClassroomDescription
        }),
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Sınıf başarıyla oluşturuldu')
        setNewClassroomName('')
        setNewClassroomDescription('')
        setShowClassroomModal(false)
        await loadClassrooms()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Sınıf oluşturulamadı')
      }
    } catch (error) {
      console.error('Admin: Sınıf oluşturma hatası:', error)
      setMessage('Sınıf oluşturulurken hata oluştu: ' + error.message)
    }
  }

  async function updateClassroom(classroomId, name, description) {
    try {
      const response = await fetch(`http://localhost:8081/api/admin/classrooms/${classroomId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description }),
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Sınıf başarıyla güncellendi')
        setEditingClassroom(null)
        await loadClassrooms()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Sınıf güncellenemedi')
      }
    } catch (error) {
      console.error('Admin: Sınıf güncelleme hatası:', error)
      setMessage('Sınıf güncellenirken hata oluştu: ' + error.message)
    }
  }

  async function deleteClassroom(classroomId) {
    if (!window.confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8081/api/admin/classrooms/${classroomId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Sınıf başarıyla silindi')
        await loadClassrooms()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Sınıf silinemedi')
      }
    } catch (error) {
      console.error('Admin: Sınıf silme hatası:', error)
      setMessage('Sınıf silinirken hata oluştu: ' + error.message)
    }
  }

  async function updateUser(userId, fullName, username, role) {
    try {
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullName, username, role }),
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Kullanıcı başarıyla güncellendi')
        setEditingUser(null)
        await loadUsers()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Kullanıcı güncellenemedi')
      }
    } catch (error) {
      console.error('Admin: Kullanıcı güncelleme hatası:', error)
      setMessage('Kullanıcı güncellenirken hata oluştu: ' + error.message)
    }
  }

  async function deleteUser(userId) {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Kullanıcı başarıyla silindi')
        await loadUsers()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Kullanıcı silinemedi')
      }
    } catch (error) {
      console.error('Admin: Kullanıcı silme hatası:', error)
      setMessage('Kullanıcı silinirken hata oluştu: ' + error.message)
    }
  }

  async function changeStudentClassroom(userId, classroomId) {
    try {
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}/classroom`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ classroomId }),
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Öğrenci sınıfı başarıyla değiştirildi')
        setEditingStudentClassroom(null)
        await loadUsers()
        await loadClassrooms()
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Sınıf değiştirilemedi')
      }
    } catch (error) {
      console.error('Admin: Sınıf değiştirme hatası:', error)
      setMessage('Sınıf değiştirilirken hata oluştu: ' + error.message)
    }
  }

  async function approveUserAction(userId, classroomId = null) {
    try {
      console.log('Admin: Kullanıcı onaylanıyor...', { userId, classroomId })
      const user = users.find(u => u.id === userId)
      if (!user) return
      
      // Öğrenci ise ve sınıf seçilmişse, sınıf ID'si ile onayla
      let url = `http://localhost:8081/api/admin/users/${userId}/approve`
      if (user.role === 'STUDENT' && classroomId) {
        url += `?classroomId=${classroomId}`
      } else {
        // Kullanıcının mevcut rolünü koruyarak onayla
        await changeRole(userId, user.role)
        setMessage('Kullanıcı başarıyla onaylandı')
        await loadUsers()
        return
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Kullanıcı başarıyla onaylandı ve sınıfa atandı')
        await loadUsers()
        setSelectedStudentForClassroom(null)
      } else {
        setMessage('Kullanıcı onaylanamadı')
      }
    } catch (e) {
      console.error('Admin: Onaylama hatası:', e)
      setMessage('Kullanıcı onaylanırken hata oluştu: ' + e.message)
    }
  }

  async function rejectUser(userId) {
    try {
      console.log('Admin: Kullanıcı reddediliyor...', { userId })
      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Kullanıcı reddedildi')
        await loadUsers()
      } else {
        setMessage('Kullanıcı reddedilemedi')
      }
    } catch (error) {
      console.error('Admin: Reddetme hatası:', error)
      setMessage('Kullanıcı reddedilirken hata oluştu: ' + error.message)
    }
  }


  // Manual olarak kullanıcının onay durumunu değiştirme fonksiyonu
  async function toggleApproval(userId) {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const response = await fetch(`http://localhost:8081/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (response.ok) {
        setMessage('Kullanıcı onay durumu güncellendi')
        await loadUsers()
      } else {
        setMessage('Onay durumu güncellenemedi')
      }
    } catch (error) {
      setMessage('Onay durumu güncelleme hatası: ' + error.message)
    }
  }

  const pendingUsers = users.filter(user => !user.approved && !user.rejected && user.role !== 'ADMIN')
  const rejectedUsers = users.filter(user => user.rejected && user.role !== 'ADMIN')
  // Tüm Kullanıcılar sekmesinde sadece onaylanmış kullanıcıları göster (reddedilenler zaten ayrı sekmede)
  const allUsers = users.filter(user => user.approved && !user.rejected)

  const renderUsersList = () => (
    <div className="users-management">
      <h3>Tüm Kullanıcılar</h3>
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Kullanıcı Adı</th>
                <th>Ad Soyad</th>
                <th>Mevcut Rol</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.fullName}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role === 'ADMIN' ? 'Admin' :
                       user.role === 'TEACHER' ? 'Öğretmen' : 'Öğrenci'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="user-actions">
                      {user.role !== 'ADMIN' && (
                        <>
                          <select
                            value={user.role}
                            onChange={(e) => changeRole(user.id, e.target.value)}
                            style={{ marginRight: '5px' }}
                          >
                            <option value="STUDENT">Öğrenci</option>
                            <option value="TEACHER">Öğretmen</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {user.role === 'STUDENT' && (
                            <button
                              className="edit-btn"
                              onClick={() => setEditingStudentClassroom(user.id)}
                              style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                            >
                              Sınıf Değiştir
                            </button>
                          )}
                          <button
                            className="edit-btn"
                            onClick={() => setEditingUser(user)}
                            style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                          >
                            Düzenle
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteUser(user.id)}
                            style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderRejectedUsers = () => (
    <div className="rejected-users">
      <h3>Reddedilen Kullanıcılar</h3>
      {rejectedUsers.length === 0 ? (
        <p>Reddedilen kullanıcı bulunmamaktadır.</p>
      ) : (
        <div className="pending-users-grid">
          {rejectedUsers.map(user => (
            <div key={user.id} className="pending-user-card rejected">
              <h4>{user.fullName}</h4>
              <p><strong>Kullanıcı Adı:</strong> {user.username}</p>
              <p><strong>Rol:</strong>
                {user.role === 'TEACHER' ? ' Öğretmen' : ' Öğrenci'}
              </p>
              <p><strong>Kayıt Tarihi:</strong> {new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
              <p className="rejected-badge">❌ Reddedildi</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderPendingApprovals = () => (
    <div className="pending-approvals">
      <h3>Onay Bekleyen Kullanıcılar</h3>
      {pendingUsers.length === 0 ? (
        <p>Onay bekleyen kullanıcı bulunmamaktadır.</p>
      ) : (
        <div className="pending-users-grid">
          {pendingUsers.map(user => (
            <div key={user.id} className="pending-user-card">
              <h4>{user.fullName}</h4>
              <p><strong>Kullanıcı Adı:</strong> {user.username}</p>
              <p><strong>Talep Edilen Rol:</strong>
                {user.role === 'TEACHER' ? ' Öğretmen' : ' Öğrenci'}
              </p>
              <p><strong>Kayıt Tarihi:</strong> {new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>

              <div className="approval-actions">
                {user.role === 'STUDENT' ? (
                  <>
                    <select
                      className="classroom-select"
                      value={selectedStudentForClassroom?.id === user.id ? selectedStudentForClassroom?.classroomId || '' : ''}
                      onChange={(e) => {
                        const classroomId = e.target.value ? parseInt(e.target.value) : null
                        setSelectedStudentForClassroom({ id: user.id, classroomId })
                      }}
                    >
                      <option value="">Sınıf Seçin</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="approve-btn"
                      onClick={() => {
                        const selected = selectedStudentForClassroom?.id === user.id ? selectedStudentForClassroom.classroomId : null
                        if (!selected) {
                          setMessage('Lütfen önce bir sınıf seçin')
                          return
                        }
                        approveUserAction(user.id, selected)
                      }}
                      disabled={!selectedStudentForClassroom || selectedStudentForClassroom.id !== user.id || !selectedStudentForClassroom.classroomId}
                    >
                      Onayla
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectUser(user.id)}
                    >
                      Reddet
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="approve-btn"
                      onClick={() => approveUserAction(user.id)}
                    >
                      Onayla
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => rejectUser(user.id)}
                    >
                      Reddet
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderClassrooms = () => (
    <div className="classrooms-management">
      <div className="section-header">
        <h3>Sınıf Yönetimi</h3>
        <button className="add-btn" onClick={() => setShowClassroomModal(true)}>
          Yeni Sınıf Ekle
        </button>
      </div>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="classrooms-grid">
          {classrooms.length === 0 ? (
            <p>Henüz sınıf bulunmamaktadır.</p>
          ) : (
            classrooms.filter(c => c.active !== false).map(classroom => (
              <div key={classroom.id} className="classroom-card">
                <h4>{classroom.name}</h4>
                {classroom.description && <p>{classroom.description}</p>}
                <div className="classroom-info">
                  <span><strong>Öğrenci Sayısı:</strong> {classroom.students?.length || 0}</span>
                  <span><strong>Ders Sayısı:</strong> {classroom.courses?.length || 0}</span>
                </div>
                <div className="classroom-actions" style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                  <button
                    className="view-details-btn"
                    onClick={async () => {
                      try {
                        const response = await fetch(`http://localhost:8081/api/admin/classrooms/${classroom.id}/students`)
                        if (response.ok) {
                          const students = await response.json()
                          alert(`Sınıf: ${classroom.name}\nÖğrenci Sayısı: ${students.length}\nÖğrenciler: ${students.map(s => s.fullName || s.username).join(', ')}`)
                        }
                      } catch (error) {
                        console.error('Öğrenciler alınırken hata:', error)
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    Öğrencileri Görüntüle
                  </button>
                  <button
                    className="view-details-btn"
                    onClick={async () => {
                      try {
                        const response = await fetch(`http://localhost:8081/api/admin/classrooms/${classroom.id}/courses`)
                        if (response.ok) {
                          const courses = await response.json()
                          alert(`Sınıf: ${classroom.name}\nDers Sayısı: ${courses.length}\nDersler: ${courses.map(c => c.title).join(', ') || 'Yok'}`)
                        }
                      } catch (error) {
                        console.error('Dersler alınırken hata:', error)
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    Dersleri Görüntüle
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => setEditingClassroom(classroom)}
                    style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Düzenle
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteClassroom(classroom.id)}
                    style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )

  const renderClassroomCourses = () => (
    <div className="classrooms-management">
      <div className="section-header">
        <h3>Sınıf Ders Listesi</h3>
      </div>
      <div className="form-row" style={{ alignItems: 'flex-end', gap: '10px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Sınıf Seçin:</label>
          <select
            value={selectedClassroomForCourses}
            onChange={(e) => {
              const val = e.target.value
              setSelectedClassroomForCourses(val)
              if (val) {
                loadClassroomCourses(val)
              } else {
                setClassroomCourses([])
              }
            }}
          >
            <option value="">Sınıf seçin</option>
            {classrooms.filter(c => c.active !== false).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          className="add-btn"
          style={{ height: '38px' }}
          onClick={() => loadClassroomCourses(selectedClassroomForCourses)}
          disabled={!selectedClassroomForCourses || loadingClassroomCourses}
        >
          Listele
        </button>
      </div>

      <div style={{ marginTop: '15px' }}>
        {loadingClassroomCourses ? (
          <p>Dersler yükleniyor...</p>
        ) : classroomCourses.length === 0 ? (
          <p>Bu sınıfa ait ders bulunamadı.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-list">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ders</th>
                  <th>Öğretmen</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {classroomCourses.map((course, idx) => (
                  <tr key={course.id}>
                    <td>{idx + 1}</td>
                    <td>{course.title}</td>
                    <td>{course.teacher?.fullName || course.teacher?.username || '-'}</td>
                    <td>{course.active ? 'Aktif' : 'Pasif'}</td>
                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() => loadCourseStudentsAdmin(course)}
                        disabled={loadingCourseStudents}
                      >
                        {selectedCourseId === course.id ? 'Kapat' : 'Öğrencileri Listele'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCourseId && (
        <div style={{ marginTop: '20px' }}>
          <h4>Öğrenci Listesi</h4>
          {loadingCourseStudents ? (
            <p>Öğrenciler yükleniyor...</p>
          ) : courseStudents.length === 0 ? (
            <p>Bu derse kayıtlı öğrenci yok.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table-list">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ad Soyad</th>
                    <th>Kullanıcı</th>
                    <th>E-posta</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStudents.map((s, idx) => (
                    <tr key={s.id}>
                      <td>{idx + 1}</td>
                      <td>{s.fullName || '-'}</td>
                      <td>{s.username}</td>
                      <td>{s.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Paneli</h2>
        <p>Kullanıcı ve sistem yönetimi</p>

        {/* Debug Info - Auth.jsx'teki gibi */}
        {debugInfo && (
          <div style={{
            background: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            margin: '10px 0',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Debug:</strong> {debugInfo}
          </div>
        )}
      </div>

      <nav className="dashboard-nav">
        <button
          className={view === 'users' ? 'active' : ''}
          onClick={() => setView('users')}
        >
          Tüm Kullanıcılar ({allUsers.length})
        </button>
        <button
          className={view === 'pending' ? 'active' : ''}
          onClick={() => setView('pending')}
        >
          Onay Bekleyenler ({pendingUsers.length})
        </button>
        <button
          className={view === 'rejected' ? 'active' : ''}
          onClick={() => setView('rejected')}
        >
          Reddedilenler ({rejectedUsers.length})
        </button>
        <button
          className={view === 'classrooms' ? 'active' : ''}
          onClick={() => setView('classrooms')}
        >
          Sınıflar ({classrooms.filter(c => c.active !== false).length})
        </button>
        <button
          className={view === 'classroomCourses' ? 'active' : ''}
          onClick={() => setView('classroomCourses')}
        >
          Sınıf Dersleri
        </button>
      </nav>

      <div className="dashboard-content">
        {view === 'users' && renderUsersList()}
        {view === 'pending' && renderPendingApprovals()}
        {view === 'rejected' && renderRejectedUsers()}
        {view === 'classrooms' && renderClassrooms()}
        {view === 'classroomCourses' && renderClassroomCourses()}
      </div>

      {message && (
        <div className={`message ${message.includes('güncellendi') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showClassroomModal && (
        <div className="form-modal">
          <div className="form-content">
            <h4>Yeni Sınıf Oluştur</h4>
            <div className="form-group">
              <label>Sınıf Adı *</label>
              <input
                type="text"
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
                placeholder="Örn: 9-A, 10-B"
              />
            </div>
            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                value={newClassroomDescription}
                onChange={(e) => setNewClassroomDescription(e.target.value)}
                placeholder="Sınıf hakkında açıklama (isteğe bağlı)"
                rows="3"
              />
            </div>
            <div className="form-buttons">
              <button onClick={createClassroom}>Oluştur</button>
              <button onClick={() => {
                setShowClassroomModal(false)
                setNewClassroomName('')
                setNewClassroomDescription('')
              }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {editingClassroom && (
        <div className="form-modal">
          <div className="form-content">
            <h4>Sınıf Düzenle</h4>
            <div className="form-group">
              <label>Sınıf Adı *</label>
              <input
                type="text"
                defaultValue={editingClassroom.name}
                id="edit-classroom-name"
                placeholder="Örn: 9-A, 10-B"
              />
            </div>
            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                defaultValue={editingClassroom.description || ''}
                id="edit-classroom-description"
                placeholder="Sınıf hakkında açıklama (isteğe bağlı)"
                rows="3"
              />
            </div>
            <div className="form-buttons">
              <button onClick={() => {
                const name = document.getElementById('edit-classroom-name').value
                const description = document.getElementById('edit-classroom-description').value
                updateClassroom(editingClassroom.id, name, description)
              }}>Kaydet</button>
              <button onClick={() => setEditingClassroom(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="form-modal">
          <div className="form-content">
            <h4>Kullanıcı Düzenle</h4>
            <div className="form-group">
              <label>Ad Soyad</label>
              <input
                type="text"
                defaultValue={editingUser.fullName || ''}
                id="edit-user-fullname"
                placeholder="Ad Soyad"
              />
            </div>
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                defaultValue={editingUser.username}
                id="edit-user-username"
                placeholder="Kullanıcı Adı"
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select id="edit-user-role" defaultValue={editingUser.role}>
                <option value="STUDENT">Öğrenci</option>
                <option value="TEACHER">Öğretmen</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="form-buttons">
              <button onClick={() => {
                const fullName = document.getElementById('edit-user-fullname').value
                const username = document.getElementById('edit-user-username').value
                const role = document.getElementById('edit-user-role').value
                updateUser(editingUser.id, fullName, username, role)
              }}>Kaydet</button>
              <button onClick={() => setEditingUser(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {editingStudentClassroom && (
        <div className="form-modal">
          <div className="form-content">
            <h4>Öğrenci Sınıfını Değiştir</h4>
            <div className="form-group">
              <label>Yeni Sınıf</label>
              <select id="edit-student-classroom">
                <option value="">Sınıf Seçin</option>
                {classrooms.filter(c => c.active !== false).map(classroom => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-buttons">
              <button onClick={() => {
                const classroomId = parseInt(document.getElementById('edit-student-classroom').value)
                if (classroomId) {
                  changeStudentClassroom(editingStudentClassroom, classroomId)
                } else {
                  setMessage('Lütfen bir sınıf seçin')
                }
              }}>Kaydet</button>
              <button onClick={() => setEditingStudentClassroom(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
