const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const DEFAULT_TIMEOUT = 120000; // 120 seconds

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};

export const api = {
  async indexRepository(repoUrl) {
    return fetchWithTimeout(`${API_BASE_URL}/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl }),
      timeout: 300000 // 5 minutes for indexing
    });
  },

  async getRepos() {
    return fetchWithTimeout(`${API_BASE_URL}/repos`);
  },

  async scanRepo(repoName) {
    return fetchWithTimeout(`${API_BASE_URL}/scan/${encodeURIComponent(repoName)}`);
  },

  async askQuestion(question, repoName) {
    return fetchWithTimeout(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, repo_name: repoName }),
      timeout: 60000 // 60 seconds for AI answers
    });
  },

  async explainRepo(repoName) {
    return fetchWithTimeout(`${API_BASE_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_name: repoName }),
      timeout: 90000 // 90 seconds for generating explanations
    });
  },

  async generateReadme(repoName) {
    return fetchWithTimeout(`${API_BASE_URL}/generate-readme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_name: repoName }),
      timeout: 90000 // 90 seconds for generating readme
    });
  },

  async search(query, repoName) {
    return fetchWithTimeout(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, repo_name: repoName }),
    });
  }
};
