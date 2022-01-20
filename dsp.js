function ampToDb(amplitude)
{
    return Math.log10(amplitude) * 20.0;
}

function dbToAmp(db)
{
    return Math.pow(10.0, db / 20.0);
}

/** Prewarps the continuous (splane) frequency to match the desired discrete frequency */
function preWarp(frequency)
{
    return (sampleRate / Math.PI) * Math.tan((Math.PI * frequency) / sampleRate);
}

/** Inverts frequency prewarping, converts a prewarped continuous frequency to the desired discrete frequency */
function inversePrewarp(warpedFrequency)
{
    return sampleRate * Math.atan(warpedFrequency / (sampleRate / Math.PI)) / Math.PI;
}

/** Upscales a continuous point by a desired discrete frequency  */
function scaleContinuousNumber(number, frequency)
{
    return number.mul( 2 * Math.PI * preWarp(frequency) );
}

/** Downscales a upscaled continuous point */
function normalizeContinuousNumber(scaledNumber, scalingFrequency)
{
    return scaledNumber.div( 2 * Math.PI * preWarp(scalingFrequency) );
}

/** Transforms an analog/continuous number to its digital/discrete counterpart (no pre-warping) 
 *  Simply the billinear transform
*/
function toDiscrete(continous)
{
    return Complex(1, 0).add( continous.div(2 * sampleRate) ).div( Complex(1, 0).sub( continous.div(2 * sampleRate) ) );
}

/** Transforms a digital/discrete number to its continuous/analog counterpart (no pre-warping correction)
 *  Inverse of the billinear transform
 */
function toContinuous(discrete)
{
    return new Complex(2 * sampleRate, 0).mul( discrete.sub(1, 0).div( discrete.sub(-1, 0) ) );
}

/** Returns a TransferFunction function for a given set of poles and zeros (Position[]) */
function createTransferFunction(poles, zeros)
{
    return function(s)
    {
        nominator = Complex(1);
        for(var i = 0; i < zeros.length; i++)
        {
            nominator = nominator.mul(s.sub(new Complex(zeros[i].valueX, zeros[i].valueY)));
        }

        denominator = Complex(1);
        for(var i = 0; i < poles.length; i++)
        {
            denominator = denominator.mul(s.sub(new Complex(poles[i].valueX, poles[i].valueY)));
        }

        return nominator.div(denominator);
    };
}

class Delay
{
    constructor()
    {
        this.index = 0;
        this.data = [];

        // TODO: should be max order
        for(var i = 0; i < 8; i++)
        {
            this.data.push(0);
        }
    }

    set(value)
    {
        for(var i = 0; i < this.data.length; i++)
        {
            this.data[i] = value;
        }
    }

    delayed(samples)
    {
        const index = (this.index - samples + this.data.length) % this.data.length;
        return this.data[index];
    }

    push(value)
    {
        this.index = (this.index + 1) % this.data.length;
        this.data[this.index] = value;
    }
}
