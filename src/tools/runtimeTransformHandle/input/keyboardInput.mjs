/**
 * 创建者: FBplus
 * 创建时间: 2022-05-16 14:40:16
 * 修改者: FBplus
 * 修改时间: 2022-07-22 10:49:42
 * 详情: 键盘快捷键
 */

import * as pc from "playcanvas";

import { HandleType } from "../common/enum.mjs";

/**
 * @typedef {number} KeyCode
 */

/**
 * 键盘快捷键选项
 */
/**
 * An object with keycode's mapped to respective functions.
 * @typedef {object} KeyboardInputOptions
 * @property {KeyCode} translateKey - keycode for the translate function
 * @property {KeyCode} rotateKey - keycode for the rotate function
 * @property {KeyCode} scaleKey - keycode for the scale function
 * @property {KeyCode} focusKey - keycode for the focus function
 * @property {KeyCode} pivotKey - keycode for the pivot function
 * @property {KeyCode} comboKey - keycode for the combo function
 * @property {KeyCode} undoKey - keycode for the undo function
 * @property {KeyCode} redoKey - keycode for the redo function
 */

/**
 * 键盘快捷键-回调表
 */
/**
 * @typedef {Object} ShortcutEventsMap
 * @property {(handleType: HandleType) => any} setHandleType - Sets the handle type
 * @property {() => any} focus - Focuses the element
 * @property {() => any} switchPivot - Switches the pivot
 * @property {() => any} undo - Undoes the action
 * @property {() => any} redo - Redoes the action
 */

//@tool("RTH_KeyboardInputer")
export class RTH_KeyboardInputer extends Tool<KeyboardInputOptions, ShortcutEventsMap>
{
    // 默认选项
    protected toolOptionsDefault: KeyboardInputOptions = {
        translateKey: pc.KEY_W,
        rotateKey: pc.KEY_E,
        scaleKey: pc.KEY_R,
        focusKey: pc.KEY_F,
        pivotKey: pc.KEY_X,
        comboKey: pc.KEY_CONTROL,
        undoKey: pc.KEY_Z,
        redoKey: pc.KEY_Y
    };

    constructor(options?: KeyboardInputOptions)
    {
        super();

        this.setOptions(options);
    }

    private onKeyDown(event: any): void
    {
        const toolOptions = this.toolOptions;
        switch (event.key) {
            case toolOptions.translateKey:
                this.fire("setHandleType", HandleType.Translation);
                break;
            case toolOptions.rotateKey:
                this.fire("setHandleType", HandleType.Rotation);
                break;
            case toolOptions.scaleKey:
                this.fire("setHandleType", HandleType.Scale);
                break;
            case toolOptions.focusKey:
                this.fire("focus");
                break;
            case toolOptions.pivotKey:
                this.fire("switchPivot");
                break;
            case toolOptions.undoKey:
                if (!this.app.keyboard.isPressed(toolOptions.comboKey)) { break; }
                this.fire("undo");
                break;
            case toolOptions.redoKey:
                if (!this.app.keyboard.isPressed(toolOptions.comboKey)) { break; }
                this.fire("redo");
                break;
            default:
                break;
        }

        event.event.preventDefault();
    }

    protected override onEnable(): void
    {
        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }

    protected override onDisable(): void
    {
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }
}