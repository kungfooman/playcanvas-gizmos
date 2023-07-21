/**
 * 创建者: FBplus
 * 创建时间: 2022-06-07 17:03:58
 * 修改者: FBplus
 * 修改时间: 2022-08-09 14:02:01
 * 详情: 观测相机
 */
import * as pc from "playcanvas";
/**
 * 可用输入设备
 * @typedef {("mouse"|"touchScreen")} AvailableDevices
 */
/**
 * 可用输入监听器
 * @typedef {(OrbitCameraInput_Mouse | OrbitCameraInput_TouchScreen)} AvailableInputHandler
 */
/**
 * 观测相机选项
 * @typedef {Object} OrbitCameraOptions
 * @property {pc.CameraComponent} [mainCamera]
 * @property {AvailableDevices} [device]
 * @property {number} [orbitSensitivity]
 * @property {number} [distanceSensitivity]
 * @property {number} [inertiaFactor]
 * @property {number} [pitchMin]
 * @property {number} [pitchMax]
 * @property {number} [distanceMin]
 * @property {number} [distanceMax]
 * @property {() => boolean} [rotateCondition]
 * @property {() => boolean} [distanceCondition]
 * @property {() => boolean} [panCondition]
 * @property {() => boolean} [lookCondition]
 */
/**
 * 观测相机操作选项
 * @typedef {Object} OrbitCameraInputOption
 * @property {OrbitCamera} orbitCamera
 * @property {number} [orbitSensitivity]
 * @property {number} [distanceSensitivity]
 */
