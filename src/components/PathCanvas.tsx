import { useContext, useEffect, useRef } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng, Point } from '../utils/map';

import { PathContext } from '../pages/PathPage';
import { MapEvents } from './PathDraw';

interface PathCanvasProps {
    map: any;
    mapElemId: string;
    phase: PathPhase;
    mapEvent: MapEvents;
}

function PathCanvas({ map, mapElemId, phase, mapEvent }: PathCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctx = useRef<CanvasRenderingContext2D | null>(null);
    const stageWidth = useRef(0);
    const stageHeight = useRef(0);
    const path = useContext(PathContext);

    useEffect(() => {
        if (canvasRef.current && map && ['draw', 'viewPath'].includes(phase)) {
            initCavans();

            if (phase === 'draw') {
                initDraw();
            } else if (phase === 'viewPath') {
                const latLng = new kakao.maps.LatLng(path[path.length - 1].Ma, path[path.length - 1].La);
                map.setCenter(latLng);
                drawPath();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, map]);

    useEffect(() => {
        if (mapEvent === 'dragStart' || mapEvent === 'zoomStart') {
            ctx.current?.clearRect(0, 0, stageWidth.current, stageHeight.current);
        }

        if (mapEvent === 'dragEnd' || mapEvent === 'zoomChanged') {
            drawPath();
        }
    }, [mapEvent]);

    const initCavans = () => {
        if (!canvasRef.current) {
            return null;
        }

        canvasRef.current.className = 'canvas';
        const mapElem = document.getElementById(mapElemId);
        ctx.current = canvasRef.current.getContext('2d');

        if (!ctx.current || !mapElem) {
            return null;
        }

        const pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

        stageWidth.current = mapElem.clientWidth;
        stageHeight.current = mapElem.clientHeight;

        canvasRef.current.width = stageWidth.current * pixelRatio;
        canvasRef.current.height = stageHeight.current * pixelRatio;
        ctx.current.scale(pixelRatio, pixelRatio);

        ctx.current.lineWidth = 5;
        ctx.current.strokeStyle = 'red';
        ctx.current.lineCap = 'round';

        // let levelChanging = false;
        // canvasRef.current.addEventListener('wheel', (e) => {
        //     e.preventDefault();
        //     if (Math.abs(e.deltaY) > 5 && !levelChanging) {
        //         levelChanging = true;
        //         map.setLevel(map.getLevel() + Math.sign(e.deltaY), { animate: true });
        //         setTimeout(() => {
        //             levelChanging = false;
        //         }, 50);
        //     }
        // });

        map.relayout();
    };

    const initDraw = () => {
        const mapElem = document.getElementById(mapElemId);

        if (!canvasRef.current || !mapElem) {
            return;
        }
        const mapProjection = map.getProjection();

        let pushcounter = 0;
        let centerMovedX = 0;
        let centerMovedY = 0;

        let initPoint: Point | null = null;

        let isDown = false;

        canvasRef.current.addEventListener('pointerdown', (e) => {
            isDown = true;
            if (!initPoint) {
                initPoint = new kakao.maps.Point(stageWidth.current / 2, stageHeight.current / 2);
                map.setCenter(mapProjection.coordsFromPoint(initPoint));
            }
        });

        canvasRef.current.addEventListener('pointermove', (e) => {
            if (!isDown || !ctx.current) {
                return;
            }

            pushcounter += 1;

            if (
                e.offsetX < 50 ||
                e.offsetY < 50 ||
                e.offsetX > stageWidth.current - 50 ||
                e.offsetY > stageHeight.current - 50
            ) {
                isDown = false;
                const point: Point = new kakao.maps.Point(e.offsetX + centerMovedX, e.offsetY + centerMovedY);
                map.setCenter(mapProjection.coordsFromPoint(point));
                centerMovedX += e.offsetX - stageWidth.current / 2;
                centerMovedY += e.offsetY - stageHeight.current / 2;

                ctx.current.clearRect(0, 0, stageWidth.current, stageHeight.current);
                ctx.current.save();
                ctx.current.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const point: Point = mapProjection.pointFromCoords(path[i]);
                    ctx.current.lineTo(point.x - centerMovedX, point.y - centerMovedY);
                }
                ctx.current.stroke();
                ctx.current.restore();
            } else if (pushcounter >= 5) {
                pushcounter = 0;
                const point: Point = new kakao.maps.Point(e.offsetX + centerMovedX, e.offsetY + centerMovedY);
                const coords: LatLng = mapProjection.coordsFromPoint(point);

                path.push(coords);

                ctx.current.save();
                ctx.current.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const point: Point = mapProjection.containerPointFromCoords(path[i]);
                    ctx.current.lineTo(point.x, point.y);
                }
                ctx.current.stroke();
                ctx.current.restore();
            }
        });

        canvasRef.current.addEventListener('pointerup', (e) => {
            isDown = false;
        });
    };

    const drawPath = () => {
        if (!ctx.current) {
            return;
        }
        const mapProjection = map.getProjection();

        ctx.current.save();
        ctx.current.beginPath();
        for (let i = 0; i < path.length; i++) {
            const point: Point = mapProjection.containerPointFromCoords(new kakao.maps.LatLng(path[i].Ma, path[i].La));
            ctx.current.lineTo(point.x, point.y);
        }
        ctx.current.stroke();
        ctx.current.restore();
    };

    return (
        <canvas ref={canvasRef} className="canvas" style={{ pointerEvents: phase === 'draw' ? 'inherit' : 'none' }} />
    );
}

export default PathCanvas;
