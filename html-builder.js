maxOrder = 12;

function updateMaxOrder(newMaxOrder)
{
    maxOrder = newMaxOrder;

    continuousPolesZerosDiv = document.getElementById("continuous-poles-zeros");
    discretePolesZerosDiv = document.getElementById("discrete-poles-zeros");

    for(var i = 0; i < maxOrder / 4; i++)
    {
        const startIndex = i * 4;
        const endIndex = Math.min(startIndex + 4, maxOrder);

        const style = "display: inline-block;";
        poleSet = document.createElement("div");
        poleSet.style = style;
        zeroSet = document.createElement("div");
        zeroSet.style = style;
        
        for(var j = startIndex; j < endIndex; j++)
        {
            const index = j + 1;
            const style = "padding:5px;";

            pole = document.createElement("div");
            pole.style = style;
            poleName = document.createElement("p");
            poleName.innerText = "pole " + index;
            poleInputX = document.createElement("input");
            poleInputY = document.createElement("input");
            poleInputX.id = "sp-x" + index;
            poleInputY.id = "sp-y" + index;
            poleInputX.oninput = ()=>{ setFromSPlane(); };
            poleInputY.oninput = ()=>{ setFromSPlane(); };

            pole.appendChild(poleName);
            pole.appendChild(poleInputX);
            pole.appendChild(poleInputY);
            poleSet.appendChild(pole);

            zero = document.createElement("div");
            zero.style = style;
            zeroName = document.createElement("p");
            zeroName.innerText = "zero " + index;
            zeroInputX = document.createElement("input");
            zeroInputY = document.createElement("input");
            zeroInputX.id = "sz-x" + index;
            zeroInputY.id = "sz-y" + index;
            zeroInputX.oninput = ()=>{ setFromSPlane(); };
            zeroInputY.oninput = ()=>{ setFromSPlane(); };

            zero.appendChild(zeroName);
            zero.appendChild(zeroInputX);
            zero.appendChild(zeroInputY);
            zeroSet.appendChild(zero);
        }

        continuousPolesZerosDiv.appendChild(poleSet);
        continuousPolesZerosDiv.appendChild(zeroSet);
    }

    for(var i = 0; i < maxOrder / 4; i++)
    {
        const startIndex = i * 4;
        const endIndex = Math.min(startIndex + 4, maxOrder);

        const style = "display: inline-block;";
        poleSet = document.createElement("div");
        poleSet.style = style;
        zeroSet = document.createElement("div");
        zeroSet.style = style;
        
        for(var j = startIndex; j < endIndex; j++)
        {
            const index = j + 1;
            const style = "padding:5px;";

            pole = document.createElement("div");
            pole.style = style;
            poleName = document.createElement("p");
            poleName.innerText = "pole " + index;
            poleInputX = document.createElement("input");
            poleInputY = document.createElement("input");
            poleInputX.id = "zp-x" + index;
            poleInputY.id = "zp-y" + index;
            poleInputX.oninput = ()=>{ setFromZPlane(); };
            poleInputY.oninput = ()=>{ setFromZPlane(); };

            pole.appendChild(poleName);
            pole.appendChild(poleInputX);
            pole.appendChild(poleInputY);
            poleSet.appendChild(pole);

            zero = document.createElement("div");
            zero.style = style;
            zeroName = document.createElement("p");
            zeroName.innerText = "zero " + index;
            zeroInputX = document.createElement("input");
            zeroInputY = document.createElement("input");
            zeroInputX.id = "zz-x" + index;
            zeroInputY.id = "zz-y" + index;
            zeroInputX.oninput = ()=>{ setFromZPlane(); };
            zeroInputY.oninput = ()=>{ setFromZPlane(); };

            zero.appendChild(zeroName);
            zero.appendChild(zeroInputX);
            zero.appendChild(zeroInputY);
            zeroSet.appendChild(zero);
        }

        discretePolesZerosDiv.appendChild(poleSet);
        discretePolesZerosDiv.appendChild(zeroSet);
    }

    const recursiveOrder = Math.min(maxOrder, 8);
    document.getElementById("butterworthOrder").max = recursiveOrder;
    document.getElementById("chebyshevOrder").max = recursiveOrder;
    document.getElementById("linkwitzRileyOrder").max = Math.floor( Math.log2(recursiveOrder) ) - 1;
    document.getElementById("allpassOrder").max = recursiveOrder;
    document.getElementById("movingAverageOrder").max = maxOrder;
}

updateMaxOrder(maxOrder);