export class OrbitCamera {
    // 默认选项
    /** @type {OrbitCameraOptions} */
    toolOptionsDefault = {
        mainCamera: this.app.systems.camera.cameras[0],
        device: this.app.touch ? "touchScreen" : "mouse",
        orbitSensitivity: 0.25,
        distanceSensitivity: 1.5,
        inertiaFactor: 0,
        pitchMin: -90,
        pitchMax: 90,
        distanceMin: -Infinity,
        distanceMax: Infinity,
        rotateCondition: null,
        distanceCondition: null,
        panCondition: null,
        lookCondition: null,
    }
    get app() {
        return pc.Application.getApplication();
    }
    /** @type {boolean} */ isRotating;
    /** @type {boolean} */ isPaning;
    /** @type {boolean} */ isLooking;
    /** @type {number} */ _yaw;
    /** @type {number} */ targetYaw;
    /** @type {number} */ _pitch;
    /** @type {number} */ targetPitch;
    /** @type {number} */ _distance;
    /** @type {number} */ targetDistance;
    /** @type {AvailableInputHandler} */ inputHandler;
    /** @type {pc.Vec3} */ _pivotPoint;
    /** @type {pc.Vec3} */ cameraForward;
    /** @type {pc.Quat} */ yawOffset;
    /** @type {pc.Quat} */ quatWithoutYaw;
    /** @type {pc.BoundingBox} */ modelsAABB;
    /**
     * 创建观测相机
     * @param {OrbitCameraOptions} [options] 观测相机选项
     */
    constructor(options) {
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        this._pivotPoint = new pc.Vec3();
        this.yawOffset = new pc.Quat();
        this.quatWithoutYaw = new pc.Quat();
        this.modelsAABB = new pc.BoundingBox();
        this.cameraForward = new pc.Vec3();
        const cameraQuat = this.toolOptions.mainCamera.entity.getRotation();
        this._yaw = this.calcYaw(cameraQuat);
        this._pitch = this.calcPitch(cameraQuat, this._yaw);
        this.toolOptions.mainCamera.entity.setLocalEulerAngles(this._pitch, this._yaw, 0);
        this.targetYaw = this._yaw;
        this.targetPitch = this._pitch;
        this.targetDistance = this._distance = this.toolOptions.mainCamera.entity.getPosition().length();
        this.checkAspectRatio();
        if (this.toolOptions.device === 'mouse') {
            this.addMouse();
        } else if (this.toolOptions.device === 'touchScreen') {
            this.addTouchScreen();
        } else {
            console.warn("OrbitCamera> no device specified", this);
        }
        this.onEnable();
    }
    /**
     * 航向角
     * @type {number}
     */
    get yaw() {
        return this.targetYaw;
    }
    set yaw(value) {
        this.targetYaw = value;
        var diff = this.targetYaw - this._yaw;
        var reminder = diff % 360;
        if (reminder > 180) {
            this.targetYaw = this._yaw - (360 - reminder);
        } else if (reminder < -180) {
            this.targetYaw = this._yaw + (360 + reminder);
        } else {
            this.targetYaw = this._yaw + reminder;
        }
    }
    /**
     * 俯视角
     */
    get pitch() // todo number
    {
        return this.targetPitch;
    }
    set pitch(value/*: number*/)
    {
        this.targetPitch = pc.math.clamp(value, this.toolOptions.pitchMin, this.toolOptions.pitchMax);
    }
    /**
     * 离焦点的距离
     */
    get distance() // todo number
    {
        return this.targetDistance;
    }
    set distance(value/*: number*/)
    {
        this.targetDistance = pc.math.clamp(value, this.toolOptions.distanceMin, this.toolOptions.distanceMax);
    }
    /**
     * 焦点坐标
     */
    get pivotPoint() // todo pc.Vec3
    {
        return this._pivotPoint;
    }
    set pivotPoint(value/*: pc.Vec3*/)
    {
        this._pivotPoint.copy(value);
    }
    addMouse() {
        if (this.inputHandler) {
            console.warn("Already got this.inputHandler");
            return false;
        }
        this.inputHandler = new OrbitCameraInput_Mouse({
            orbitCamera: this,
            orbitSensitivity: this.toolOptions.orbitSensitivity,
            distanceSensitivity: this.toolOptions.distanceSensitivity
        });
    }
    addTouchScreen() {
        if (this.inputHandler) {
            console.warn("Already got this.inputHandler");
            return false;
        }
        this.inputHandler = new OrbitCameraInput_TouchScreen({
            orbitCamera: this,
            orbitSensitivity: this.toolOptions.orbitSensitivity,
            distanceSensitivity: this.toolOptions.distanceSensitivity
        });
    }
    /**
     * 聚焦
     * @param {pc.Entity | pc.Entity[]} entity 聚焦物体
     */
    focus(entity) {
        this.buildAABB(entity, 0);
        var halfExtents = this.modelsAABB.halfExtents;
        var distance = Math.max(halfExtents.x, Math.max(halfExtents.y, halfExtents.z));
        distance = (distance / Math.tan(0.5 * this.toolOptions.mainCamera.fov * pc.math.DEG_TO_RAD));
        distance = (distance * 2);
        this.targetDistance = distance;
        this.removeInertia();
        this.pivotPoint.copy(this.modelsAABB.center);
    }
    /**
     * 结束目标缓动
     */
    stopInertia() {
        this.targetYaw = this._yaw;
        this.targetPitch = this._pitch;
        this.targetDistance = this._distance;
    }
    /**
     * 更新相机
     * @param {number} dt 帧间隔
     */
    update(dt) {
        const t = this.toolOptions.inertiaFactor === 0 ? 1 : Math.min(dt / this.toolOptions.inertiaFactor, 1);
        this._distance = pc.math.lerp(this._distance, this.targetDistance, t);
        this._yaw = pc.math.lerp(this._yaw, this.targetYaw, t);
        this._pitch = pc.math.lerp(this._pitch, this.targetPitch, t);
        this.updatePosition();
    }
    /**
     * 更新相机位置
     */
    updatePosition() {
        const cameraEntity = this.toolOptions.mainCamera.entity;
        cameraEntity.setLocalEulerAngles(this._pitch, this._yaw, 0);
        const position = cameraEntity.getPosition();
        if (this.isLooking) {
            this.pivotPoint.add2(position, this.cameraForward.copy(cameraEntity.forward).mulScalar(this._distance));
        }
        position.copy(cameraEntity.forward);
        position.mulScalar(-this._distance);
        position.add(this.pivotPoint);
        cameraEntity.setPosition(position);
    }
    /**
     * 根据宽高设置fov模式
     */
    checkAspectRatio() {
        var height = this.app.graphicsDevice.height;
        var width = this.app.graphicsDevice.width;
        this.toolOptions.mainCamera.horizontalFov = height > width;
    }
    /**
     * 清除缓动
     */
    removeInertia() {
        this._yaw = this.targetYaw;
        this._pitch = this.targetPitch;
        this._distance = this.targetDistance;
    }
    /**
     * 构建AABB
     * @param {(pc.Entity | pc.GraphNode) | (pc.Entity | pc.GraphNode)[]} entity 选中模型
     * @param {number} modelsAdded 已添加模型数量
     * @returns {number} 模型添加的数量
     */
    buildAABB(entity, modelsAdded) {
        let i = 0, j = 0;
        /** @type {pc.MeshInstance[]} */
        let meshInstances;
        if (Array.isArray(entity)) {
            entity.forEach(e =>
            {
                modelsAdded += this.buildAABB(e, modelsAdded);
            });
            return;
        }
        if (entity instanceof pc.Entity) {
            const allMeshInstances = [];
            const renders = entity.findComponents("render") /*as pc.RenderComponent[]*/;
            for (i = 0; i < renders.length; ++i) {
                meshInstances = renders[i].meshInstances;
                for (j = 0; j < meshInstances.length; j++) {
                    allMeshInstances.push(meshInstances[j]);
                }
            }
            const models = entity.findComponents("model") /*as pc.ModelComponent[]*/;
            for (i = 0; i < models.length; ++i) {
                meshInstances = models[i].meshInstances;
                for (j = 0; j < meshInstances.length; j++) {
                    allMeshInstances.push(meshInstances[j]);
                }
            }
            for (i = 0; i < allMeshInstances.length; i++) {
                if (modelsAdded === 0) {
                    this.modelsAABB.copy(allMeshInstances[i].aabb);
                } else {
                    this.modelsAABB.add(allMeshInstances[i].aabb);
                }
                modelsAdded += 1;
            }
        }
        for (i = 0; i < entity.children.length; ++i) {
            modelsAdded += this.buildAABB(entity.children[i], modelsAdded);
        }
        return modelsAdded;
    }
    /**
     * 根据旋转获得航向角
     * @param {pc.Quat} quat 旋转
     * @returns {number} 航向角
     */
    calcYaw(quat) {
        const transformedForward = new pc.Vec3();
        quat.transformVector(pc.Vec3.FORWARD, transformedForward);
        return Math.atan2(-transformedForward.x, -transformedForward.z) * pc.math.RAD_TO_DEG;
    }
    /**
     * 根据旋转和航向角获得俯视角
     * @param {pc.Quat} quat 旋转
     * @param {number} yaw 航向角
     * @returns {number} 俯视角
     */
    calcPitch(quat, yaw) {
        const quatWithoutYaw = this.quatWithoutYaw;
        const yawOffset = this.yawOffset;
        yawOffset.setFromEulerAngles(0, -yaw, 0);
        quatWithoutYaw.mul2(yawOffset, quat);
        const transformedForward = new pc.Vec3();
        quatWithoutYaw.transformVector(pc.Vec3.FORWARD, transformedForward);
        return Math.atan2(transformedForward.y, -transformedForward.z) * pc.math.RAD_TO_DEG;
    }
    onEnable() {
        if (this.device === "mouse") {
            this.inputHandler = new OrbitCameraInput_Mouse({
                orbitCamera: this,
                orbitSensitivity: this.toolOptions.orbitSensitivity,
                distanceSensitivity: this.toolOptions.distanceSensitivity
            });
        }
        else if (this.device === "touchScreen") {
            this.inputHandler = new OrbitCameraInput_TouchScreen({
                orbitCamera: this,
                orbitSensitivity: this.toolOptions.orbitSensitivity,
                distanceSensitivity: this.toolOptions.distanceSensitivity
            });
        }
        window.addEventListener("resize", this.checkAspectRatio.bind(this));
        this.app.on("update", this.update, this); // 开始刷新
        this.app.mouse.disableContextMenu(); // 禁止右键菜单
    }
    onDisable() {
        this.inputHandler?.onDisable();
        window.removeEventListener("resize", this.checkAspectRatio.bind(this));
        this.app.off("update", this.update, this); // 停止刷新
        this.app.mouse.enableContextMenu();  // 恢复右键菜单
    }
}
/**
 * 观测相机鼠标输入
 */
