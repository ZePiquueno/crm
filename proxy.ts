import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  
  // Rota de sincronização do Meta Ads deve ser SEMPRE aberta para o Cron funcionar
  if (req.nextUrl.pathname.startsWith('/api/meta/sync')) {
    return NextResponse.next()
  }

  if (basicAuth) {
    try {
      const authValue = basicAuth.split(' ')[1]
      const decoded = atob(authValue)
      const [user, pwd] = decoded.split(':')

      // Verificação rigorosa removendo possíveis espaços invisíveis
      const validUser = (process.env.ADMIN_USER || 'admin').trim()
      const validPass = (process.env.ADMIN_PASSWORD || 'admin').trim()

      if (user.trim() === validUser && pwd.trim() === validPass) {
        return NextResponse.next()
      }
      
      console.warn("Falha de autenticação: usuário ou senha incorretos.");
    } catch (e) {
      console.error("Erro no processamento da autenticação:", e);
    }
  }

  // Retorna o cabeçalho de autenticação básica para disparar o pop-up no navegador
  return new NextResponse('Autenticação necessária', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="CRM Seguro"',
      'Cache-Control': 'no-store', // Evita que o navegador cacheie a resposta de erro
    },
  })
}

export const config = {
  // Aplicar em tudo, exceto arquivos estáticos internos do Next.js e favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
