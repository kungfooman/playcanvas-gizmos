
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
