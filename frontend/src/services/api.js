const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';
const DEFAULT_TIMEOUT = 120000; // 120 seconds

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = DEFAULT_TIMEOUT, signal: externalSignal, ...fetchOptions } = options;
  const controller = new AbortController();

  let externalAbortHandler = null;
  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new Error('Request was cancelled.');
    }
    externalAbortHandler = () => controller.abort('cancelled');
    externalSignal.addEventListener('abort', externalAbortHandler);
  }

  let timedOut = false;
  const id = setTimeout(() => {
    timedOut = true;
    controller.abort('timeout');
  }, timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    if (!response.ok) {
      const body = await response.text();
      let errorMessage = response.statusText || `Request failed with status ${response.status}`;
      try {
        const errorData = JSON.parse(body);
        // FastAPI validation errors (422) send detail as a list of {msg, ...}
        const detail = Array.isArray(errorData.detail) ? errorData.detail[0]?.msg : errorData.detail;
        errorMessage = (typeof detail === 'string' && detail) || errorData.error || errorData.message || errorMessage;
      } catch {
        // Non-JSON body (e.g. proxy error page): keep the status text
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError' || controller.signal.aborted) {
      if (timedOut) {
        throw new Error(`Request timed out after ${Math.round(timeout / 1000)}s. The AI provider is under high demand; please retry.`, { cause: error });
      }
      throw new Error('Request was cancelled.', { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(id);
    if (externalSignal && externalAbortHandler) {
      externalSignal.removeEventListener('abort', externalAbortHandler);
    }
  }
};

export const api = {
  async indexRepository(repoUrl, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl }),
      timeout: 300000, // 5 minutes for indexing
      ...options
    });
  },

  async getRepos(options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/repos`, options);
  },

  async scanRepo(repoName, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/scan/${encodeURIComponent(repoName)}`, options);
  },

  async askQuestion(question, repoName, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, repo_name: repoName }),
      timeout: 90000, // 90 seconds for AI answers (backend limit: 60s)
      ...options
    });
  },

  async analyzeRepo(question, repoName, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, repo_name: repoName }),
      timeout: 110000, // 110 seconds for analysis (backend limit: 85s)
      ...options
    });
  },

  async explainRepo(repoName, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_name: repoName }),
      timeout: 110000, // 110 seconds for architecture report (backend limit: 85s)
      ...options
    });
  },

  async generateReadme(repoName, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/generate-readme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_name: repoName }),
      timeout: 110000, // 110 seconds for readme (backend limit: 85s)
      ...options
    });
  },

  async search(query, repoName, options = {}) {
    return fetchWithTimeout(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, repo_name: repoName }),
      ...options
    });
  }
};
