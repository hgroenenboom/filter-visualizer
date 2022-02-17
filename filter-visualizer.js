// Sources:
// - https://www.dsprelated.com/showarticle/1119.php
// - https://www.chegg.com/homework-help/questions-and-answers/filter-type-ts-s-plane-singularities-low-pass-lp-aole-oo-o-10-dc-gain-2-20-0-b-high-pass-h-q34343154
// - Will C Pirkle - Designing Audio Effect Plugins in C++
// - Steven W Smith - The Scientist and Engineer's Guide to Digital Signal Processing
// - https://www.allaboutcircuits.com/technical-articles/understanding-butterworth-filter-pole-locations/ 
// - https://en.wikipedia.org/wiki/Chebyshev_filter 

//////////////////////// GLOBALS

const maxOrder = 8;

const width = 400;
const height = width;

const closeToInf = 9999999999;

let sampleRate = 44100.0;

FilterNames = {
    Unknown : 1,
    Butterworth : 2,
    Chebyshev : 3,
    Onepole: 4,
    LinkwitzRiley: 5,
    Allpass: 6,
}

FilterTypes = {
    unknown : 1,
    lowpass : 2,
    highpass : 3
}

let filter = {
    'name': "",
    'type': FilterTypes.lowpass,
    'frequency': 11025.0,
    'order': 0,
};

function todos()
{
    return "";
}

///////////////////////// DRAWING FUNCTIONS

function filterNormalization(transferFunction)
{
    if(filter.name == FilterNames.Butterworth && filter.type == FilterTypes.lowpass)
    {
        return 1.0 / transferFunction(new Complex(1.0, 0)).abs();
    }
    else if(filter.name == FilterNames.Butterworth && filter.type == FilterTypes.highpass)
    {
        return 1.0 / transferFunction(Complex(-1, 0)).abs();
    }
    else
    {
        let max = 0.0;
        for(var i = 0; i < response.xSize; i++)
        {
            const w = Math.PI * i / response.xSize;
            max = Math.max(max, transferFunction(Complex({ arg: w, abs: 1 })).abs());
        }
        return 1.0 / max;
    }
}

function drawImpulseResponse(poles, zeros, normalization)
{
    let response = document.getElementById("impulse");
    response.width = width;
    response.height = height;
    response.xMin = 0;
    response.xSize = 100;
    response.yMin = -1;
    response.ySize = 2;

    var ctx = response.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.strokeRect(0, 0, width, height);

    ctx.strokeStyle = "#eeeeee";
    ctx.strokeRect(0, height / 2, width, height / 2);
    ctx.strokeStyle = "#000000";

    let complexPoles = [];
    let complexZeros = [];
    for(var i = 0; i < poles.length; i++)
    {
        complexPoles.push(new Complex(poles[i].valueX, poles[i].valueY));
    }
    for(var i = 0; i < zeros.length; i++)
    {
        complexZeros.push(new Complex(zeros[i].valueX, zeros[i].valueY));
    }

    let differentialEquation = fromPoleZerosToDifferentialEquation(complexPoles, complexZeros);
    differentialEquation.normalize(normalization);
    consoleWrite(differentialEquation.prettyText());

    ctx.beginPath();
    const initialPosition = new Position(response, 0, 0);
    ctx.moveTo(initialPosition.x, initialPosition.y);
    for(var i = 1; i < 100; i++)
    {
        const out = differentialEquation.tick(i == 1 ? 1 : 0);

        const outPosition = new Position(response, i, out);
        ctx.lineTo(outPosition.x, outPosition.y);
        ctx.strokeRect(outPosition.x - 3, outPosition.y, 6, 0);
    }
    ctx.strokeStyle = "#aaaaff";
    ctx.stroke();
}

