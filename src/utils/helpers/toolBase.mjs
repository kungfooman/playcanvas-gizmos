import * as pc from "playcanvas";

import { cast } from "./extend-decorator.mjs";

export abstract class Tool<Options extends { [optionName: string]: any }, EventsMap extends { [callbackName: string]: any }>
{
    /** @type {pc.AppBase} */
    app;

    /**
     * @protected
     * @type {Options}
     */
    toolOptionsDefault;
    /** @type {Options} */
    toolOptions;
    /** @type {boolean} */
    _enabled;

    /**
     * 创建新的工具实例
     */
    constructor()
    {
        this.app = pc.AppBase.getApplication();
        pc.events.attach(this);
    }

    /**
     * 设置工具启用状态（触发启用和禁用时的额外操作）
     */
    public set enabled(value: boolean)
    {
        if (this._enabled === value) { return; }
        this._enabled = value;
        this._enabled ? this.onEnable() : this.onDisable();
    }
    /**
     * 获得工具的启用状态
     */
    public get enabled(): boolean
    {
        return this._enabled;
    }

    /**
     * 设置选项
     * @param options 选项 
     */
    public setOptions(options: Options): void
    {
        this.toolOptions = { ...options };
        Object.keys(this.toolOptionsDefault).forEach(key =>
        {
            (this.toolOptions as any)[key] = this.toolOptions[key] ?? this.toolOptionsDefault[key];
        });
    };

    /**
     * 更新选项
     * @param options 选项
     */
    public updateOptions(options: { [P in keyof Options]?: Options[P] }): void
    {
        Object.keys(options).forEach(key =>
        {
            (this.toolOptions as any)[key] = options[key];
        });
    };

    /**
     * 注册事件监听
     * @param eventName 事件名称
     * @param linstener 监听回调
     * @param scope 回调函数this指向
     * @returns EventHandler
     */
    public on<EventName extends keyof EventsMap>(eventName: EventName, linstener: EventsMap[EventName], scope?: object): pc.EventHandler
    {
        return cast<pc.EventHandler>(this).on(eventName as string, linstener, scope);
    }
    /**
     * 注册单次事件监听
     * @param eventName 事件名称
     * @param linstener 监听回调
     * @param scope 回调函数this指向
     * @returns EventHandler
     */
    public once<EventName extends keyof EventsMap>(eventName: EventName, linstener: EventsMap[EventName], scope?: object): pc.EventHandler
    {
        return cast<pc.EventHandler>(this).once(eventName as string, linstener, scope);
    }
    /**
     * 注销事件监听
     * @param eventName 事件名称
     * @param linstener 监听回调
     * @param scope 回调函数this指向
     * @returns EventHandler
     */
    public off<EventName extends keyof EventsMap>(eventName: EventName, linstener: EventsMap[EventName], scope?: object): pc.EventHandler
    {
        return cast<pc.EventHandler>(this).off(eventName as string, linstener, scope);
    }
    /**
     * 检测是否监听此事件
     * @template {keyof EventsMap} EventName
     * @param {EventName} eventName 事件名称 
     * @returns {boolean} 是否监听此事件
     */
    hasEvent(eventName) {
        return cast<pc.EventHandler>(this).hasEvent(eventName);
    }
    /**
     * 手动触发事件
     * @template {keyof EventsMap} EventName
     * @param {EventName} eventName 事件名称
     * @param {any} [arg1] 参数1
     * @param {any} [arg2] 参数2
     * @param {any} [arg3] 参数3
     * @param {any} [arg4] 参数4
     * @param {any} [arg5] 参数5
     * @param {any} [arg6] 参数6
     * @param {any} [arg7] 参数7
     * @param {any} [arg8] 参数8
     * @returns {pc.EventHandler} EventHandler
     */
    fire(eventName, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8)
    {
        //return cast<pc.EventHandler>(this).fire(eventName as string, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return this.fire(eventName, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    }

    protected onEnable(): void { };
    protected onDisable(): void { };
}