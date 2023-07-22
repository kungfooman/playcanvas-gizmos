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
