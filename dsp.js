/** Prewarps the analog/continuous (splane) frequency to match the desired discrete frequency */
function preWarp(frequency)
{
    return (sampleRate / Math.PI) * Math.tan((Math.PI * frequency) / sampleRate);
}

/** Upscales an analog pole (1 rad/s) by a desired discrete frequency  */
function scaleAnalagPole(analogPole, frequency)
{
    return analogPole.mul( 2 * Math.PI * preWarp(frequency) );
}

/** Transforms an analog/continuous pole to a digital/discrete pole (no pre-warping) 
 *  Simply the billinear transform
*/
function toDigital(analogPole)
{
    return Complex(1, 0).add( analogPole.div(2 * sampleRate) ).div( Complex(1, 0).sub( analogPole.div(2 * sampleRate) ) );
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
