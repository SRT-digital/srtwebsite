const fs = require('fs');
const src = fs.readFileSync('./js/animation.js', 'utf8');
let out = src;

// Remove block comments
out = out.replace(/\/\*[\s\S]*?\*\//g, '');

// Remove single-line comments (careful to not remove URLs in strings)
out = out.replace(/([^:])\/\/[^\n]*/g, '$1');

// Collapse multiple spaces/tabs to one space
out = out.replace(/[ \t]+/g, ' ');

// Remove newlines after semicolons, braces, commas
out = out.replace(/\n\s*/g, ' ');

// Remove space around certain operators - safe ones only
out = out.replace(/ *\{ */g, '{');
out = out.replace(/ *\} */g, '}');
out = out.replace(/ *; */g, ';');
out = out.replace(/ *, */g, ',');
out = out.replace(/\( /g, '(');
out = out.replace(/ \)/g, ')');
out = out.replace(/\[ /g, '[');
out = out.replace(/ \]/g, ']');

out = out.trim();

const origSize = Buffer.byteLength(src, 'utf8');
const miniSize = Buffer.byteLength(out, 'utf8');
console.log('Original: ' + origSize + ' bytes (' + (origSize/1024).toFixed(1) + ' KB)');
console.log('Minified: ' + miniSize + ' bytes (' + (miniSize/1024).toFixed(1) + ' KB)');
console.log('Reduction: ' + Math.round((1 - miniSize/origSize)*100) + '%');

fs.writeFileSync('./js/animation.min.js', out);
console.log('Written: js/animation.min.js');
