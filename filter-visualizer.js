// Sources:
// - https://www.dsprelated.com/showarticle/1119.php
// - https://www.chegg.com/homework-help/questions-and-answers/filter-type-ts-s-plane-singularities-low-pass-lp-aole-oo-o-10-dc-gain-2-20-0-b-high-pass-h-q34343154
// - Will C Pirkle - Designing Audio Effect Plugins in C++
// - Steven W Smith - The Scientist and Engineer's Guide to Digital Signal Processing
// - https://www.allaboutcircuits.com/technical-articles/understanding-butterworth-filter-pole-locations/ 

//////////////////////// GLOBALS

const maxOrder = 8;

const width = 500;
const height = width;

let sampleRate = 44100.0;
let frequency = 11025.0;
let type = 0;

function todos()
{
    return "TODOs: <br>\
    - improve filter normalization; currently only works when using the first view (global controls)<br>\
    - rename all mentions of 'analog' and 'digital'<br>";
}

///////////////////////// DRAWING FUNCTIONS

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
    const frequencyPos = new Position(response, response.xSize * frequency / (0.5 * sampleRate), 0);
    ctx.strokeRect(frequencyPos.x, 1, 0, height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(frequencyPos.x - 10, 1, 20, 16);
    ctx.fillStyle = "#000000";
    ctx.fillText("\u03C9", frequencyPos.x - 4, 12, 8);
    
    transferFunction = createTransferFunction(polePositions, zeroPositions);
    
    // TODO: find a better way to show the normalized frequency response
    let normalization = 1.0;
    if(type == 0)
    {
        normalization = 1.0 / transferFunction(Complex(1)).abs();
    }
    else if(type == 1)
    {
        normalization = 1.0 / transferFunction(Complex(-1)).abs();
    }
    // Bandpass: 
    // else if(type == 2)
    // {
    //     const magnitudeAtFrequency = transferFunction(new Complex({ arg: (frequency / (0.5 * sampleRate) * Math.PI), abs: 1.0 })).abs();
    //     normalization = 1.0 / magnitudeAtFrequency;
    // }
    
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

function updateDigitalPoleZeros(digitalPoles, digitalZeros)
{
    for(var i = 0; i < digitalPoles.length; i++)
    {
        document.getElementById('zp-x' + (i + 1)).value = digitalPoles[i].valueX.toFixed(6);
        document.getElementById('zp-y' + (i + 1)).value = digitalPoles[i].valueY.toFixed(6);
    }
    for(var i = digitalPoles.length; i < maxOrder; i++)
    {
        document.getElementById('zp-x' + (i + 1)).value = null;
        document.getElementById('zp-y' + (i + 1)).value = null;
    }
    for(var i = 0; i < digitalZeros.length; i++)
    {
        document.getElementById('zz-x' + (i + 1)).value = digitalZeros[i].valueX.toFixed(6);
        document.getElementById('zz-y' + (i + 1)).value = digitalZeros[i].valueY.toFixed(6);
    }
    for(var i = digitalZeros.length; i < maxOrder; i++)
    {
        document.getElementById('zz-x' + (i + 1)).value = null;
        document.getElementById('zz-y' + (i + 1)).value = null;
    }
}

function updateAnalogPoleZeros(analogPoles, analogZeros)
{
    console.log(analogPoles);

    for(var i = 0; i < analogPoles.length; i++)
    {
        document.getElementById('sp-x' + (i + 1)).value = analogPoles[i].valueX.toFixed(6);
        document.getElementById('sp-y' + (i + 1)).value = analogPoles[i].valueY.toFixed(6);
    }
    for(var i = analogPoles.length; i < maxOrder; i++)
    {
        document.getElementById('sp-x' + (i + 1)).value = null;
        document.getElementById('sp-y' + (i + 1)).value = null;
    }
    for(var i = 0; i < analogZeros.length; i++)
    {
        document.getElementById('sz-x' + (i + 1)).value = analogZeros[i].valueX.toFixed(6);
        document.getElementById('sz-y' + (i + 1)).value = analogZeros[i].valueY.toFixed(6);
    }
    for(var i = analogZeros.length; i < maxOrder; i++)
    {
        document.getElementById('sz-x' + (i + 1)).value = null;
        document.getElementById('sz-y' + (i + 1)).value = null;
    }
}

function drawFromSplane()
{
    consoleClear();
    consoleWrite(todos());
    consoleWrite("current frequency: " + frequency);
    consoleWrite("prewarped frequency: " + preWarp(frequency));
    
    let analogPoles = [];
    let analogZeros = [];
    for(let i = 1; i < maxOrder + 1; i++)
    {
        const inputSPX = document.getElementById("sp-x" + String(i)).value;
        const inputSPY = document.getElementById("sp-y" + String(i)).value;
        const inputSZX = document.getElementById("sz-x" + String(i)).value;
        const inputSZY = document.getElementById("sz-y" + String(i)).value;
        
        if(inputSPX && inputSPY)
        {
            analogPoles.push(new Position(sPlane, inputSPX, inputSPY));
        }
        if(inputSZX && inputSZY)
        {
            analogZeros.push(new Position(sPlane, inputSZX, inputSZY));
        }
    }

    drawLaplaceCanvas(analogPoles, analogZeros);

    let digitalPoles = [];
    for(var i = 0; i < analogPoles.length; i++)
    {
        analogPole = new Complex(analogPoles[i].valueX, analogPoles[i].valueY);
        analogScaledPole = scaleAnalagVariable(analogPole, frequency);
        digitalPole = toDigital(analogScaledPole);
        digitalPoles.push(new Position(zPlane, digitalPole.re, digitalPole.im));
    }
    
    let digitalZeros = [];
    for(var i = 0; i < analogZeros.length; i++)
    {
        analogZero = new Complex(analogZeros[i].valueX, analogZeros[i].valueY);
        analogScaledZero  = scaleAnalagVariable(analogZero, frequency);
        digitalZero = toDigital(analogScaledZero);
        digitalZeros.push(new Position(zPlane, digitalZero.re, digitalZero.im));
    }

    updateDigitalPoleZeros(digitalPoles, digitalZeros);

    drawZPlaneCanvas(digitalPoles, digitalZeros);

    drawFilterResponse(digitalPoles, digitalZeros);
}

function drawFromZPlane()
{
    consoleClear();
    consoleWrite(todos());
    consoleWrite("current frequency: " + frequency);
    consoleWrite("prewarped frequency: " + preWarp(frequency));

    let digitalPoles = [];
    let digitalZeros = [];
    for(let i = 1; i < maxOrder + 1; i++)
    {
        const inputZPX = document.getElementById("zp-x" + String(i)).value;
        const inputZPY = document.getElementById("zp-y" + String(i)).value;
        const inputZZX = document.getElementById("zz-x" + String(i)).value;
        const inputZZY = document.getElementById("zz-y" + String(i)).value;
        
        if(inputZPX && inputZPY)
        {
            digitalPoles.push(new Position(zPlane, inputZPX, inputZPY));
        }
        if(inputZZX && inputZZY)
        {
            digitalZeros.push(new Position(zPlane, inputZZX, inputZZY));
        }
    }
    
    drawZPlaneCanvas(digitalPoles, digitalZeros);

    drawFilterResponse(digitalPoles, digitalZeros);

    let analogPoles = [];
    for(var i = 0; i < digitalPoles.length; i++)
    {
        digitalPole = new Complex(digitalPoles[i].valueX, digitalPoles[i].valueY);
        analogPole = toAnalog(digitalPole);
        downScaledAnalogPole = normalizeAnalogVariable(analogPole, frequency);
        analogPoles.push( new Position(sPlane, downScaledAnalogPole.re, downScaledAnalogPole.im) );
    }
    
    let analogZeros = [];
    for(var i = 0; i < digitalZeros.length; i++)
    {
        digitalZero = new Complex(digitalZeros[i].valueX, digitalZeros[i].valueY);
        analogZero = toAnalog(digitalZero);
        downScaledAnalogZero = normalizeAnalogVariable(analogZero, frequency);
        analogZeros.push( new Position(sPlane, downScaledAnalogZero.re, downScaledAnalogZero.im) );
    }

    updateAnalogPoleZeros(analogPoles, analogZeros);

    drawLaplaceCanvas(analogPoles, analogZeros);
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

    frequency = box.value;
    drawFromSplane();
}

function setButterworth()
{
    type = document.getElementById('butterworthType').value;
    const order = document.getElementById('butterworthOrder').value;

    for(var i = 0; i < maxOrder; i++)
    {
        zeroType = type;
        document.getElementById("sz-x" + (i+1) ).value = order > i ? 0 : null;
        document.getElementById("sz-y" + (i+1) ).value = order > i ? ( zeroType == 0 ? 9999999 : 0 ) : null;
    }
    for(var i = 1; i < maxOrder + 1; i++)
    {
        document.getElementById("sp-x" + i ).value = null;
        document.getElementById("sp-y" + i ).value = null;
    }

    for(var i = 1; i <= order; i++)
    {
        const theta = ( (2.0 * i - 1.0) * Math.PI ) / ( 2.0 * order );
        document.getElementById("sp-x" + i ).value = parseFloat(- Math.sin(theta)).toFixed(6);
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
document.getElementById("frequency").value = frequency;
setFrequency(false);

document.getElementById("sp-x1").value = -1;
document.getElementById("sp-y1").value = 0;
document.getElementById("sz-x1").value = 0;
document.getElementById("sz-y1").value = 9999999;

///////////////////////// START APPLICATION

drawFromSplane();
