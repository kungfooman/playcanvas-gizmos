/**
 * 创建者: FBplus
 * 创建时间: 2022-05-05 10:56:15
 * 修改者: FBplus
 * 修改时间: 2022-07-10 21:42:04
 * 详情: 控制runtime transform的撤销和重做
 */
import * as pc from "playcanvas";

export class Record {
    /** @type {pc.Entity[] | null} */
    selections;
    /** @type {pc.Mat4[] | null} */
    transforms;

    /**
     * @param {pc.Entity[] | null} selections 
     * @param {pc.Mat4[] | null} transforms 
     */
    constructor(selections = null, transforms = null) {
        this.selections = selections;
        this.transforms = transforms;
    }

    /**
     * 
     * @param {Record} record 
     * @returns {boolean}
     */
    equals(record) {
        if (this.selections === null && record.selections === null) {
            return true;
        }
        if (
            this.selections === null ||
            record.selections === null ||
            this.selections.length != record.selections.length ||
            this.transforms.length != record.transforms.length
        ) {
            return false;
        }
        const selectionIsEqual = this.selections?.every((selection, index) => selection === record.selections[index]);
        const transformIsEqual = this.transforms?.every((transform, index) => transform.equals(record.transforms[index]));

        return selectionIsEqual && transformIsEqual;
    }

    /**
     * 
     * @param {pc.Entity[] | null} selections 
     * @param {pc.Mat4[] | null} transforms 
     * @returns {Record}
     */
    set(selections, transforms) {
        this.selections = selections;
        this.transforms = transforms;

        return this;
    }

    /**
     * @returns {Record}
     */
    clone() {
        /** @type {pc.Entity[] | null} */
        let selections;
        /** @type {pc.Mat4[] | null} */
        let transforms;
        if (this.selections === null) {
            selections = null;
        }
        else {
            selections = [].concat(this.selections);
        }

        if (this.transforms === null) {
            transforms = null
        }
        else {
            transforms = [];
            this.transforms.forEach(transform =>
            {
                transforms.push(transform.clone());
            });
        }

        return new Record(selections, transforms);
    }
}

export default class Recorder
{
    /** @type {Record[]} */
    static records = [];
    static index = 0;

    /**
     * @param {Record} record 
     */
    static init(record) {
        this.records.length = 1;
        this.records[0] = record.clone();
        this.index = 0;
    }

    /**
     * @param {Record} record 
     */
    static save(record) {
        if (this.records[this.index]?.equals(record)) {
            return;
        }
        this.records.length = ++this.index;
        this.records.push(record.clone());
    }

    /**
     * @returns {Record}
     */
    static undo() {
        if (--this.index <= 0) {
            this.index = 0;
        }
        return this.records[this.index];
    }

    /**
     * @returns {Record}
     */
    static redo() {
        if (++this.index > this.records.length - 1) {
            this.index = this.records.length - 1;
        }
        return this.records[this.index];
    }
}
