module.exports = {
  branches: ["main"], // release only from main branch
  plugins: [
    "@semantic-release/commit-analyzer",      // figure out patch/minor/major
    "@semantic-release/release-notes-generator", // generate release notes for npm
    "@semantic-release/npm"                    // publish to npm
  ],
};
