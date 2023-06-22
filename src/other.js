import { getData, setData } from './dataStore.js';

/**
 * Reset the state of the application back to the start.
 * 
 * @param {} - no parameters
 * @returns {} - doesn't return anything
 */
export function clear () {
    let data = getData();
    
    data = {
        users: [],
        quizzes: [],
    };
    
    setData(data);

    return { };
}

/**
 * Check if given string is purely whitespace
 * 
 * @param {string} - name
 * @returns {boolean} - true/false
 */
export function isWhiteSpace (name) {
    let expression = /^[\s]+$/
    
    if (expression.test(name)) {
        return true;
    }

    return false;
}