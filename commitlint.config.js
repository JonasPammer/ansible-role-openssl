module.exports = {
  extends: [
    "@commitlint/config-conventional", // https://github.com/JonasPammer/JonasPammer/blob/master/demystifying/conventional_commits.adoc
  ],
  rules: {
    "header-max-length": [2, "always", 72 * 2],
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};
