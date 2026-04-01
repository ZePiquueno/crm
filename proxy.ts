import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    const validUser = process.env.ADMIN_USER || 'admin'
    const validPass = process.env.ADMIN_PASSWORD || 'admin'

    if (user === validUser && pwd === validPass) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure CRM"',
    },
  })
}

export const config = {
  matcher: ['/((?!api/meta/sync|_next/static|_next/image|favicon.ico).*)'],
}
