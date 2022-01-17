const width = 500;
const height = width;

let sampleRate = 44100.0;
let frequency = 11025.0;

///////////////////////// DRAWING FUNCTIONS

function drawFilterResponse(polePositions, zeroPositions)
{
    var response = document.getElementById("response");
    response.width = width;
    response.height = height;
    response.xMin = 0;
    response.xSize = 100;
    response.yMin = 0;
    response.ySize = 2;

    var ctx = response.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.strokeRect(0, 0, width, height);

    transferFunction = createTransferFunction(polePositions, zeroPositions);
    
    // normalization should be obtained in a different way, as this is only valid for lowpass filters
    const normalization = 1.0 / transferFunction(Complex(1)).abs();
    
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
    ctx.strokeStyle = "#FF0000";
    ctx.stroke();
}

function drawZPlaneCanvas(polePositions)
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
    ctx.strokeRect(0.5 * width, 0, 0.5 * width, height);
    ctx.strokeRect(0, 0.5 * width, height, 0.5 * width);
    
    ctx.beginPath();
    ctx.arc(0.5 * width, 0.5 * height, new Position(zPlane, zPlane.xMin + 1.0, 0.0).x, 0, 2 * Math.PI );
    ctx.stroke();

    for(var i = 0; i < polePositions.length; i++)
    {
        ctx.fillRect(polePositions[i].x - 5, polePositions[i].y - 5, 10, 10);
    }
}

function drawLaplaceCanvas(polePositions)
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
    ctx.strokeRect(0.5 * width, 0, 0.5 * width, height);
    ctx.strokeRect(0, 0.5 * width, height, 0.5 * width);

    consoleWrite(frequency);

    for(var i = 0; i < polePositions.length; i++)
    {
        ctx.fillRect(polePositions[i].x - 5, polePositions[i].y - 5, 10, 10);
    }
}

function draw()
{
    consoleClear();
    
    let analogPoles = [];
    for(let i = 1; i < 5; i++)
    {
        const inputSX = document.getElementById("s-x" + String(i)).value;
        const inputSY = document.getElementById("s-y" + String(i)).value;
        
        if(inputSX && inputSY)
        {
            analogPoles.push(new Position(sPlane, inputSX, inputSY));
        }
    }
    drawLaplaceCanvas(analogPoles);

    let digitalPoles = [];
    consoleWrite("prewarped frequency: " + preWarp(frequency));
    for(var i = 0; i < analogPoles.length; i++)
    {
        analogPole = new Complex(analogPoles[i].valueX, analogPoles[i].valueY);
        analogScaledPole = scaleAnalagPole(analogPole, frequency);
        digitalPole = toDigital(analogScaledPole);
        digitalPoles.push(new Position(zPlane, digitalPole.re, digitalPole.im));
        
        consoleWrite("analog pole: " + analogPole.re + ", " + analogPole.im);
        consoleWrite("scaled analog pole: " + analogScaledPole.re + ", " + analogScaledPole.im);
        consoleWrite("digital pole: " + digitalPole.re + ", " + digitalPole.im);
        consoleWrite("digital pole mag/pha: " + digitalPole.abs() + ", " + digitalPole.arg());
    }
    drawZPlaneCanvas(digitalPoles);

    let digitalZeros = [];
    for(var i = 0; i < digitalPoles.length; i++)
    {
        digitalZeros.push(new Position(zPlane, -1, 0));
    }
    drawFilterResponse(digitalPoles, digitalZeros);
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
    draw();
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

document.getElementById("s-x1").value = -1;
document.getElementById("s-y1").value = 0;

///////////////////////// START APPLICATION

draw();
