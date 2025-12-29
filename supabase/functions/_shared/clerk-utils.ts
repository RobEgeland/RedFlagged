const PICA_BASE = 'https://api.picaos.com/v1/passthrough';

const ACTION_ID_LIST_USERS = 'conn_mod_def::GCT_3jssiuE::29aDwR0jRu6v1GwufLSEUg';
const ACTION_ID_CREATE_USER = 'conn_mod_def::GCT_4OlUshg::VU_wKTJ7RbCaeYvjHd4Izw';
const ACTION_ID_RETRIEVE_USER = 'conn_mod_def::GCT_31Q-7fo::pym2V-IETdaZ-7BJwSQTSA';

interface PassthroughResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export async function passthroughFetch(
  path: string,
  method: string = 'GET',
  actionId: string,
  body?: any
): Promise<PassthroughResponse> {
  const url = `${PICA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const picaSecret = Deno.env.get('PICA_SECRET_KEY');
  const picaConnectionKey = Deno.env.get('PICA_CLERK_CONNECTION_KEY');

  if (!picaSecret || !picaConnectionKey) {
    throw new Error('Missing Pica environment variables');
  }

  const headers: Record<string, string> = {
    'x-pica-secret': picaSecret,
    'x-pica-connection-key': picaConnectionKey,
    'x-pica-action-id': actionId
  };
  
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = text;
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: json
  };
}

export async function checkConnection() {
  return await passthroughFetch('/users?limit=1', 'GET', ACTION_ID_LIST_USERS);
}

export async function createClerkUser(payload: any) {
  const body = {
    headers: { 'Content-Type': 'application/json' },
    body: payload
  };
  return await passthroughFetch('/users', 'POST', ACTION_ID_CREATE_USER, body);
}

export async function getClerkUser(userId: string) {
  return await passthroughFetch(
    `/users/${encodeURIComponent(userId)}`,
    'GET',
    ACTION_ID_RETRIEVE_USER
  );
}
