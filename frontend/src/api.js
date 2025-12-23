// Frontend runs on http://localhost:5173; backend on http://localhost:8081
const baseUrl = 'http://localhost:8081'

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

// Authentication API functions
export async function registerUser(userData) {
  try {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    })

    if (!res.ok) {
      const errorData = await res.text()
      throw new Error(`HTTP ${res.status}: ${errorData}`)
    }

    return await res.json()
  } catch (error) {
    console.error('Register API Error:', error)
    return { error: `Kayıt hatası: ${error.message}` }
  }
}

export async function loginUser(credentials) {
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    })

    if (!res.ok) {
      const errorData = await res.text()
      throw new Error(`HTTP ${res.status}: ${errorData}`)
    }

    const data = await res.json()
    if (data.user) {
      // Store user info in localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      localStorage.setItem('auth', btoa(`${credentials.username}:${credentials.password}`))
    }
    return data
  } catch (error) {
    console.error('Login API Error:', error)
    return { error: `Giriş hatası: ${error.message}` }
  }
}

export async function getCurrentUser() {
  const user = localStorage.getItem('currentUser')
  return user ? JSON.parse(user) : null
}

export async function logout() {
  localStorage.removeItem('currentUser')
  localStorage.removeItem('auth')
}

export async function fetchCourses() {
  try {
    console.log('API: Fetching courses...')
    const res = await fetch(`${baseUrl}/api/courses`, {
      headers: { ...getAuthHeader() },
      credentials: 'include'
    })

    console.log('API: fetchCourses response status:', res.status)

    if (!res.ok) {
      console.error('API: fetchCourses failed with status:', res.status)
      return []
    }

    const data = await res.json()
    console.log('API: fetchCourses received data:', data)
    return data
  } catch (error) {
    console.error('API: fetchCourses error:', error)
    return []
  }
}

