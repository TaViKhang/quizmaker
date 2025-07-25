import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles GET requests to /api/users/me/quizzes/results
 * This is a compatibility endpoint that redirects requests to the correct endpoint at /api/users/me/quiz-results
 */
export async function GET(req: NextRequest) {
  // Extract the search params from the request URL
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  
  // Construct the correct API endpoint URL with any existing query parameters
  const redirectUrl = `/api/users/me/quiz-results${params ? `?${params}` : ''}`;
  
  // Return a redirect response
  return NextResponse.redirect(new URL(redirectUrl, req.url));
} 