'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AuthDebugPage() {
  const { data: session, status } = useSession();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [sessionDetailResponse, setSessionDetailResponse] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState('');

  // Fetch session debug info
  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      setDebugResponse(data);
    } catch (err) {
      setError('Failed to fetch debug info');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed session debug info
  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/debug/session');
      const data = await response.json();
      setSessionDetailResponse(data);
    } catch (err) {
      setError('Failed to fetch session detail');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/quizzes');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      setError('Failed to fetch quizzes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create attempt
  const createAttempt = async () => {
    if (!quizId) {
      setError('Please enter a Quiz ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quizId,
        }),
      });
      
      const data = await response.json();
      setApiResponse(data);
      
      if (!response.ok) {
        setError(`Request failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setError('Error creating attempt');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
    if (status === 'authenticated') {
      fetchQuizzes();
    }
  }, [status]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Session Status: {status}</h2>
        {status === 'authenticated' ? (
          <div>
            <p><strong>User:</strong> {session?.user?.name}</p>
            <p><strong>Email:</strong> {session?.user?.email}</p>
            <p><strong>Role:</strong> {(session?.user as any)?.role || 'Not set'}</p>
            <p><strong>User ID:</strong> {(session?.user as any)?.id || 'Not available'}</p>
          </div>
        ) : status === 'loading' ? (
          <p>Loading session...</p>
        ) : (
          <p className="text-red-600">Not authenticated. Please sign in.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Session Debug</h2>
          <button 
            onClick={fetchDebugInfo}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          >
            Refresh Debug Info
          </button>
          
          {debugResponse ? (
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(debugResponse, null, 2)}
            </pre>
          ) : (
            <p>No debug info available</p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Session Detail Debug</h2>
          <button 
            onClick={fetchSessionDetail}
            className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
          >
            Check Session Details
          </button>
          
          {sessionDetailResponse ? (
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(sessionDetailResponse, null, 2)}
            </pre>
          ) : (
            <p>No session detail available</p>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Available Quizzes</h2>
        <button 
          onClick={fetchQuizzes}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          disabled={status !== 'authenticated'}
        >
          Refresh Quizzes
        </button>
        
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="border p-3 rounded cursor-pointer hover:bg-gray-50"
                onClick={() => setQuizId(quiz.id)}
              >
                <h3 className="font-medium">{quiz.title}</h3>
                <p className="text-sm text-gray-600 truncate">{quiz.description || 'No description'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Questions: {quiz._count.questions} | ID: {quiz.id}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>{loading ? 'Loading quizzes...' : 'No quizzes available'}</p>
        )}
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Test Create Attempt</h2>
        <div className="mb-4">
          <label className="block mb-2">
            Quiz ID (cuid format):
            <input
              type="text"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Enter quiz ID"
            />
          </label>
          
          <button
            onClick={createAttempt}
            disabled={loading || status !== 'authenticated'}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Create Attempt'}
          </button>
        </div>
        
        {error && (
          <div className="text-red-600 mb-4">
            Error: {error}
          </div>
        )}
        
        {apiResponse && (
          <div>
            <h3 className="font-semibold mb-2">API Response:</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 