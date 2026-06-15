import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

let TARGET_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
if (TARGET_BASE_URL.includes('api.foryou-realestate.co')) {
  TARGET_BASE_URL = 'http://127.0.0.1:3001/api'; // Defensive fallback: force local admin backend
}

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'fyr_7084daf35cf6427f60e06bccd675f133b8a19ce4866cf941156bb4f38fba4016';
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET || '2e9e9a3a8080f207cf1c684baaeff40dcd4404c10f4d2207340bb48ee8ccdccda3f4e2fde5bd74fa4d8f463e361c45c9437206a97abb772415263e3a69655a73';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxy(request, params.path);
}

async function handleProxy(request: NextRequest, path: string[]) {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const fullPath = path.join('/');
  const targetUrl = `${TARGET_BASE_URL}/${fullPath}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const headers: Record<string, string> = {
      'x-api-key': API_KEY,
      'x-api-secret': API_SECRET,
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const method = request.method;
    let body = undefined;
    
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.text();
      } catch (err) {

      }
    }

    console.log(`[PROXY] ${method} ${fullPath} -> ${targetUrl.substring(0, 100)}...`);

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[PROXY-ERROR] ${method} ${fullPath} returned ${response.status}`);
      console.error(`[PROXY-ERROR] Response:`, JSON.stringify(data).substring(0, 200));
    } else {
      console.log(`[PROXY-SUCCESS] ${method} ${fullPath} returned ${response.status}`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error(`[PROXY-CRITICAL-ERROR] ${request.method} ${path.join('/')}:`, error.message);
    return NextResponse.json(
      { success: false, error: 'Proxy failed to connect to backend', details: error.message },
      { status: 500 }
    );
  }
}
