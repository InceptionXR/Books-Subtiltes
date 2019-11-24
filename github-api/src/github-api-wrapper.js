class GithubApiWrapper {
  constructor(octokit) {
    this.octokit = octokit;
  }

  async createCommit({ owner, repo, base, changes }) {
    let response;
    if (!base) {
      response = await this.octokit.repos.get({ owner, repo });
      base = response.data.default_branch;
    }

    response = await this.octokit.repos.listCommits({
      owner,
      repo,
      sha: base,
      per_page: 1
    });
    let latestCommitSha = response.data[0].sha;
    const treeSha = response.data[0].commit.tree.sha;

    response = await this.octokit.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree: Object.keys(changes.files).map((path) => {
        return {
          path,
          mode: '100644',
          content: changes.files[path]
        };
      })
    });
    const newTreeSha = response.data.sha;

    response = await this.octokit.git.createCommit({
      owner,
      repo,
      message: changes.commit,
      tree: newTreeSha,
      parents: [latestCommitSha]
    });
    latestCommitSha = response.data.sha;

    await this.octokit.git.updateRef({
      owner,
      repo,
      sha: latestCommitSha,
      ref: `heads/master`,
      force: true
    });
  }
}

module.exports = {
  GithubApiWrapper
};
