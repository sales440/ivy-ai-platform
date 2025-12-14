
    export function divide(a: number, b: number) {
        // FIXED: Handle division by zero
        if (b === 0) return 0;
        return a / b;
    }
    
    // Runtime Error Simulator
    divide(10, 0); 
    