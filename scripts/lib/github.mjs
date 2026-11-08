export class HttpError extends Error {
  constructor(status, target, body) {
    super('HTTP ' + status + ' for ' + target + (body ? ' :: ' + body : ''));
    this.name = 'HttpError';
    this.status = status;
  }
}

export class RateLimitError extends Error {
  constructor(message, info) {
    super(message);
    this.name = 'RateLimitError';
    this.info = info || {};
  }
}

export function createClient(options) {
  const opts = options || {};
  const token = opts.token || process.env.GITHUB_TOKEN || '';
  if (!token) throw new Error('GITHUB_TOKEN (or --token) is required');
  const base = opts.baseUrl || 'https://api.github.com';
  const userAgent = opts.userAgent || 'awesome-luotianyi-bot';
  const maxWaitMs = opts.maxWaitMs === undefined ? 90000 : opts.maxWaitMs;
  const verbose = !!opts.verbose;
  const stats = { requests: 0, search: 0, waits: 0, rateLimitHits: 0, readme: 0 };
  const searchStamps = [];
  const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const log = (...args) => {
    if (verbose) console.error('[gh]', ...args);
  };

  async function throttleSearch() {
    for (;;) {
      const now = Date.now();
      while (searchStamps.length && now - searchStamps[0] > 60000) searchStamps.shift();
      if (searchStamps.length < 22) {
        searchStamps.push(Date.now());
        return;
      }
      const wait = 60000 - (now - searchStamps[0]) + 300;
      log('search throttle, waiting', wait, 'ms');
      stats.waits += 1;
      await sleepMs(wait);
    }
  }

  async function request(pathname, init) {
    const cfg = init || {};
    const accept = cfg.accept || 'application/vnd.github+json';
    const method = cfg.method || 'GET';
    const body = cfg.body;
    const allow = cfg.allow || [404, 304];
    const url = pathname.startsWith('http') ? pathname : base + pathname;
    if (url.includes('/search/')) {
      stats.search += 1;
      await throttleSearch();
    }
    let attempt = 0;
    for (;;) {
      attempt += 1;
      const headers = {
        'User-Agent': userAgent,
        Accept: accept,
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer ' + token
      };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      stats.requests += 1;
      const response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      if (response.status === 304) return { status: 304, data: null, headers: response.headers, text: '' };
      if (response.ok) {
        if (cfg.rawText) return { status: response.status, data: text, headers: response.headers, text };
        try {
          return { status: response.status, data: JSON.parse(text), headers: response.headers, text };
        } catch {
          return { status: response.status, data: null, headers: response.headers, text };
        }
      }
      if (allow.includes(response.status)) {
        return { status: response.status, data: null, headers: response.headers, text };
      }
      const retryAfter = response.headers.get('retry-after');
      const remaining = response.headers.get('x-ratelimit-remaining');
      const reset = response.headers.get('x-ratelimit-reset');
      if ((response.status === 403 || response.status === 429) && attempt <= 3) {
        stats.rateLimitHits += 1;
        let waitMs = 0;
        if (retryAfter) waitMs = Number(retryAfter) * 1000 + 1000;
        else if (remaining === '0' && reset) waitMs = Math.max(0, Number(reset) * 1000 - Date.now()) + 2500;
        else if (/secondary rate limit|abuse detection/i.test(text)) waitMs = 65000;
        if (waitMs > 0) {
          if (waitMs > maxWaitMs) {
            throw new RateLimitError('rate limit wait of ' + Math.round(waitMs / 1000) + 's exceeds budget', {
              status: response.status,
              waitMs,
              body: text.slice(0, 200)
            });
          }
          log('rate limited, waiting', waitMs, 'ms');
          stats.waits += 1;
          await sleepMs(waitMs);
          continue;
        }
      }
      throw new HttpError(response.status, method + ' ' + url, text.slice(0, 300));
    }
  }

  const client = {
    stats,
    request,
    async repo(fullName) {
      const res = await request('/repos/' + fullName);
      return res.status === 404 ? null : res.data;
    },
    async orgRepos(org) {
      const res = await request('/orgs/' + org + '/repos?per_page=100&sort=updated');
      return res.status === 404 ? [] : res.data || [];
    },
    async searchRepos(query, page) {
      const res = await request(
        '/search/repositories?per_page=100&page=' + (page || 1) + '&q=' + encodeURIComponent(query)
      );
      return res.data || { total_count: 0, items: [] };
    },
    async searchCommits(query, page) {
      const res = await request(
        '/search/commits?per_page=100&page=' + (page || 1) + '&sort=committer-date&order=asc&q=' + encodeURIComponent(query),
        { accept: 'application/vnd.github.cloak-preview+json' }
      );
      return res.data || { total_count: 0, items: [] };
    },
    async searchIssues(query, page) {
      const res = await request(
        '/search/issues?per_page=100&page=' + (page || 1) + '&sort=created&order=asc&q=' + encodeURIComponent(query)
      );
      return res.data || { total_count: 0, items: [] };
    },
    async readme(fullName) {
      stats.readme += 1;
      const res = await request('/repos/' + fullName + '/readme', { accept: 'application/vnd.github.raw', rawText: true });
      if (res.status !== 200 || !res.data) return '';
      return res.data.length > 400000 ? res.data.slice(0, 400000) : res.data;
    },
    async listIssues(state, labels) {
      const query = '?state=' + (state || 'open') + '&per_page=100' + (labels ? '&labels=' + encodeURIComponent(labels) : '');
      const res = await request('/repos/' + client.repoPath() + '/issues' + query);
      return res.data || [];
    },
    repoPath() {
      if (!opts.repo) throw new Error('client was created without a repo path');
      return opts.repo;
    },
    async createIssue(repoPath, payload) {
      const res = await request('/repos/' + repoPath + '/issues', { method: 'POST', body: payload });
      return res.data;
    },
    async createComment(repoPath, number, body) {
      const res = await request('/repos/' + repoPath + '/issues/' + number + '/comments', { method: 'POST', body: { body } });
      return res.data;
    },
    async updateIssue(repoPath, number, payload) {
      const res = await request('/repos/' + repoPath + '/issues/' + number, { method: 'PATCH', body: payload });
      return res.data;
    },
    async issueComments(repoPath, number) {
      const res = await request('/repos/' + repoPath + '/issues/' + number + '/comments?per_page=100');
      return res.data || [];
    },
    async userPermission(repoPath, login) {
      const res = await request('/repos/' + repoPath + '/collaborators/' + encodeURIComponent(login) + '/permission');
      if (res.status === 404) return 'none';
      return (res.data && res.data.permission) || 'none';
    },
    async addLabels(repoPath, number, labels) {
      const res = await request('/repos/' + repoPath + '/issues/' + number + '/labels', { method: 'POST', body: { labels } });
      return res.data;
    },
    async ensureLabels(repoPath, labels) {
      const res = await request('/repos/' + repoPath + '/labels?per_page=100');
      const existing = new Set((res.data || []).map((label) => label.name));
      const missing = labels.filter((label) => !existing.has(label.name));
      for (const label of missing) {
        await request('/repos/' + repoPath + '/labels', { method: 'POST', body: label });
      }
      return missing.map((label) => label.name);
    },
    async patchRepo(repoPath, payload) {
      const res = await request('/repos/' + repoPath, { method: 'PATCH', body: payload });
      return res.data;
    }
  };

  return client;
}
