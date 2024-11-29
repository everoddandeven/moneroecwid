import fetch, { Response } from 'node-fetch';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestError {
  error: string;
  code: number;
  body: unknown;
}

type RequestResult<T> = T | RequestError;

const makeRequest = async <T>(
  url: string,
  type: RequestMethod,
  body?: Record<string, unknown>
): Promise<RequestResult<T>> => {
  try {
    const res: Response = await fetch(url, {
      method: type,
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
        'cache-control': 'no-cache',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status !== 200) {
      const errorBody = await res.json();
      console.error('Errore nella risposta:', { status: res.status, body: errorBody });
      return {
        error: 'err',
        code: res.status,
        body: errorBody,
      };
    }

    const result: T = await res.json() as T;
    console.log('Risultato:', result);
    return result;
  } catch (err) {
    console.error('Errore durante la richiesta:', err);
    return {
      error: 'err',
      code: 500,
      body: { message: 'Errore interno del server' },
    };
  }
};

export { makeRequest, RequestMethod, RequestError, RequestResult };
