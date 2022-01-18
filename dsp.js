function ampToDb(amplitude)
{
    return Math.log10(amplitude) * 20.0;
}

function dbToAmp(db)
{
    return Math.pow(10.0, db / 20.0);
}

// TODO: rename all occurences of 'analog' and 'digital' to 'continuous' and 'discrete'

/** Prewarps the analog/continuous (splane) frequency to match the desired discrete frequency */
function preWarp(frequency)
{
    return (sampleRate / Math.PI) * Math.tan((Math.PI * frequency) / sampleRate);
}

/** Inverts frequency prewarping, converts a prewarped frequency to the desired discrete frequency */
function inversePrewarp(warpedFrequency)
{
    return sampleRate * Math.atan(warpedFrequency / (sampleRate / Math.PI)) / Math.PI;
}

/** Upscales an analog pole/zero (1 rad/s) by a desired discrete frequency  */
function scaleAnalagVariable(analog, frequency)
{
    return analog.mul( 2 * Math.PI * preWarp(frequency) );
}

function normalizeAnalogVariable(analog, frequency)
{
    return analog.div( 2 * Math.PI * preWarp(frequency) );
}

/** Transforms an analog/continuous pole/zero to a digital/discrete pole/zero (no pre-warping) 
 *  Simply the billinear transform
*/
function toDigital(analog)
{
    return Complex(1, 0).add( analog.div(2 * sampleRate) ).div( Complex(1, 0).sub( analog.div(2 * sampleRate) ) );
}

/**
 *  Inverse of the billinear transform
 */
function toAnalog(digital)
{
    return new Complex(2 * sampleRate, 0).mul( digital.sub(1, 0).div( digital.sub(-1, 0) ) );
}

/** Returns a TransferFunction function for a given set of poles and zeros (Position[]) */
function createTransferFunction(poles, zeros)
{
    return function(s)
    {
        // all zeroes at -1
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
