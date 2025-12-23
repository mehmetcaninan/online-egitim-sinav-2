import React, { useState } from 'react'

export default function NetworkDiagnostic() {
  const [results, setResults] = useState([])
  const [testing, setTesting] = useState(false)

  const runDiagnostic = async () => {
    setTesting(true)
    const testResults = []

    // Test 1: Basic connectivity test
    testResults.push(`=== Basic Connectivity Test ===`)

    try {
      // Test raw HTTP connection to backend
      const rawResponse = await fetch('http://localhost:8081', {
        method: 'GET',
        mode: 'cors'
      })
      testResults.push(`✅ Raw HTTP connection successful`)
    } catch (error) {
      testResults.push(`❌ Raw HTTP connection failed: ${error.message}`)
    }

    // Test 2: Try different request methods and headers
    testResults.push(`\n=== API Endpoint Testing ===`)

    const testConfigs = [
      {
        name: 'Simple GET to /api/courses',
        url: 'http://localhost:8081/api/courses',
        options: { method: 'GET' }
      },
      {
        name: 'GET with CORS headers to /api/courses',
        url: 'http://localhost:8081/api/courses',
        options: {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        }
      },
      {
        name: 'OPTIONS preflight to /api/courses',
        url: 'http://localhost:8081/api/courses',
        options: {
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'GET'
          }
        }
      }
    ]

    for (const config of testConfigs) {
      try {
        const response = await fetch(config.url, config.options)
        testResults.push(`✅ ${config.name}: ${response.status} ${response.statusText}`)

        // Try to read response headers
        const corsHeaders = response.headers.get('Access-Control-Allow-Origin')
        if (corsHeaders) {
          testResults.push(`   → CORS Headers: ${corsHeaders}`)
        }
      } catch (error) {
        testResults.push(`❌ ${config.name}: ${error.name} - ${error.message}`)
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Test 3: Alternative localhost addresses
    testResults.push(`\n=== Alternative Host Testing ===`)

    const altHosts = ['localhost', '127.0.0.1']

    for (const host of altHosts) {
      try {
        const response = await fetch(`http://${host}:8081/api/courses`, {
          method: 'GET',
          mode: 'cors'
        })
        testResults.push(`✅ ${host}:8081 - ${response.status}`)
      } catch (error) {
        testResults.push(`❌ ${host}:8081 - ${error.message}`)
      }
    }

    // Test 4: Backend service detection
    testResults.push(`\n=== Backend Service Detection ===`)

    // Try common Spring Boot endpoints
    const springEndpoints = [
      '/actuator/health',
      '/actuator/info',
      '/h2-console',
      '/error',
      '/api'
    ]

    for (const endpoint of springEndpoints) {
      try {
        const response = await fetch(`http://localhost:8081${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa('admin:admin123')
          }
        })
        testResults.push(`✅ ${endpoint}: ${response.status}`)

        if (endpoint === '/actuator/health' && response.ok) {
          try {
            const data = await response.json()
            testResults.push(`   → Health Status: ${data.status}`)
          } catch (e) {
            testResults.push(`   → Health endpoint accessible but not JSON`)
          }
        }
      } catch (error) {
        testResults.push(`❌ ${endpoint}: ${error.message}`)
      }
    }

    // Test 5: Network debugging
    testResults.push(`\n=== Network Environment ===`)
    testResults.push(`Frontend Origin: ${window.location.origin}`)
    testResults.push(`Target Backend: http://localhost:8081`)
    testResults.push(`Browser: ${navigator.userAgent.split(' ')[0]} ${navigator.userAgent.split(' ')[1]}`)
    testResults.push(`Platform: ${navigator.platform}`)

    // Test 6: Final diagnosis
    testResults.push(`\n=== Final Diagnosis ===`)

    const hasSuccessfulConnection = testResults.some(line =>
      line.includes('✅') && (line.includes('200') || line.includes('401') || line.includes('403'))
    )

    if (hasSuccessfulConnection) {
      testResults.push(`✅ VERDICT: Backend is accessible`)
      testResults.push(`🔧 ISSUE: API endpoints may be misconfigured`)
      testResults.push(`💡 SOLUTION: Check backend logs and restart`)
    } else {
      testResults.push(`❌ VERDICT: Backend API is not accessible`)
      testResults.push(`🔧 ISSUE: Backend not running OR major connectivity issue`)
      testResults.push(`💡 SOLUTION: Restart backend immediately`)
    }

    testResults.push(`\n📋 Next Steps:`)
    testResults.push(`1. Stop current backend (Ctrl+C)`)
    testResults.push(`2. Run: ./mvnw spring-boot:run`)
    testResults.push(`3. Wait for "Started OnlineEgitimSinavKodApplication"`)
    testResults.push(`4. Test again`)

    setResults(testResults)
    setTesting(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      left: '10px',
      background: 'white',
      padding: '15px',
      border: '2px solid #007bff',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '500px',
      maxHeight: '400px',
      overflowY: 'auto',
      zIndex: 1001,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Network Diagnostic Tool</h3>

      <button
        onClick={runDiagnostic}
        disabled={testing}
        style={{
          padding: '8px 16px',
          background: testing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '15px'
        }}
      >
        {testing ? 'Testing...' : 'Run Full Diagnostic'}
      </button>

      {results.length > 0 && (
        <div style={{
          background: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '11px',
          whiteSpace: 'pre-wrap'
        }}>
          {results.map((line, index) => (
            <div key={index} style={{
              color: line.includes('✅') ? 'green' :
                    line.includes('❌') ? 'red' :
                    line.includes('⚠️') ? 'orange' : 'black'
            }}>
              {line}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
        <strong>Instructions:</strong>
        <br />1. Click "Run Full Diagnostic"
        <br />2. Check which tests pass/fail
        <br />3. If all fail, backend is not running
        <br />4. If some pass, there might be a CORS issue
      </div>
    </div>
  )
}
