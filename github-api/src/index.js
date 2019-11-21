const Octokit = require('@octokit/rest');
const fs = require('fs');
const { groupBy } = require('lodash');
const { logger } = require('./logger');
const { GithubApiWrapper } = require('./github-api-wrapper');

const run = async (changedFilesPaths, commitMessage) => {
  const content = fs.readFileSync(changedFilesPaths, 'utf8');
  const allFilesPath = content.split('\n');
  logger.info(`allFilesPath: ${allFilesPath}`);

  const filesToUpdate = allFilesPath
    .map((sourceFilePath) => {
      const parts = sourceFilePath.split('/');
      const repoName = parts[0];
      const targetFilepath = sourceFilePath.replace(`${repoName}/`, '');
      return { repoName, sourceFilePath, targetFilepath };
    })
    .filter((d) => d.sourceFilePath !== d.targetFilepath)
    .filter((d) => d.sourceFilePath.toLowerCase().endsWith('*.txt'))
    .filter((d) => d.repoName !== 'vars')
    .filter((d) => d.repoName !== 'github-api');

  if (filesToUpdate.length === 0) {
    logger.info('there are no changed files');
    return;
  }

  logger.info(`filesToUpdate: ${allFilesPath}`);

  const octokit = new Octokit({ auth: process.env.GITHUB_API_TOKEN });
  const githubApiWrapper = new GithubApiWrapper(octokit);

  const repositoriesFilesData = groupBy(filesToUpdate, 'repoName');

  const promises = Object.keys(repositoriesFilesData).map((repositoryName) => {
    const repositoryChangedFiles = repositoriesFilesData[repositoryName];

    const reducer = (accumulator, currentValue) => {
      accumulator[currentValue.targetFilepath] = fs.readFileSync(currentValue.sourceFilePath, 'utf8');
      return accumulator;
    };

    const files = repositoryChangedFiles.reduce(reducer, {});

    return githubApiWrapper.createCommit({
      owner: 'InceptionXR',
      repo: repositoryName,
      changes: { files, commit: commitMessage }
    });
  });

  return await Promise.all(promises);
};

run(process.env.CHANGED_FILES_PATHS_FILE, process.env.COMMIT_MESSAGE);
