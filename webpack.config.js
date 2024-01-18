const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'simple-ps.js',
    library: {
      name: "SimplePS",
      type: "umd"
    },
  },
  mode: "development",
};
