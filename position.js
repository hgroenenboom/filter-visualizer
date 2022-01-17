class Position
{
    constructor(canvas, x = 0.0, y = 0.0)
    {
        this.canvas = canvas;
        this.value(x, y);
    }

    position(x, y)
    {
        this.x = x;
        this.y = y;
        this.valueX = this.canvas.xMin + this.canvas.xSize * (x / this.canvas.width);
        this.valueY = this.canvas.yMin + this.canvas.ySize * ((this.canvas.height - y) / this.canvas.height);
    }

    value(x, y)
    {
        this.valueX = x;
        this.valueY = y;
        this.x = this.canvas.width * (x - this.canvas.xMin) / this.canvas.xSize;
        this.y = this.canvas.height - this.canvas.height * (y - this.canvas.yMin) / this.canvas.ySize;
    }
};