export class OrbitCameraInput_Mouse {
    // 默认选项
    /** @type {OrbitCameraInputOption} */
    toolOptionsDefault = {
        orbitCamera: null,
        orbitSensitivity: 0.25,
        distanceSensitivity: 1.5
    };
    isRotateButtonDown = false;
    isLookButtonDown = false;
    isPanButtonDown = false;
    fromWorldPoint = new pc.Vec3();
    toWorldPoint = new pc.Vec3();
    worldDiff = new pc.Vec3();
    lastPoint = new pc.Vec2();
    /**
     * @param {OrbitCameraInputOption} options 
     */
    constructor(options) {
        this.toolOptions = {
            ...this.toolOptionsDefault,
            ...options,
        };
        if (!this.app.mouse) {
            console.error("鼠标设备不存在，请更改输入设备");
            return;
        }
        this.onEnable();
    }
    get app() {
        return pc.Application.getApplication();
    }
    /**
     * 鼠标按下事件监听
     * @param {globalThis.MouseEvent} event 鼠标按下事件
     */
    onMouseDown(event) {
        const { orbitCamera } = this.toolOptions;
        const orbitCameraOptions = orbitCamera.toolOptions;
        switch (event.button) {
            case pc.MOUSEBUTTON_LEFT:
                if (!orbitCameraOptions.rotateCondition || orbitCameraOptions.rotateCondition()) {
                    orbitCamera.isRotating = true;
                    this.isRotateButtonDown = true;
                }
                break;
            case pc.MOUSEBUTTON_MIDDLE:
                if (!orbitCameraOptions.panCondition || orbitCameraOptions.panCondition()) {
                    orbitCamera.isPaning = true;
                    this.isPanButtonDown = true;
                }
                break;
            case pc.MOUSEBUTTON_RIGHT:
                if (!orbitCameraOptions.lookCondition || orbitCameraOptions.lookCondition()) {
                    this.isLookButtonDown = true;
                    orbitCamera.isLooking = true;
                }
                break;
        }
    }
    /**
     * 鼠标移动事件监听
     * @param {MouseEvent} event 鼠标移动事件
     */
    onMouseMove(event) {
        const dx = event.x - this.lastPoint.x;
        const dy = event.y - this.lastPoint.y;
        if (this.isRotateButtonDown || this.isLookButtonDown) {
            this.toolOptions.orbitCamera.pitch -= dy * this.toolOptions.orbitSensitivity;
            this.toolOptions.orbitCamera.yaw -= dx * this.toolOptions.orbitSensitivity;
        } else if (this.isPanButtonDown) {
            this.pan(event);
        }
        this.lastPoint.set(event.x, event.y);
    }
    /**
     * 鼠标抬起事件监听
     * @param {MouseEvent} event 鼠标抬起事件
     */
    onMouseUp(event) {
        const orbitCamera = this.toolOptions.orbitCamera;
        switch (event.button) {
            case pc.MOUSEBUTTON_LEFT:
                orbitCamera.isRotating = false;
                this.isRotateButtonDown = false;
                break;
            case pc.MOUSEBUTTON_MIDDLE:
                orbitCamera.isPaning = false;
                this.isPanButtonDown = false;
                break;
            case pc.MOUSEBUTTON_RIGHT:
                this.isLookButtonDown = false;
                orbitCamera.isLooking = false;
                orbitCamera.stopInertia();
                break;
        }
    }
    /**
     * 鼠标滚轮事件监听
     * @param {OrbitCameraInputOption} event 鼠标滚轮事件
     */
    onMouseWheel(event) {
        const { orbitCamera } = this.toolOptions;
        const orbitCameraOptions = orbitCamera.toolOptions;
        if (!orbitCameraOptions.distanceCondition || orbitCameraOptions.distanceCondition()) {
            orbitCamera.distance += event.wheelDelta * this.toolOptions.distanceSensitivity * (orbitCamera.distance * 0.1);
        }
    }
    /**
     * 移动鼠标时平移相机视角
     * @param {{ x: number, y: number }} event 鼠标移动事件
     */
    pan(event) {
        const { orbitCamera } = this.toolOptions;
        const camera = orbitCamera.toolOptions.mainCamera;
        camera.screenToWorld(event.x, event.y, orbitCamera.distance, this.fromWorldPoint);
        camera.screenToWorld(this.lastPoint.x, this.lastPoint.y, orbitCamera.distance, this.toWorldPoint);
        this.worldDiff.sub2(this.toWorldPoint, this.fromWorldPoint);
        orbitCamera.pivotPoint.add(this.worldDiff);
    }
    onEnable() {
        this.app?.mouse?.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app?.mouse?.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
    }
    onDisable() {
        this.app?.mouse?.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app?.mouse?.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
        window.removeEventListener("mousemove", this.onMouseMove.bind(this));
        window.removeEventListener("mouseup", this.onMouseUp.bind(this));
    }
}
/**
 * 观测相机触摸屏输入
 */
