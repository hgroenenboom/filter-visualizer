class DifferentialEquation
{
    constructor(xCoefficients, yCoefficients)
    {
        this.x = new Delay();
        this.y = new Delay();
        this.resetState();

        this.coefficients = xCoefficients;
        this.recursionCoefficients = yCoefficients; 

        for(var i = 0; i < this.coefficients.length; i++)
        {
            if(this.coefficients[i].abs() <= 0.00000000001)
            {
                this.coefficients[i] = new Complex(0, 0);
            }
        }

        this.recursionCoefficients[0] = new Complex(0, 0);
        for(var i = 0; i < this.recursionCoefficients.length; i++)
        {
            if(this.recursionCoefficients[i].abs() <= 0.0000000001)
            {
                this.recursionCoefficients[i] = new Complex(0, 0);
            }
        }
    }

    normalize(scalar)
    {
        let sumX = 0;
        let sumY = 0;
        for(var i = 0; i < this.coefficients.length; i++)
        {
            sumX += this.coefficients[i].re;
        }
        for(var i = 0; i < this.recursionCoefficients.length; i++)
        {
            sumY += this.recursionCoefficients[i].re; 
        }
        const normalization = Math.abs(sumY / sumX);

        // TODO: check whether correct
        // Probably only correct for butterworth filters
        for(var i = 0; i < this.coefficients.length; i++)
        {
            this.coefficients[i] = this.coefficients[i].mul( scalar );
        }
    }

    resetState()
    {
        this.x.set(0);
        this.y.set(0);
    }

    tick(x)
    {
        this.x.push(x);

        let out = 0;
        for(var i = 0; i < this.coefficients.length; i++)
        {
            out += this.coefficients[i].re * this.x.delayed(i);
        }
        for(var i = 0; i < this.recursionCoefficients.length; i++)
        {
            out += this.recursionCoefficients[i].re * this.y.delayed(i);
        }
        
        this.y.push(out);
        console.log(out);

        return out;
    }

    complexToString(value)
    {
        if(value.im < 0.000001)
        {
            return "" + parseFloat(value.re).toFixed(2);
        }
        else
        {
            return "(" + parseFloat(value.re).toFixed(2) + " + " + parseFloat(value.im).toFixed(2) + "i)";
        }
    }

    prettyText()
    {
        let text = "y[n] = ";

        if(this.coefficients.length > 0)
        {
            if(this.coefficients[0] != 0)
            {
                text += this.complexToString(this.coefficients[0]) + "*x[n] + ";
            }
        }
        for(var i = 1; i < this.coefficients.length; i++)
        {
            if(this.coefficients[i] != 0)
            {
                text += this.complexToString(this.coefficients[i]) + "*x[n - " + i + "] + ";
            }
        }
        
        for(var i = 0; i < this.recursionCoefficients.length; i++)
        {
            if(this.recursionCoefficients[i] != 0)
            {
                text += this.complexToString(this.recursionCoefficients[i]) + "*y[n - " + i + "] + ";
            }
        }
        
        return text.substring(0, text.length - 3);
    }
};

function sum(array)
{
    let sum = Complex(0, 0);
    for(var i = 0; i < array.length; i++)
    {
        sum = sum.add(array[i]);
    }
    return sum;
}

/** Returns the sum of the multiplication of all possible number combinations in a given array 
 *  Examples:
 *  
 *  for [1, 2, 3] and numCombinations set to 2, this will be the sum of (1*2 + 1*3 + 2*3)
 *  for [2, 3, 4, 5] and numCombinations set to 3, this will be the sum of (2*3*4, 2*3*5, 2*4*5, 3*4*5)
*/
function sumOfAllPossibleCombinations(array, numCombinations, startIndex = 0, currentLevel = 0)
{
    // first check whether the indices are still valid
    // if the number of combinations has been reached, stop the recursion by simply mulitplying with 1
    if(currentLevel >= numCombinations && startIndex <= array.length)
    {
        return new Complex(1, 0);
    }
    // if the number of combinations has not been reached, return 0 to stop the recursion and remove the result. 
    else if(startIndex > array.length)
    {
        return new Complex(0, 0);
    }

    let foundMultipliedCombinations = [];

    // start looking for the next combination number, starting from the index where the previous call left of
    for(var i = startIndex; i < array.length; i++)
    {
        // recursively find all the next possible combinations, result is 0 if non are found
        const newMultiplication = array[i].mul( sumOfAllPossibleCombinations(array, numCombinations, i + 1, currentLevel + 1) );
        
        foundMultipliedCombinations.push(newMultiplication);
    }

    // return the sum of the multiplications of all possible combinations that were found in this function call
    return sum(foundMultipliedCombinations);
}

function fromPoleZerosToDifferentialEquation(poles, zeros)
{
    // Invert the sign for all zeros
    // TODO: check whether correct
    for(var i = 0; i < zeros.length; i++)
    {
        zeros[i] = zeros[i].mul(-1);
    }

    let yCoefficients = [];
    for(var i = 0; i < poles.length + 1; i++)
    {
        yCoefficients.push( sumOfAllPossibleCombinations(poles, i) );
        if(yCoefficients[i] > 1.0)
        {
            // throw new Error('yCoefficients for order ' + i + ' is ' + yCoefficients[i]);
        }
    }

    let xCoefficients = [];
    for(var i = 0; i < zeros.length + 1; i++)
    {
        xCoefficients.push( sumOfAllPossibleCombinations(zeros, i) );
    }

    return new DifferentialEquation(xCoefficients, yCoefficients);
}

console.log(sumOfAllPossibleCombinations([
    new Complex({ abs: 0.99, arg: 0.3 }),
    new Complex({ abs: 0.3, arg: 0.1 }),
    new Complex({ abs: 0.2, arg: -4.3 }),
], 1));
