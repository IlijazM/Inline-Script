const minify = require('minify');
const fs = require('fs');

const options = {};

minify('./inline-script.js', options)
  .then((res) => {
    fs.writeFileSync('./inline-script.min.js', res);
  })
  .catch(console.error);
