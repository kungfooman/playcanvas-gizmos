# playcanvas-gizmos
### Install

```bash
npm i playcanvas-gizmos
```

### JavaScript / ES6 usage:

```js
// Import all to use extend functions
import * as pc from "playcanvas";
import * as pcGizmos from "playcanvas-gizmos";

let rotation = new pc.Quat();
rotation.setLookRotation(position, target, up);


// Import named
import { DebugLine } from "playcanvas-gizmos";

DebugLine.drawLine(start, end, color);


// use gizmos
import { use, RuntimeTransformHandle } from "playcanvas-gizmos";

// through use api
let runtimeTransformHandle = use(RuntimeTransformHandle, { mainCamera: thisCamera });
// through new instance
let runtimeTransformHandle = new RuntimeTransformHandle({ mainCamera: thisCamera });
```

### Node usage:

```js
// Import all to use extend functions
const pc = require("playcanvas");
const playcanvasGizmos = require("playcanvas-gizmos");

let rotation = new pc.Quat();
rotation.setLookRotation(position, target, up);


// Import named
const { DebugLine } = require("playcanvas-gizmos");

DebugLine.drawLine(start, end, color);


// use ex tools
const { use, RuntimeTransformHandle } = require("playcanvas-gizmos");

// through use api
let runtimeTransformHandle = use(RuntimeTransformHandle, { mainCamera: thisCamera });
// through new instance
let runtimeTransformHandle = new RuntimeTransformHandle({ mainCamera: thisCamera });
```

### Static usage:

Old school method

```html
<script src="./bin/playcanvasGizmos.js"></script>
<script>
	
// use extend functions
let rotation = new pc.Quat();
rotation.setLookRotation(position, target, up);

// use new functions
pc.DebugLine.drawLine(start, end, color);

// use ex tools
let runtimeTransformHandle = new pc.EXTools.RuntimeTransformHandle({ mainCamera: thisCamera });

</script>
```

For static usage, ambient type definitions can optionally be referenced here `node_modules/playcanvas-gizmos/bin/playcanvasGizmos.d.ts`.
### API Docs

API docs can be found [here](https://thefbplus.github.io/playcanvas-gizmos/)

***

### For Developer:

clone repository

```bash
git clone https://github.com/kungfooman/playcanvas-gizmos.git
```

init development environment

```bash
npm run init
```

build project

```bash
npm run build
```

build api docs

```bash
npm run docs
```