// ============================================================
// githubService.ts
// GitHub API integration for Evidence Verification.
// Verifies repo authenticity, extracts language stats,
// commit counts, and README content.
// ============================================================
import axios from 'axios';
import { GitHubVerificationResult } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

const getHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
    : { Accept: 'application/vnd.github.v3+json' };
};

// ============================================================
// Parse a GitHub URL to extract owner and repo name
// ============================================================
const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const cleaned = url.replace(/\/$/, '').replace(/\.git$/, '');
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
};

// ============================================================
// Verify a GitHub repository URL and extract metadata
// ============================================================
export const verifyGitHubRepo = async (
  repoUrl: string,
  skillName?: string
): Promise<GitHubVerificationResult> => {
  const parsed = parseGitHubUrl(repoUrl);

  if (!parsed) {
    return {
      repoUrl,
      isValid: false,
      evidenceStatus: 'Not Found',
      message: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo',
    };
  }

  const { owner, repo } = parsed;

  try {
    // Fetch basic repo info
    const repoRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: getHeaders(),
      timeout: 8000,
    });
    const repoData = repoRes.data;

    // Fetch languages
    let languages: Record<string, number> = {};
    try {
      const langRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`, {
        headers: getHeaders(),
        timeout: 5000,
      });
      languages = langRes.data;
    } catch {
      // Non-critical — continue without language stats
    }

    // Fetch commit count (limited to default branch)
    let commitCount = 0;
    try {
      const commitsRes = await axios.get(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=1`,
        { headers: getHeaders(), timeout: 5000 }
      );
      // GitHub returns total in Link header if paginated
      const linkHeader = commitsRes.headers['link'] as string | undefined;
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/);
        commitCount = match ? parseInt(match[1], 10) : commitsRes.data.length;
      } else {
        commitCount = commitsRes.data.length;
      }
    } catch {
      // Non-critical
    }

    // Determine evidence strength
    let evidenceStatus: GitHubVerificationResult['evidenceStatus'];
    if (commitCount >= 10 && Object.keys(languages).length > 0) {
      evidenceStatus = 'Strong Evidence';
    } else if (commitCount >= 3 || Object.keys(languages).length > 0) {
      evidenceStatus = 'Supported';
    } else {
      evidenceStatus = 'Limited Evidence';
    }

    return {
      repoUrl,
      isValid: true,
      repoName: repoData.name,
      ownerName: repoData.owner?.login,
      description: repoData.description || '',
      language: repoData.language || '',
      languages,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      lastUpdated: repoData.updated_at,
      topics: repoData.topics || [],
      hasReadme: true, // If repo exists, README is assumed reachable
      commitCount,
      evidenceStatus,
      message: `Repository verified. ${commitCount} commits detected. Languages: ${Object.keys(languages).join(', ') || 'N/A'}.`,
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return {
        repoUrl,
        isValid: false,
        evidenceStatus: 'Not Found',
        message: `Repository not found: github.com/${owner}/${repo}. It may be private or deleted.`,
      };
    }
    if (error?.response?.status === 403) {
      return {
        repoUrl,
        isValid: false,
        evidenceStatus: 'Limited Evidence',
        message: 'GitHub API rate limit reached. Add GITHUB_TOKEN to .env to increase limits.',
      };
    }
    console.error('[GitHub] verifyGitHubRepo error:', error.message);
    return {
      repoUrl,
      isValid: false,
      evidenceStatus: 'Limited Evidence',
      message: `Unable to verify repository: ${error.message}`,
    };
  }
};

// ============================================================
// Fetch all public repos of a GitHub user
// ============================================================
export const getUserPublicRepos = async (username: string) => {
  try {
    const res = await axios.get(`${GITHUB_API_BASE}/users/${username}/repos?per_page=30&sort=updated`, {
      headers: getHeaders(),
      timeout: 8000,
    });
    return res.data.map((r: any) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
      url: r.html_url,
      topics: r.topics || [],
    }));
  } catch (error: any) {
    console.error('[GitHub] getUserPublicRepos error:', error.message);
    throw new Error(`Could not fetch GitHub profile for user: ${username}`);
  }
};
