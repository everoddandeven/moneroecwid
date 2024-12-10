import fetch, { Response } from 'node-fetch';

type RequestBody = Record<string, unknown>;

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
  body?: RequestBody,
  authentication?: string
): Promise<RequestResult<T>> => {
  try {
    const headers: { [key: string]: string } = {
      'Content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-cache'
    };

    if (authentication) {
      headers['Authentication'] = authentication;
    }

    const res: Response = await fetch(url, {
      method: type,
      headers: headers,
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

export { makeRequest, RequestMethod, RequestError, RequestResult, RequestBody };
