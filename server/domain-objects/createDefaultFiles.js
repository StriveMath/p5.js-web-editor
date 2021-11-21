const defaultSketch = `from p5 import *


def setup():
  createCanvas(400, 400)


def draw():
  background('black')
  drawTickAxes()
`;

const defaultHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="stylesheet" type="text/css" href="style.css">
    <meta charset="utf-8" />
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/p5.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/p5.sound.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/p5.sound.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/math.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/p5.strive.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/skulpt.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/skulpt-stdlib.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/StriveMath/assets@0.0.19/editor/jquery-3.5.1.min.js"></script>
    <script>
      // output functions are configurable.  This one just appends some text
      // to a pre element.
      function outf(text) { 
          console.log(text); 
      }
      
      function builtinRead(x) {
          if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                  throw "File not found: '" + x + "'";
          return Sk.builtinFiles["files"][x];
      }
      
      function uncaught(pythonException) {
          const lineno = pythonException.traceback[0].lineno;
          const msg = pythonException.args.v[0].v;
          const errorMessage = msg + " on line " + lineno;
          console.error(errorMessage);
          throw new Error('');
      }
      
      function runCode() {
        $('#sketch-holder').text('');
        $.get('sketch.py', function (prog) {
          Sk.pre = "output";
          Sk.configure({output:outf, read:builtinRead, uncaughtException:uncaught}); 
          Sk.canvas = "sketch-holder";
          const myPromise = Sk.misceval.asyncToPromise(function() {
              return Sk.importMainWithBody'<stdin>', false, prog.trim() + '\\nrun()', true);
          });
          myPromise.then(function(mod) {
              console.log(' ');
          },
              function(err) {
                  console.log(err.toString());
          });
        }, 'text');
      }
      
      runCode();
    </script>
  </head>
  <body>
    <main>
    </main>
    <pre id="output" style="display: none;"></pre>
    <div id="sketch-holder"></div>
  </body>
</html>
`;

const defaultCSS = `html, body {
  margin: 0;
  padding: 0;
}
canvas {
  display: block;
}
`;

export default function createDefaultFiles() {
  return {
    'index.html': {
      content: defaultHTML
    },
    'style.css': {
      content: defaultCSS
    },
    'sketch.py': {
      content: defaultSketch
    }
  };
}
