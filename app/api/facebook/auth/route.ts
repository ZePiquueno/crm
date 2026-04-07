import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.FACEBOOK_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/facebook/callback`;

  const scopes = [
    'public_profile',
    'email',
    'ads_read',
    'ads_management',
  ].join(',');

  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;

  return NextResponse.redirect(fbAuthUrl);
}
