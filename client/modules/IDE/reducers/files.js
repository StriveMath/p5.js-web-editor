import objectID from 'bson-objectid';
import * as ActionTypes from '../../../constants';

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
              return Sk.importMainWithBody('<stdin>', false, prog.trim() + '\\nrun()', true);
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

const initialState = () => {
  const a = objectID().toHexString();
  const b = objectID().toHexString();
  const c = objectID().toHexString();
  const r = objectID().toHexString();
  return [
    {
      name: 'root',
      id: r,
      _id: r,
      children: [b, a, c],
      fileType: 'folder',
      content: ''
    },
    {
      name: 'sketch.py',
      content: defaultSketch,
      id: a,
      _id: a,
      isSelectedFile: true,
      fileType: 'file',
      children: [],
      filePath: ''
    },
    {
      name: 'index.html',
      content: defaultHTML,
      id: b,
      _id: b,
      fileType: 'file',
      children: [],
      filePath: ''
    },
    {
      name: 'style.css',
      content: defaultCSS,
      id: c,
      _id: c,
      fileType: 'file',
      children: [],
      filePath: ''
    }
  ];
};

function getAllDescendantIds(state, nodeId) {
  return state
    .find((file) => file.id === nodeId)
    .children.reduce(
      (acc, childId) => [
        ...acc,
        childId,
        ...getAllDescendantIds(state, childId)
      ],
      []
    );
}

function deleteChild(state, parentId, id) {
  const newState = state.map((file) => {
    if (file.id === parentId) {
      const newFile = Object.assign({}, file);
      newFile.children = newFile.children.filter((child) => child !== id);
      return newFile;
    }
    return file;
  });
  return newState;
}

function deleteMany(state, ids) {
  const newState = [...state];
  ids.forEach((id) => {
    let fileIndex;
    newState.find((file, index) => {
      if (file.id === id) {
        fileIndex = index;
      }
      return file.id === id;
    });
    newState.splice(fileIndex, 1);
  });
  return newState;
}

function sortedChildrenId(state, children) {
  const childrenArray = state.filter((file) => children.includes(file.id));
  childrenArray.sort((a, b) => (a.name > b.name ? 1 : -1));
  return childrenArray.map((child) => child.id);
}

function updateParent(state, action) {
  return state.map((file) => {
    if (file.id === action.parentId) {
      const newFile = Object.assign({}, file);
      newFile.children = [...newFile.children, action.id];
      return newFile;
    }
    return file;
  });
}

function renameFile(state, action) {
  return state.map((file) => {
    if (file.id !== action.id) {
      return file;
    }
    return Object.assign({}, file, { name: action.name });
  });
}

function setFilePath(files, fileId, path) {
  const file = files.find((f) => f.id === fileId);
  file.filePath = path;
  // const newPath = `${path}${path.length > 0 ? '/' : ''}${file.name}`;
  const newPath = `${path}/${file.name}`;
  if (file.children.length === 0) return;
  file.children.forEach((childFileId) => {
    setFilePath(files, childFileId, newPath);
  });
}

function setFilePaths(files) {
  const updatedFiles = [...files];
  const rootPath = '';
  const rootFile = files.find((f) => f.name === 'root');
  rootFile.children.forEach((fileId) => {
    setFilePath(updatedFiles, fileId, rootPath);
  });
  return updatedFiles;
}

const files = (state, action) => {
  if (state === undefined) {
    state = initialState(); // eslint-disable-line
  }
  switch (action.type) {
    case ActionTypes.UPDATE_FILE_CONTENT:
      return state.map((file) => {
        if (file.id !== action.id) {
          return file;
        }

        return Object.assign({}, file, { content: action.content });
      });
    case ActionTypes.SET_BLOB_URL:
      return state.map((file) => {
        if (file.id !== action.id) {
          return file;
        }
        return Object.assign({}, file, { blobURL: action.blobURL });
      });
    case ActionTypes.NEW_PROJECT:
      return setFilePaths(action.files);
    case ActionTypes.SET_PROJECT:
      return setFilePaths(action.files);
    case ActionTypes.RESET_PROJECT:
      return initialState();
    case ActionTypes.CREATE_FILE: {
      const parentFile = state.find((file) => file.id === action.parentId);
      // const filePath =
      //   parentFile.name === 'root'
      //     ? ''
      //     : `${parentFile.filePath}${parentFile.filePath.length > 0 ? '/' : ''}
      //     ${parentFile.name}`;
      const filePath =
        parentFile.name === 'root'
          ? ''
          : `${parentFile.filePath}/${parentFile.name}`;
      const newState = [
        ...updateParent(state, action),
        {
          name: action.name,
          id: action.id,
          _id: action._id,
          content: action.content,
          url: action.url,
          children: action.children,
          fileType: action.fileType || 'file',
          filePath
        }
      ];
      return newState.map((file) => {
        if (file.id === action.parentId) {
          file.children = sortedChildrenId(newState, file.children);
        }
        return file;
      });
    }
    case ActionTypes.UPDATE_FILE_NAME: {
      const newState = renameFile(state, action);
      const updatedFile = newState.find((file) => file.id === action.id);
      // const childPath = `${updatedFile.filePath}
      // ${updatedFile.filePath.length > 0 ? '/' : ''}${updatedFile.name}`;
      const childPath = `${updatedFile.filePath}/${updatedFile.name}`;
      updatedFile.children.forEach((childId) => {
        setFilePath(newState, action.id, childPath);
      });
      return newState.map((file) => {
        if (file.children.includes(action.id)) {
          file.children = sortedChildrenId(newState, file.children);
        }
        return file;
      });
    }
    case ActionTypes.DELETE_FILE: {
      const newState = deleteMany(state, [
        action.id,
        ...getAllDescendantIds(state, action.id)
      ]);
      return deleteChild(newState, action.parentId, action.id);
      // const newState = state.map((file) => {
      //   if (file.id === action.parentId) {
      //     const newChildren = file.children.filter(child => child !== action.id);
      //     return { ...file, children: newChildren };
      //   }
      //   return file;
      // });
      // return newState.filter(file => file.id !== action.id);
    }
    case ActionTypes.SET_SELECTED_FILE:
      return state.map((file) => {
        if (file.id === action.selectedFile) {
          return Object.assign({}, file, { isSelectedFile: true });
        }
        return Object.assign({}, file, { isSelectedFile: false });
      });
    case ActionTypes.SHOW_FOLDER_CHILDREN:
      return state.map((file) => {
        if (file.id === action.id) {
          return Object.assign({}, file, { isFolderClosed: false });
        }
        return file;
      });
    case ActionTypes.HIDE_FOLDER_CHILDREN:
      return state.map((file) => {
        if (file.id === action.id) {
          return Object.assign({}, file, { isFolderClosed: true });
        }
        return file;
      });
    default:
      return state.map((file) => {
        file.children = sortedChildrenId(state, file.children);
        return file;
      });
  }
};

export const getHTMLFile = (state) =>
  state.filter((file) => file.name.match(/.*\.html$/i))[0];
export const getJSFiles = (state) =>
  state.filter((file) => file.name.match(/.*\.js$/i));
export const getCSSFiles = (state) =>
  state.filter((file) => file.name.match(/.*\.css$/i));
export const getLinkedFiles = (state) => state.filter((file) => file.url);

export default files;