export class OrbitCameraInput_TouchScreen {
    // 默认选项
    toolOptionsDefault/*: OrbitCameraInputOption*/ = {
        orbitCamera: null,
        orbitSensitivity: 0.25,
        distanceSensitivity: 1.5
    };
    fromWorldPoint = new pc.Vec3();
    toWorldPoint = new pc.Vec3();
    worldDiff = new pc.Vec3();
    pinchMidPoint = new pc.Vec2();
    lastTouchPoint = new pc.Vec2();
    lastPinchMidPoint = new pc.Vec2();
    lastPinchDistance = 0;
    /**
     * @param {OrbitCameraInputOption} options
     */
    constructor(options) {
        if (!this.app.touch) {
            console.error("触屏设备不存在，请更改输入设备");
            return;
        }
    }
    /**
     * 触屏操作开始，结束，取消事件回调
     * @param {pc.TouchEvent} event 触屏开始，结束，取消事件
     */
    onTouchStartEndCancel(event) {
        var touches = event.touches;
        if (touches.length == 1) {
            this.lastTouchPoint.set(touches[0].x, touches[0].y);
        } else if (touches.length == 2) {
            this.lastPinchDistance = this.getPinchDistance(touches[0], touches[1]);
            this.calcMidPoint(touches[0], touches[1], this.lastPinchMidPoint);
        }
        this.toolOptions.orbitCamera.isRotating = false;
        this.toolOptions.orbitCamera.isPaning = false;
    }
    /**
     * 触屏移动事件回调
     * @param {pc.TouchEvent} event 触屏移动事件
     */
    onTouchMove(event)
    {
        const orbitCamera = this.toolOptions.orbitCamera;
        const orbitCameraOptions = orbitCamera.toolOptions;
        var touches = event.touches;
        if (touches.length == 1) {
            const touch = touches[0];
            if (!orbitCameraOptions.rotateCondition || orbitCameraOptions.rotateCondition()) {
                orbitCamera.isRotating = true;
                orbitCamera.pitch -= (touch.y - this.lastTouchPoint.y) * this.toolOptions.orbitSensitivity;
                orbitCamera.yaw -= (touch.x - this.lastTouchPoint.x) * this.toolOptions.orbitSensitivity;
            }
            this.lastTouchPoint.set(touch.x, touch.y);
        } else if (touches.length == 2) {
            const currentPinchDistance = this.getPinchDistance(touches[0], touches[1]);
            const diffInPinchDistance = currentPinchDistance - this.lastPinchDistance;
            this.lastPinchDistance = currentPinchDistance;
            if (!orbitCameraOptions.distanceCondition || orbitCameraOptions.distanceCondition()) {
                orbitCamera.distance -= (diffInPinchDistance * this.toolOptions.distanceSensitivity * 0.1) * (orbitCamera.distance * 0.1);
            }
            this.calcMidPoint(touches[0], touches[1], this.pinchMidPoint);
            if (!orbitCameraOptions.panCondition || orbitCameraOptions.panCondition()) {
                orbitCamera.isPaning = true;
                this.pan(this.pinchMidPoint);
            }
            this.lastPinchMidPoint.copy(this.pinchMidPoint);
        }
    }
    /**
     * 根据触屏中心点位置平移相机
     * @param {pc.Vec2} midPoint 触屏中心点
     */
    pan(midPoint) {
        const orbitCamera = this.toolOptions.orbitCamera;
        const fromWorldPoint = this.fromWorldPoint;
        const toWorldPoint = this.toWorldPoint;
        const worldDiff = this.worldDiff;
        const camera = orbitCamera.toolOptions.mainCamera;
        const distance = orbitCamera.distance;
        camera.screenToWorld(midPoint.x, midPoint.y, distance, fromWorldPoint);
        camera.screenToWorld(this.lastPinchMidPoint.x, this.lastPinchMidPoint.y, distance, toWorldPoint);
        worldDiff.sub2(toWorldPoint, fromWorldPoint);
        orbitCamera.pivotPoint.add(worldDiff);
    }
    /**
     * 计算中点
     * @param {{ x: number, y: number }} pointA 起点
     * @param {{ x: number, y: number }} pointB 终点
     * @param {pc.Vec2} result 中心点
     */
    calcMidPoint(pointA, pointB, result) {
        result.set(pointB.x - pointA.x, pointB.y - pointA.y);
        result.mulScalar(0.5);
        result.x += pointA.x;
        result.y += pointA.y;
    }
    /**
     * 获得两点距离
     * @param {{ x: number, y: number }} pointA 原始点
     * @param {{ x: number, y: number }} pointB 目标点
     * @returns {number} 两点距离
     */
    getPinchDistance(pointA, pointB) {
        const dx = pointA.x - pointB.x;
        const dy = pointA.y - pointB.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
    onEnable() {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStartEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchStartEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this);
        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
    onDisable() {
        this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStartEndCancel, this);
        this.app.touch.off(pc.EVENT_TOUCHEND, this.onTouchStartEndCancel, this);
        this.app.touch.off(pc.EVENT_TOUCHCANCEL, this.onTouchStartEndCancel, this);
        this.app.touch.off(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
}