// Aktif dersleri (auth header ile) çek
export async function fetchActiveCourses() {
  try {
    const res = await fetch(`${baseUrl}/api/courses/active`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    return res.json()
  } catch (error) {
    console.error('fetchActiveCourses error:', error)
    return []
  }
}

// Öğretmenin derslerini auth ile getir
export async function getCoursesByTeacher(teacherId) {
  if (!teacherId) return []
  try {
    const res = await fetch(`${baseUrl}/api/courses/teacher/${teacherId}`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    return res.json()
  } catch (error) {
    console.error('getCoursesByTeacher error:', error)
    return []
  }
}

export async function createCourse(payload) {
  try {
    console.log('API: Creating course with payload:', payload)
    const res = await fetch(`${baseUrl}/api/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
      credentials: 'include'
    })

    console.log('API: createCourse response status:', res.status)

    if (!res.ok) {
      const errorData = await res.text()
      console.error('API: createCourse failed:', errorData)
      throw new Error(`HTTP ${res.status}: ${errorData}`)
    }

    const data = await res.json()
    console.log('API: createCourse received data:', data)
    return data
  } catch (error) {
    console.error('API: createCourse error:', error)
    return { error: error.message }
  }
}

export async function fetchClassrooms() {
  try {
    const res = await fetch(`${baseUrl}/api/admin/classrooms`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('fetchClassrooms error:', error)
    return []
  }
}

export async function uploadResource(courseId, file, type = 'MATERIAL') {
  const fd = new FormData()
  fd.append('file', file)
  const url = new URL(`${baseUrl}/api/resources/upload`)
  if (courseId) url.searchParams.set('courseId', courseId)
  url.searchParams.set('type', type)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: fd,
    credentials: 'include'
  })
  return res.json()
}

export async function getCourseResources(courseId) {
  if (!courseId) return []
  try {
    const res = await fetch(`${baseUrl}/api/resources/course/${courseId}`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!res.ok) {
      console.error('getCourseResources error status:', res.status)
      return []
    }

    return res.json()
  } catch (error) {
    console.error('getCourseResources error:', error)
    return []
  }
}

export async function deleteResource(resourceId) {
  try {
    const res = await fetch(`${baseUrl}/api/resources/${resourceId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    return res.ok
  } catch (error) {
    console.error('deleteResource error:', error)
    return false
  }
}

export async function fetchUsers() {
  try {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('fetchUsers error:', error)
    throw error
  }
}

export async function setUserRole(id, role) {
  try {
    console.log('setUserRole: Sending role update request', { id, role })

    const res = await fetch(`${baseUrl}/api/admin/users/${id}/role?role=${encodeURIComponent(role)}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error('setUserRole: API error response', errorData)
      throw new Error(`HTTP ${res.status}: ${errorData}`)
    }

    const responseData = await res.json()
    console.log('setUserRole: API success response', responseData)
    return responseData
  } catch (error) {
    console.error('setUserRole error:', error)
    throw error
  }
}

export async function approveUser(id) {
  try {
    const res = await fetch(`${baseUrl}/api/admin/users/${id}/approve`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      mode: 'cors'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('approveUser error:', error)
    throw error
  }
}

export function setBasicAuth(username, password) {
  const token = btoa(`${username}:${password}`)
  localStorage.setItem('auth', token)
}

export function clearAuth() {
  localStorage.removeItem('auth')
}

// Exam API functions
export async function createExam(examData) {
  try {
    const res = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(examData),
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('createExam error:', error)
    return { error: error.message }
  }
}

export async function getExamsByCourse(courseId) {
  if (!courseId) {
    console.warn('getExamsByCourse: courseId is null or undefined')
    return []
  }
  try {
    console.log('getExamsByCourse: Fetching exams for courseId:', courseId)
    const url = `${baseUrl}/api/exams/course/${courseId}`
    console.log('getExamsByCourse: URL:', url)
    
    const res = await fetch(url, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    console.log('getExamsByCourse: Response status:', res.status)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('getExamsByCourse: HTTP error', res.status, errorText)
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }

    const data = await res.json()
    console.log('getExamsByCourse: Received data:', data)
    console.log('getExamsByCourse: Number of exams:', data?.length || 0)
    
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('getExamsByCourse error:', error)
    return []
  }
}

export async function getExam(examId) {
  try {
    const res = await fetch(`${baseUrl}/api/exams/${examId}`, {
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('getExam error:', error)
    return null
  }
}

export async function addQuestion(examId, questionData) {
  try {
    const res = await fetch(`${baseUrl}/api/exams/${examId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(questionData),
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('addQuestion error:', error)
    return { error: error.message }
  }
}

export async function deleteQuestion(examId, questionId) {
  try {
    const res = await fetch(`${baseUrl}/api/exams/${examId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    return res.ok
  } catch (error) {
    console.error('deleteQuestion error:', error)
    return false
  }
}

// Exam Submission API functions
export async function submitExam(examId, studentId, answers) {
  try {
    console.log('submitExam: Submitting exam', examId, 'for student', studentId)
    const res = await fetch(`${baseUrl}/api/exam-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        examId,
        studentId,
        answers
      }),
      credentials: 'include'
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || `HTTP ${res.status}`)
    }

    const result = await res.json()
    console.log('submitExam: Success', result)
    return result
  } catch (error) {
    console.error('submitExam error:', error)
    throw error
  }
}

export async function getStudentSubmissions(studentId) {
  try {
    const res = await fetch(`${baseUrl}/api/exam-submissions/student/${studentId}`, {
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getStudentSubmissions error:', error)
    return []
  }
}

export async function getExamSubmissions(examId) {
  try {
    const res = await fetch(`${baseUrl}/api/exam-submissions/exam/${examId}`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getExamSubmissions error:', error)
    return []
  }
}

export async function checkSubmission(examId, studentId) {
  try {
    const res = await fetch(`${baseUrl}/api/exam-submissions/exam/${examId}/student/${studentId}`, {
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('checkSubmission error:', error)
    return { submitted: false }
  }
}

export async function getQuestions(examId) {
  try {
    const res = await fetch(`${baseUrl}/api/exams/${examId}/questions`, {
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getQuestions error:', error)
    return []
  }
}

// Enrollment API functions
export async function requestEnrollment(courseId, message = '') {
  try {
    const res = await fetch(`${baseUrl}/api/enrollments/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        courseId,
        message
      }),
      credentials: 'include'
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(error || `HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('requestEnrollment error:', error)
    return { error: error.message }
  }
}

export async function getMyEnrollmentRequests() {
  try {
    const res = await fetch(`${baseUrl}/api/enrollments/my-requests`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getMyEnrollmentRequests error:', error)
    return []
  }
}

export async function getMyApprovedCourses() {
  try {
    const res = await fetch(`${baseUrl}/api/enrollments/my-courses`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getMyApprovedCourses error:', error)
    return []
  }
}

export async function getCourseStudents(courseId) {
  try {
    const res = await fetch(`${baseUrl}/api/enrollments/course/${courseId}/students`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getCourseStudents error:', error)
    return []
  }
}

// Admin API functions
export async function getClassroomCourses(classroomId) {
  try {
    const res = await fetch(`${baseUrl}/api/admin/classrooms/${classroomId}/courses`, {
      headers: {
        ...getAuthHeader(),
        'Accept': 'application/json'
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('getClassroomCourses error:', error)
    return []
  }
}

export async function createClassroom(classroomData) {
  try {
    const res = await fetch(`${baseUrl}/api/admin/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(classroomData),
      credentials: 'include'
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(error || `HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('createClassroom error:', error)
    return { error: error.message }
  }
}

export async function deleteClassroom(classroomId) {
  try {
    const res = await fetch(`${baseUrl}/api/admin/classrooms/${classroomId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    return res.ok
  } catch (error) {
    console.error('deleteClassroom error:', error)
    return false
  }
}

export async function assignCourseToClassroom(classroomId, courseId) {
  try {
    const res = await fetch(`${baseUrl}/api/admin/classrooms/${classroomId}/courses/${courseId}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('assignCourseToClassroom error:', error)
    return { error: error.message }
  }
}

export async function removeCourseFromClassroom(classroomId, courseId) {
  try {
    const res = await fetch(`${baseUrl}/api/admin/classrooms/${classroomId}/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader()
      },
      credentials: 'include'
    })

    return res.ok
  } catch (error) {
    console.error('removeCourseFromClassroom error:', error)
    return false
  }
}
