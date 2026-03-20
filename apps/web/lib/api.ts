const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8787';

export async function createNote(ciphertext: string, ttl: number): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/note`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ciphertext, ttl }),
  });

  if (!response.ok) {
    throw new Error('Unable to create note. Please try again.');
  }

  return response.json() as Promise<{ id: string }>;
}

export async function readNote(id: string): Promise<{ ciphertext: string | null }> {
  const response = await fetch(`${API_BASE_URL}/note/${id}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (response.status === 404) {
    return { ciphertext: null };
  }

  if (!response.ok) {
    throw new Error('Unable to load note.');
  }

  return response.json() as Promise<{ ciphertext: string | null }>;
}
