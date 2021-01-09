import { useRef } from 'react';

type SetDrawingParam = { x?: number; y?: number; isDown?: boolean };

const useDrawing = () => {
    const isDown = useRef(false);
    const x = useRef(0);
    const y = useRef(0);

    const set = (param: SetDrawingParam) => {
        const { x: _x, y: _y, isDown: _isDown } = param;

        x.current = _x || x.current;
        y.current = _y || y.current;
        isDown.current = _isDown || isDown.current;
    };

    return [x.current, y.current, isDown.current, set] as [number, number, boolean, typeof set];
};

export default useDrawing;
