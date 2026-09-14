import { PaymentServiceError } from './payment-service.ts';
export type PaymentRequestOptions = {
  method?: 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeout?: number;
};

export type PaymentTransportConfig = {
  apiUrl: string;
  tenantId: string;
  branchId?: string;
  defaultTimeoutMs?: number;
};

export type PaymentTransportError = Error & {
  status?: number;
  indeterminate: boolean;
  data?: unknown;
};

export class HttpPaymentTransportError
  extends PaymentServiceError
  implements PaymentTransportError
{
  status?: number;
  indeterminate: boolean;
  data?: unknown;

  constructor(message: string, status?: number, indeterminate = false, data?: unknown) {
    super(message, status, indeterminate);
    this.name = 'HttpPaymentTransportError';
    this.status = status;
    this.indeterminate = indeterminate;
    this.data = data;
  }
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export function readPaymentTransportConfig(
  env: Record<string, string | undefined>,
): PaymentTransportConfig {
  const rawApiUrl = env.VITE_API_URL?.trim();
  const tenantId = env.VITE_TENANT_ID?.trim().toLowerCase();
  const branchId = env.VITE_BRANCH_ID?.trim();

  if (!rawApiUrl)
    throw new Error('VITE_API_URL is required when the production payment adapter is enabled.');
  if (!tenantId || !ID_PATTERN.test(tenantId)) {
    throw new Error('VITE_TENANT_ID must be a 2–64 character lowercase tenant slug.');
  }
  if (branchId && /[\u0000-\u001f\u007f]/.test(branchId)) {
    throw new Error('VITE_BRANCH_ID contains invalid control characters.');
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(rawApiUrl);
  } catch {
    throw new Error('VITE_API_URL must be an absolute URL.');
  }
  if (
    apiUrl.protocol !== 'https:' &&
    !(apiUrl.protocol === 'http:' && isLoopback(apiUrl.hostname))
  ) {
    throw new Error(
      'VITE_API_URL must use HTTPS outside an explicit loopback development environment.',
    );
  }
  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    throw new Error('VITE_API_URL must not contain credentials, query parameters, or a fragment.');
  }

  return {
    apiUrl: apiUrl.href.replace(/\/$/, ''),
    tenantId,
    branchId: branchId || undefined,
    defaultTimeoutMs: 10_000,
  };
}

function isLoopback(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function responseMessage(data: unknown, status: number) {
  if (data && typeof data === 'object') {
    const value = data as { error?: unknown; message?: unknown; i18nTranslationKey?: unknown };
    if (typeof value.error === 'string') return value.error;
    if (value.error && typeof value.error === 'object') {
      const detail = value.error as { message?: unknown; i18nTranslationKey?: unknown };
      if (typeof detail.message === 'string') return detail.message;
      if (typeof detail.i18nTranslationKey === 'string') return detail.i18nTranslationKey;
    }
    if (typeof value.i18nTranslationKey === 'string') return value.i18nTranslationKey;
    if (typeof value.message === 'string') return value.message;
  }
  return `Payment API request failed (${status}).`;
}

async function parseBody(response: Response, mutation: boolean): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpPaymentTransportError(
      'Payment API returned an unsupported response type.',
      response.status,
      mutation && response.ok,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpPaymentTransportError(
      'Payment API returned invalid JSON.',
      response.status,
      mutation && response.ok,
    );
  }
}

/**
 * Credentialed transport for createPaymentService(). Source ApiResponse<T> is T,
 * so successful JSON is returned directly rather than unwrapping a `data` field.
 */
export function createCredentialedPaymentTransport(
  config: PaymentTransportConfig,
  fetchImpl: typeof fetch = fetch,
) {
  const base = config.apiUrl.replace(/\/$/, '');
  return async (path: string, options: PaymentRequestOptions = {}): Promise<unknown> => {
    if (!path.startsWith('/') || path.startsWith('//') || hasDotPathSegment(path)) {
      throw new HttpPaymentTransportError('Payment API paths must be same-origin absolute paths.');
    }
    const method = options.method || 'GET';
    const controller = new AbortController();
    const timeoutMs = options.timeout ?? config.defaultTimeoutMs ?? 10_000;
    const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);
    try {
      const headers = new Headers({ Accept: 'application/json', 'x-tenant-id': config.tenantId });
      if (config.branchId) headers.set('x-branch-id', config.branchId);
      if (options.body !== undefined) headers.set('content-type', 'application/json');
      const response = await fetchImpl(base + path, {
        method,
        headers,
        credentials: 'include',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      const data = await parseBody(response, method !== 'GET');
      if (!response.ok) {
        throw new HttpPaymentTransportError(
          responseMessage(data, response.status),
          response.status,
          false,
          data,
        );
      }
      return data;
    } catch (error) {
      if (error instanceof HttpPaymentTransportError) throw error;
      // A timeout, caller abort, DNS/CORS failure, or connection loss has no HTTP
      // response. For a financial mutation its outcome must be treated as unknown.
      throw new HttpPaymentTransportError('Payment API connection failed.', undefined, true);
    } finally {
      clearTimeout(timer);
    }
  };
}

function hasDotPathSegment(path: string) {
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname.split('/').some((segment) => {
    try {
      const decoded = decodeURIComponent(segment).toLowerCase();
      return decoded === '.' || decoded === '..';
    } catch {
      return true;
    }
  });
}
