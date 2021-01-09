import { forwardRef } from 'react';

interface PathCanvasProps {}

function PathCanvas(props: PathCanvasProps, ref: any) {
    return <canvas ref={ref} className="canvas"></canvas>;
}

export default forwardRef(PathCanvas);