function drawFilterResponse(polePositions, zeroPositions)
{
    var response = document.getElementById("response");
    response.width = width;
    response.height = height;
    response.xMin = 0;
    response.xSize = 300;
    response.yMin = 0;
    response.ySize = 2;

    var ctx = response.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.strokeRect(0, 0, width, height);
    
    ctx.strokeStyle = "#EEEEEE";
    const zerodbPos = new Position(response, 0, dbToAmp(-0.0));
    const min3dbPos = new Position(response, 0, dbToAmp(-3.0));
    const min6dbPos = new Position(response, 0, dbToAmp(-6.0));
    ctx.strokeRect(0, zerodbPos.y, width, 0);
    ctx.strokeRect(0, min3dbPos.y, width, 0);
    ctx.strokeRect(0, min6dbPos.y, width, 0);
    ctx.fillText("0db", 3, zerodbPos.y - 3, 30);
    ctx.fillText("-3db", 3, min3dbPos.y - 3, 30);
    ctx.fillText("-6db", 3, min6dbPos.y - 3, 30);
    const frequencyPos = new Position(response, response.xSize * filter.frequency / (0.5 * sampleRate), 0);
    ctx.strokeRect(frequencyPos.x, 1, 0, height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(frequencyPos.x - 10, 1, 20, 16);
    ctx.fillStyle = "#000000";
    ctx.fillText("\u03C9", frequencyPos.x - 4, 12, 8);
    
    transferFunction = createTransferFunction(polePositions, zeroPositions);
    
    let normalization = filterNormalization(transferFunction);

    drawImpulseResponse(polePositions, zeroPositions, normalization);
    
    ctx.beginPath();
    response.yMin = 0;
    response.ySize = 2;
    for(var i = 0; i < response.xSize; i++)
    {
        const w = Complex({ arg: i / response.xSize * Math.PI, abs: 1.0 });
        const mag = normalization * transferFunction(w).abs();
        
        const magPos = new Position(response, i, mag);
        if(i === 0)
        {
            ctx.moveTo(0, magPos.y);
        }
        else
        {
            ctx.lineTo(magPos.x, magPos.y)
        }
    }
    ctx.strokeStyle = "#0000FF";
    ctx.stroke();
    
    ctx.beginPath();
    response.yMin = -Math.PI;
    response.ySize = 2 * Math.PI;
    for(var i = 0; i < response.xSize; i++)
    {
        const w = Complex({ arg: i / response.xSize * Math.PI, abs: 1.0 });
        const arg = transferFunction(w).arg() % Math.PI;

        const phasePos = new Position(response, i, arg);
        if(i === 0)
        {
            ctx.moveTo(0, phasePos.y);
        }
        else
        {
            ctx.lineTo(phasePos.x, phasePos.y)
        }
    }
    ctx.strokeStyle = "#FF9999";
    ctx.stroke();
}

function drawZPlaneCanvas(polePositions, zeroPositions)
{
    var zPlane = document.getElementById("zPlane");
    var sPlane = document.getElementById("sPlane");

    zPlane.width = width;
    zPlane.height = height;
    zPlane.xMin = sPlane.xMin;
    zPlane.xSize = sPlane.xSize;
    zPlane.yMin = sPlane.yMin;
    zPlane.ySize = sPlane.ySize;

    var ctx = zPlane.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(0, 0, width, height);
    ctx.fillText("Im", 0.5 * width + 3, height - 3, 10);
    ctx.strokeRect(0.5 * width, 0, 0.5 * width, height);
    ctx.fillText("Re", 3, 0.5 * height + 12, 10);
    ctx.strokeRect(0, 0.5 * height, width, 0.5 * height);
    
    ctx.beginPath();
    ctx.arc(0.5 * width, 0.5 * height, new Position(zPlane, zPlane.xMin + 1.0, 0.0).x, 0, 2 * Math.PI );
    ctx.stroke();

    for(var i = 0; i < polePositions.length; i++)
    {
        ctx.fillRect(polePositions[i].x - 5, polePositions[i].y - 5, 10, 10);
    }
    for(var i = 0; i < zeroPositions.length; i++)
    {
        ctx.beginPath();
        ctx.arc(zeroPositions[i].x, zeroPositions[i].y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function drawLaplaceCanvas(polePositions, zeroPositions)
{
    var sPlane = document.getElementById("sPlane");
    sPlane.width = width;
    sPlane.height = height;
    sPlane.xMin = -2;
    sPlane.xSize = 4;
    sPlane.yMin = -2;
    sPlane.ySize = 4;

    var ctx = sPlane.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(0, 0, width, height);
    ctx.fillText("Im", 0.5 * width + 3, height - 3, 10);
    ctx.strokeRect(0.5 * width, 0, 0.5 * width, height);
    ctx.fillText("Re", 3, 0.5 * height + 12, 10);
    ctx.strokeRect(0, 0.5 * width, height, 0.5 * width);

    ctx.beginPath();
    ctx.arc(0.5 * width, 0.5 * height, new Position(zPlane, zPlane.xMin + 1.0, 0.0).x, 0, 2 * Math.PI );
    ctx.stroke();

    for(var i = 0; i < polePositions.length; i++)
    {
        ctx.fillRect(polePositions[i].x - 5, polePositions[i].y - 5, 10, 10);
    }
    for(var i = 0; i < zeroPositions.length; i++)
    {
        ctx.beginPath();
        ctx.arc(zeroPositions[i].x, zeroPositions[i].y, 5, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function updateDiscretePoleZeros(discretePoles, discreteZeros)
{
    for(var i = 0; i < discretePoles.length; i++)
    {
        document.getElementById('zp-x' + (i + 1)).value = discretePoles[i].valueX.toFixed(6);
        document.getElementById('zp-y' + (i + 1)).value = discretePoles[i].valueY.toFixed(6);
    }
    for(var i = discretePoles.length; i < maxOrder; i++)
    {
        document.getElementById('zp-x' + (i + 1)).value = null;
        document.getElementById('zp-y' + (i + 1)).value = null;
    }
    for(var i = 0; i < discreteZeros.length; i++)
    {
        document.getElementById('zz-x' + (i + 1)).value = discreteZeros[i].valueX.toFixed(6);
        document.getElementById('zz-y' + (i + 1)).value = discreteZeros[i].valueY.toFixed(6);
    }
    for(var i = discreteZeros.length; i < maxOrder; i++)
    {
        document.getElementById('zz-x' + (i + 1)).value = null;
        document.getElementById('zz-y' + (i + 1)).value = null;
    }
}

function updateContinuousPoleZeros(continuousPoles, continuousZeros)
{
    for(var i = 0; i < continuousPoles.length; i++)
    {
        document.getElementById('sp-x' + (i + 1)).value = continuousPoles[i].valueX.toFixed(6);
        document.getElementById('sp-y' + (i + 1)).value = continuousPoles[i].valueY.toFixed(6);
    }
    for(var i = continuousPoles.length; i < maxOrder; i++)
    {
        document.getElementById('sp-x' + (i + 1)).value = null;
        document.getElementById('sp-y' + (i + 1)).value = null;
    }
    for(var i = 0; i < continuousZeros.length; i++)
    {
        document.getElementById('sz-x' + (i + 1)).value = continuousZeros[i].valueX.toFixed(6);
        document.getElementById('sz-y' + (i + 1)).value = continuousZeros[i].valueY.toFixed(6);
    }
    for(var i = continuousZeros.length; i < maxOrder; i++)
    {
        document.getElementById('sz-x' + (i + 1)).value = null;
        document.getElementById('sz-y' + (i + 1)).value = null;
    }
}

function drawFromSplane()
{
    consoleClear();
    consoleWrite(todos());
    consoleWrite("current frequency: " + filter.frequency);
    consoleWrite("prewarped frequency: " + preWarp(filter.frequency));
    
    let continuousPoles = [];
    let continuousZeros = [];
    for(let i = 1; i < maxOrder + 1; i++)
    {
        const inputSPX = document.getElementById("sp-x" + String(i)).value;
        const inputSPY = document.getElementById("sp-y" + String(i)).value;
        const inputSZX = document.getElementById("sz-x" + String(i)).value;
        const inputSZY = document.getElementById("sz-y" + String(i)).value;
        
        if(inputSPX && inputSPY)
        {
            continuousPoles.push(new Position(sPlane, inputSPX, inputSPY));
        }
        if(inputSZX && inputSZY)
        {
            continuousZeros.push(new Position(sPlane, inputSZX, inputSZY));
        }
    }

    drawLaplaceCanvas(continuousPoles, continuousZeros);

    let discretePoles = [];
    for(var i = 0; i < continuousPoles.length; i++)
    {
        continuousPole = new Complex(continuousPoles[i].valueX, continuousPoles[i].valueY);
        continuousScaledPole = scaleContinuousNumber(continuousPole, filter.frequency);
        discretePole = toDiscrete(continuousScaledPole);
        discretePoles.push(new Position(zPlane, discretePole.re, discretePole.im));
    }
    
    let discreteZeros = [];
    for(var i = 0; i < continuousZeros.length; i++)
    {
        continuousZero = new Complex(continuousZeros[i].valueX, continuousZeros[i].valueY);
        continuousScaledZero  = scaleContinuousNumber(continuousZero, filter.frequency);
        discreteZero = toDiscrete(continuousScaledZero);
        discreteZeros.push(new Position(zPlane, discreteZero.re, discreteZero.im));
    }

    updateDiscretePoleZeros(discretePoles, discreteZeros);

    drawZPlaneCanvas(discretePoles, discreteZeros);

    drawFilterResponse(discretePoles, discreteZeros);
}

function drawFromZPlane()
{
    consoleClear();
    consoleWrite(todos());
    consoleWrite("current frequency: " + filter.frequency);
    consoleWrite("prewarped frequency: " + preWarp(filter.frequency));

    let discretePoles = [];
    let discreteZeros = [];
    for(let i = 1; i < maxOrder + 1; i++)
    {
        const inputZPX = document.getElementById("zp-x" + String(i)).value;
        const inputZPY = document.getElementById("zp-y" + String(i)).value;
        const inputZZX = document.getElementById("zz-x" + String(i)).value;
        const inputZZY = document.getElementById("zz-y" + String(i)).value;
        
        if(inputZPX && inputZPY)
        {
            discretePoles.push(new Position(zPlane, inputZPX, inputZPY));
        }
        if(inputZZX && inputZZY)
        {
            discreteZeros.push(new Position(zPlane, inputZZX, inputZZY));
        }
    }
    
    drawZPlaneCanvas(discretePoles, discreteZeros);

    drawFilterResponse(discretePoles, discreteZeros);

    let continuousPoles = [];
    for(var i = 0; i < discretePoles.length; i++)
    {
        discretePole = new Complex(discretePoles[i].valueX, discretePoles[i].valueY);
        continuousPole = toContinuous(discretePole);
        downScaledContinuousPole = normalizeContinuousNumber(continuousPole, filter.frequency);
        if(downScaledContinuousPole.im == Infinity) { downScaledContinuousPole.im = closeToInf; }
        if(downScaledContinuousPole.re == Infinity) { downScaledContinuousPole.re = closeToInf; }
        continuousPoles.push( new Position(sPlane, downScaledContinuousPole.re, downScaledContinuousPole.im) );
    }
    
    let continuousZeros = [];
    for(var i = 0; i < discreteZeros.length; i++)
    {
        discreteZero = new Complex(discreteZeros[i].valueX, discreteZeros[i].valueY);
        continuousZero = toContinuous(discreteZero);
        downScaledContinuousZero = normalizeContinuousNumber(continuousZero, filter.frequency);
        if(downScaledContinuousZero.im == Infinity) { downScaledContinuousZero.im = closeToInf; }
        if(downScaledContinuousZero.re == Infinity) { downScaledContinuousZero.re = closeToInf; }
        continuousZeros.push( new Position(sPlane, downScaledContinuousZero.re, downScaledContinuousZero.im) );
    }

    updateContinuousPoleZeros(continuousPoles, continuousZeros);

    drawLaplaceCanvas(continuousPoles, continuousZeros);
}

///////////////////////// GUI CALLBACKS

function setFrequency(fromSlider)
{
    let box = document.getElementById('frequency');
    let slider = document.getElementById('frequency-s');

    if(fromSlider)
    {
        box.value = slider.value * sampleRate;
    } 
    else
    {
        slider.value = box.value / sampleRate;
    }

    filter.frequency = box.value;
    drawFromSplane();
}

function setFromSPlane()
{
    filter.name = FilterNames.unknown;
    filter.type = FilterTypes.unknown;
    drawFromSplane();
}

function setFromZPlane()
{
    filter.name = FilterNames.unknown;
    filter.type = FilterTypes.unknown;
    drawFromZPlane();
}

function setButterworth()
{
    filter.name = FilterNames.Butterworth;
    filter.type = document.getElementById('butterworthType').value;
    filter.order = document.getElementById('butterworthOrder').value;

    for(var i = 0; i < maxOrder; i++)
    {
        const sZeroY = (filter.type == FilterTypes.lowpass) ? closeToInf : 0;
        document.getElementById("sz-x" + (i+1) ).value = filter.order > i ? 0 : null;
        document.getElementById("sz-y" + (i+1) ).value = filter.order > i ? sZeroY : null;
    }
    for(var i = 1; i < maxOrder + 1; i++)
    {
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    for(var i = 1; i <= filter.order; i++)
    {
        const theta = ( (2.0 * i - 1.0) * Math.PI ) / ( 2.0 * filter.order );
        document.getElementById("sp-x" + i ).value = parseFloat(- Math.sin(theta)).toFixed(6);
        document.getElementById("sp-y" + i ).value = parseFloat(Math.cos(theta)).toFixed(6);
    }

    drawFromSplane();
}

function setChebyshev()
{
    filter.name = FilterNames.Chebyshev;
    filter.type = document.getElementById('chebyshevType').value;
    filter.order = document.getElementById('chebyshevOrder').value;

    const rippleDb = Math.pow(document.getElementById('chebyshevRipples').value, 3.0);
    const epsilon = Math.sqrt( Math.pow(10.0, rippleDb / 10.0) - 1.0 );

    for(var i = 0; i < maxOrder; i++)
    {
        zeroType = filter.type == FilterTypes.lowpass;
        document.getElementById("sz-x" + (i+1) ).value = filter.order > i ? 0 : null;
        document.getElementById("sz-y" + (i+1) ).value = filter.order > i ? (zeroType ? closeToInf : 0) : null;
    }
    for(var i = 1; i < maxOrder + 1; i++)
    {
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    for(var i = 1; i <= filter.order; i++)
    {
        const theta = (Math.PI / 2.0) * (2.0 * i - 1.0) / filter.order;
        const re = - Math.sinh( (1.0 / filter.order) * Math.asinh( 1.0 / epsilon ) ) * Math.sin(theta);
        const im = Math.cosh( (1.0 / filter.order) * Math.asinh( 1.0 / epsilon ) ) * Math.cos(theta);

        document.getElementById("sp-x" + i ).value = parseFloat(re).toFixed(6);
        document.getElementById("sp-y" + i ).value = parseFloat(im).toFixed(6);
    }

    if(filter.type == FilterTypes.highpass)
    {
        for(var i = 1; i <= filter.order; i++)
        {
            let pole = Complex(document.getElementById("sp-x" + i ).value, document.getElementById("sp-y" + i ).value);
            let onCircle = pole.sign();
            let reciprocalPole = onCircle.mul({ abs: onCircle.abs() / pole.abs(), arg: 0 });
            document.getElementById("sp-x" + i).value = reciprocalPole.re;
            document.getElementById("sp-y" + i).value = reciprocalPole.im;
        }
    }

    drawFromSplane();
}

function setOnepole()
{
    filter.name = FilterNames.Onepole;
    filter.type = document.getElementById('onepoleType').value;
 
    for(var i = 1; i < maxOrder + 1; i++)
    {
        document.getElementById("sz-x" + i ).value = null;
        document.getElementById("sz-y" + i ).value = null;
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    document.getElementById("sz-x1" ).value = null;
    document.getElementById("sz-y1" ).value = null;
    document.getElementById("sp-x1" ).value = -1;
    document.getElementById("sp-y1" ).value = 0;
       
    drawFromSplane();
}

function setOnepoleZero()
{
    filter.name = FilterNames.Onepole;
    filter.type = document.getElementById('onepoleType').value;
 
    for(var i = 1; i < maxOrder + 1; i++)
    {
        document.getElementById("sz-x" + i ).value = null;
        document.getElementById("sz-y" + i ).value = null;
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    document.getElementById("sz-x1" ).value = 0;
    document.getElementById("sz-y1" ).value = filter.type == FilterTypes.lowpass ? 9999999 : 0;
    document.getElementById("sp-x1" ).value = -1;
    document.getElementById("sp-y1" ).value = 0;
       
    drawFromSplane();
}

function setLinkwitzRiley()
{
    filter.name = FilterNames.LinkwitzRiley;
    filter.type = document.getElementById('linkwitzRileyType').value;
    filter.order = 2 << document.getElementById('linkwitzRileyOrder').value;

    const order = filter.order / 2;
    for(var i = 1; i < order + 1; i++)
    {
        const sZeroY = (filter.type == FilterTypes.lowpass) ? closeToInf : 0;
        document.getElementById("sz-x" + i ).value = 0;
        document.getElementById("sz-x" + (i+order) ).value = 0;
        document.getElementById("sz-y" + i ).value = sZeroY;
        document.getElementById("sz-y" + (i+order) ).value = sZeroY;

        const theta = ( (2.0 * i - 1.0) * Math.PI ) / ( 2.0 * (order) );

        let poleX = document.getElementById("sp-x" + i );
        poleX.value = parseFloat(- Math.sin(theta)).toFixed(6);
        document.getElementById("sp-x" + (i+order) ).value = poleX.value;            
        
        let poleY = document.getElementById("sp-y" + i );
        poleY.value = parseFloat(Math.cos(theta)).toFixed(6);
        document.getElementById("sp-y" + (i+order) ).value = poleY.value;
    }
    for(var i = 2 * order + 1; i < maxOrder + 1; i++)
    {
        document.getElementById("sz-x" + i ).value = null;
        document.getElementById("sz-y" + i ).value = null;
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    drawFromSplane();
}

function setAllpass()
{
    filter.name = FilterNames.Allpass;
    filter.order = document.getElementById('allpassOrder').value;

    for(var i = filter.order; i < maxOrder; i++)
    {
        document.getElementById("sz-x" + i ).value = null;
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sz-y" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    for(var i = 1; i <= filter.order; i++)
    {
        const theta = ( (2.0 * i - 1.0) * Math.PI ) / ( 2.0 * filter.order );
        document.getElementById("sz-x" + i ).value = parseFloat(Math.sin(theta)).toFixed(6);
        document.getElementById("sp-x" + i ).value = parseFloat(- Math.sin(theta)).toFixed(6);
        document.getElementById("sz-y" + i ).value = parseFloat(Math.cos(theta)).toFixed(6);
        document.getElementById("sp-y" + i ).value = parseFloat(Math.cos(theta)).toFixed(6);
    }

    drawFromSplane();
}

///////////////////////// DEBUGGING

function consoleClear()
{
    document.getElementById("console").innerHTML = "";
}

function consoleWrite(text)
{
    let consoleElement = document.getElementById("console");
    consoleElement.innerHTML += text + "<br>";
}

///////////////////////// INITIALIZATION OF DOM ELEMENTS

document.getElementById("samplerate").value = sampleRate;
document.getElementById("frequency").value = filter.frequency / sampleRate;
setFrequency(true);

document.getElementById("sp-x1").value = -1;
document.getElementById("sp-y1").value = 0;
document.getElementById("sz-x1").value = 0;
document.getElementById("sz-y1").value = closeToInf;

///////////////////////// START APPLICATION

drawFromSplane();
