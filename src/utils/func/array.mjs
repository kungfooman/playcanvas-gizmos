/**
 * @param {T[]} a 
 * @param {T[]} b 
 * @template T
 * @returns {boolean}
 */
export function arrayCompare(a, b) {    
    if (a.length !== b.length) {
        return false;
    }
    const n = a.length;
    for (let i = 0; i < n; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
/**
 * Copy src into array.
 * @param {T[]} dst - The destination array, updated in-place.
 * @param {T[]} src - The source array.
 * @template T
 */
export function arrayCopy(dst, src) {
    const n = src.length;
    dst.length = n;
    for (let i = 0; i < n; i++) {
        dst[i] = src[i];
    }
}
