import { useEffect, useRef } from 'react';

const useCanvas = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    const ctx = useRef<CanvasRenderingContext2D>();

    useEffect(() => {
        if (ref && ref.current) {
            console.log('get Ref!');
            ctx.current = ref.current.getContext('2d')!;
        }
    }, [ref]);

    return [ref, ref.current, ctx.current] as [typeof ref, HTMLCanvasElement, typeof ctx.current];
};

export default useCanvas;
