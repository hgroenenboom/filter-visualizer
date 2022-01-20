class DifferentialEquation
{
    constructor(xCoefficients, yCoefficients)
    {
        this.x = new Delay();
        this.y = new Delay();
        this.resetState();

        yCoefficients.shift();
        this.coefficients = xCoefficients;
        this.recursionCoefficients = yCoefficients; 

        for(var i = 0; i < this.coefficients.length; i++)
        {
            if(this.coefficients[i].abs() <= 0.000001)
            {
                this.coefficients[i] = new Complex(0, 0);
            }
        }
        for(var i = 0; i < this.recursionCoefficients.length; i++)
        {
            if(this.recursionCoefficients[i].abs() <= 0.000001)
            {
                this.recursionCoefficients[i] = new Complex(0, 0);
            }
        }
    }

    scale(scalar)
    {
        for(var i = 0; i < this.coefficients.length; i++)
        {
            this.coefficients[i] = this.coefficients[i].mul( scalar );
        }
    }

    resetState()
    {
        this.x.set(new Complex(0));
        this.y.set(new Complex(0));
    }

    tick(x)
    {
        this.x.push(x);

        let out = new Complex(0, 0);
        for(var i = 0; i <  this.coefficients.length; i++)
        {
            out = out.add( this.coefficients[i].mul(this.x.delayed(i)) );
        }
        for(var i = 0; i < this.recursionCoefficients.length; i++)
        {
            out = out.add( this.recursionCoefficients[i].mul(this.y.delayed(0)) );
        }

        this.y.push(out);

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
                text += this.complexToString(this.recursionCoefficients[i]) + "*y[n - " + (i+1) + "] + ";
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
    let yCoefficients = [];
    for(var i = 0; i < poles.length + 1; i++)
    {
        yCoefficients.push( sumOfAllPossibleCombinations(poles, i) );
    }

    let xCoefficients = [];
    for(var i = 0; i < zeros.length + 1; i++)
    {
        xCoefficients.push( sumOfAllPossibleCombinations(zeros, i) );
    }

    return new DifferentialEquation(xCoefficients, yCoefficients);
}
