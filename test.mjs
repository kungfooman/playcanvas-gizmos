import * as pc from 'playcanvas';
import { RuntimeTransformHandle } from './src/tools/runtimeTransformHandle/runtimeTransformHandle.mjs';
function addGizmo() {
  const gizmo = new RuntimeTransformHandle(app);
  gizmo.orbitCamera.focus(app.root.children[0]);
  gizmo.transformHandle.enabled = true;
  gizmo.orbitCamera.yaw = -60;
  gizmo.orbitCamera.distance = 20;
  gizmo.select([
    cube0,
    cube2,
  ]);
  gizmo.orbitCamera.device = "mouse";
  return gizmo;
}
// create a PlayCanvas application
const canvas = document.getElementById('application');
const mouse = new pc.Mouse(canvas);
const keyboard = new pc.Keyboard(document.body);
const app = new pc.Application(canvas, {
  mouse,
  keyboard,
});
// fill the available space at full resolution
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
// ensure canvas is resized when window changes size
window.addEventListener('resize', () => app.resizeCanvas());
// create box entity
const cube0 = new pc.Entity('cube0');
cube0.addComponent('model', {
  type: 'box',
});
app.root.addChild(cube0);
// create box entity
const cube1 = new pc.Entity('cube1');
cube1.addComponent('model', {
  type: 'box',
});
cube1.translate(0, 1, 0);
app.root.addChild(cube1);
// create box entity
const cube2 = new pc.Entity('cube2');
cube2.addComponent('render', {
  type: 'box',
});
cube2.translate(0, -1, 0);
app.root.addChild(cube2);
// create camera entity
const camera = new pc.Entity('camera');
camera.addComponent('camera', {
  clearColor: new pc.Color(0.1, 0.1, 0.1)
});
app.root.addChild(camera);
camera.setPosition(0, 0, 3);
// create directional light entity
const light = new pc.Entity('light');
light.addComponent('light');
app.root.addChild(light);
light.setEulerAngles(45, 0, 0);
// rotate the box according to the delta time since the last frame
//app.on('update', dt => box.rotate(10 * dt, 20 * dt, 30 * dt));
app.start();
const gizmo = addGizmo();
Object.assign(window, {
  pc,
  app,
  gizmo,
  cube0,
  cube1,
  cube2,
});
