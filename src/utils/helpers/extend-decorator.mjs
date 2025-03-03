/**
 * 创建者: FBplus
 * 创建时间: 2022-04-21 16:10:55
 * 修改者: FBplus
 * 修改时间: 2022-09-06 16:05:36
 * 详情: 用于扩展pc类的装饰器
 */

//import { Constructable, Constructor } from "../common/TypesAndInterfaces";

// 排除的原型成员名称
const exceptPrototypeMemberNames = [
    "constructor",
];

// 排除的静态成员名称
const exceptStaticMemberNames = [
    "length", "name", "prototype"
];

/**
 * 获得该类所有原型成员的名称数组
 * @param {Constructor<T>} value 类型
 * @template T
 * @returns 该类所有原型成员的名称数组
 */
function getPrototypeMemberNames(value) {
    return Reflect.ownKeys(value.prototype);
}

/**
 * 获得该类所有静态成员的名称数组
 * @param {Constructor<T>} value 类型
 * @template T
 * @returns 该类所有静态成员的名称数组
 */
function getStaticMemberNames(value)
{
    return Reflect.ownKeys(value);
}

/**
 * 转换类型 
 * @param {any} obj 待转换对象
 * @template NewType
 * @returns {NewType} 转换类型后的对象
 */
export function cast(obj) {
    return obj /*as NewType*/;
}

/**
 * 转换类型
 * @param {EXType} exType 要转换类型
 * @param {OriginalInstance} obj 待转换对象
 * @template {Constructor<OriginalInstance>} EXType
 * @template OriginalInstance
 * @returns {InstanceType<EXType>} 转换类型后的对象
 */
export function castEX(exType, originalObject) {
    return originalObject /*as InstanceType<EXType>*/;
}

/**
 * 扩展pc类 //TODO: 实现实例属性扩展（当前无法对基类的实例属性进行扩展!!!）
 * @template {Constructable<T>} T
 * @param {T} extendClassName 扩展类名称
 * @returns {(target: T) => void} 扩展类
 */
export function extendClass(extendClass) {
    /**
     * 扩展已有类
     * @param {T} target
     * @returns {void}
     */
    return function (target) {
        // 找到要扩展的类型原型链
        if (!extendClass.prototype) {
            console.error(`找不到要扩展的类，请检查类型是否在pc命名空间下。`)
            return;
        }

        // 添加原型成员
        const prototypeMemberNames = getPrototypeMemberNames(target);
        prototypeMemberNames.forEach(prototypeMemberName =>
        {
            if (exceptPrototypeMemberNames.includes(prototypeMemberName /*as string*/)) {
                return;
            }

            // 获得成员
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, prototypeMemberName);
            // 添加方法成员
            if (descriptor.value) {
                if (extendClass.prototype[prototypeMemberName]) {
                    console.error(`${prototypeMemberName.toString()} 方法已存在于类中，请更改方法名，否则此扩展方法不会生效！`);
                    return;
                }
                extendClass.prototype[prototypeMemberName] = descriptor.value;
            }
            // 添加访问器
            else {
                if (descriptor.get || descriptor.set) {
                    if (Object.getOwnPropertyDescriptor(extendClass.prototype, prototypeMemberName)) {
                        console.error(`${prototypeMemberName.toString()} 属性已存在于类中，请更改属性名，否则此扩展属性不会生效！`);
                        return;
                    }
                    Object.defineProperty(extendClass.prototype, prototypeMemberName, { get: descriptor.get, set: descriptor.set });
                }
            }
        });

        // 添加静态成员
        const staticMemberNames = getStaticMemberNames(target);
        staticMemberNames.forEach(staticMemberName =>
        {
            if (exceptStaticMemberNames.includes(staticMemberName /*as string*/)) { return; }

            const descriptor = Object.getOwnPropertyDescriptor(target, staticMemberName);
            if (descriptor?.value) {
                // console.log("添加静态成员", staticMemberName, descriptor.value);
                extendClass[staticMemberName] = descriptor?.value;
            }
        });
    }
}
