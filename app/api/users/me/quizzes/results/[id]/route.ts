import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Handles GET requests to /api/users/me/quizzes/results/[id]
 * This is a compatibility endpoint that redirects requests to the correct endpoint at /api/users/me/quiz-results/[id]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  // Extract any search params from the request URL
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  // Construct the correct API endpoint URL with the ID and any existing query parameters
  const redirectUrl = `/api/users/me/quiz-results/${id}${searchParams ? `?${searchParams}` : ''}`;
  
  // Return a redirect response
  return NextResponse.redirect(new URL(redirectUrl, req.url));
} 