/**
 * 创建者: FBplus
 * 创建时间: 2022-05-05 10:56:15
 * 修改者: FBplus
 * 修改时间: 2022-07-10 21:42:04
 * 详情: 控制runtime transform的撤销和重做
 */
import * as pc from "playcanvas";
export class Recorder {
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
