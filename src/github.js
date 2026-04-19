import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function getMergedPRs(owner, repo, sinceTag) {
  const prs = [];
  let sinceDate = null;

  if (sinceTag) {
    try {
      const { data: tagRef } = await octokit.git.getRef({
        owner,
        repo,
        ref: `tags/${sinceTag}`
      });

      const sha = tagRef.object.type === 'tag'
        ? (await octokit.git.getTag({ owner, repo, tag_sha: tagRef.object.sha })).data.object.sha
        : tagRef.object.sha;

      const { data: commit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: sha
      });

      sinceDate = commit.committer.date;
    } catch (error) {
      console.warn(`Could not find tag ${sinceTag}, fetching all PRs`);
    }
  }

  let page = 1;
  const perPage = 100;

  while (true) {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'closed',
      sort: 'updated',
      direction: 'desc',
      per_page: perPage,
      page
    });

    if (data.length === 0) break;

    for (const pr of data) {
      if (!pr.merged_at) continue;

      if (sinceDate && new Date(pr.merged_at) <= new Date(sinceDate)) {
        return prs;
      }

      prs.push({
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        author: pr.user?.login || 'unknown',
        labels: pr.labels.map(l => l.name),
        mergedAt: pr.merged_at,
        url: pr.html_url
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return prs;
}

export async function getReleaseByTag(owner, repo, tag) {
  try {
    const { data } = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag
    });
    return data;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function updateRelease(owner, repo, releaseId, body) {
  await octokit.repos.updateRelease({
    owner,
    repo,
    release_id: releaseId,
    body
  });
}

export async function createRelease(owner, repo, tag, body) {
  await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body,
    draft: false,
    prerelease: tag.includes('-')
  });
}

export async function getLatestRelease(owner, repo) {
  try {
    const { data } = await octokit.repos.getLatestRelease({
      owner,
      repo
    });
    return data;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}
