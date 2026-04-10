/**
 * Next.js Instrumentation Hook
 *
 * Wird beim Server-Start geladen. Initialisiert Sentry
 * für Node.js und Edge Runtimes.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = async (
  err: { digest: string } & Error,
  request: {
    path: string
    method: string
    headers: { [key: string]: string }
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderType: 'fetch' | 'render'
    revalidateReason: 'on-demand' | 'stale' | undefined
    serverComponentType: 'page' | 'layout' | 'not-found' | 'error' | undefined
  }
) => {
  const { captureRequestError } = await import('@sentry/nextjs')

  captureRequestError(err, request, context)
}
