import { useEffect, useRef } from 'react';
import { PathPhase } from '../pages/PathPage';
import { LatLng, Point } from '../utils/map';

interface PathCanvasProps {
    map: any;
    mapElemId: string;
    phase: PathPhase;
}

function PathCanvas({ map, mapElemId, phase }: PathCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && phase === 'draw') {
            initCavans();
        }
    }, [phase]);

    const initCavans = () => {
        if (!canvasRef.current) {
            return;
        }

        const mapElem = document.getElementById(mapElemId);
        const ctx = canvasRef.current.getContext('2d');

        let isDown = false;

        canvasRef.current.className = 'canvas';

        if (!ctx || !mapElem) {
            return;
        }

        const pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

        const stageWidth = mapElem.clientWidth;
        const stageHeight = mapElem.clientHeight;

        canvasRef.current.width = stageWidth * pixelRatio;
        canvasRef.current.height = stageHeight * pixelRatio;
        ctx.scale(pixelRatio, pixelRatio);

        ctx.lineWidth = 5;
        ctx.strokeStyle = 'red';
        ctx.lineCap = 'round';

        let interval: NodeJS.Timeout;

        let mapProjection: any = map.current.getProjection();
        const path: LatLng[] = [];

        canvasRef.current.addEventListener('pointerdown', (e) => {
            isDown = true;
            if (ctx) {
            }
        });

        let pushcounter = 0;
        let centerMovedX = 0;
        let centerMovedY = 0;
        canvasRef.current.addEventListener('pointermove', (e) => {
            if (!isDown || !ctx) {
                return;
            }

            if (e.offsetX < 50 || e.offsetY < 50 || e.offsetX > stageWidth - 50 || e.offsetY > stageHeight - 50) {
                isDown = false;
                const point: Point = new kakao.maps.Point(e.offsetX + centerMovedX, e.offsetY + centerMovedY);
                map.current.setCenter(mapProjection.coordsFromPoint(point));
                centerMovedX += e.offsetX - stageWidth / 2;
                centerMovedY += e.offsetY - stageHeight / 2;

                ctx.clearRect(0, 0, stageWidth, stageHeight);
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const point: Point = mapProjection.pointFromCoords(path[i]);
                    ctx.lineTo(point.x - centerMovedX, point.y - centerMovedY);
                }
                ctx.stroke();
                ctx.restore();
            }

            pushcounter += 1;

            if (pushcounter >= 5) {
                pushcounter = 0;
                const point: Point = new kakao.maps.Point(e.offsetX + centerMovedX, e.offsetY + centerMovedY);
                const coords: LatLng = mapProjection.coordsFromPoint(point);

                path.push(coords);

                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const point: Point = mapProjection.containerPointFromCoords(path[i]);
                    ctx.lineTo(point.x, point.y);
                }
                ctx.stroke();
                ctx.restore();
            }
        });

        canvasRef.current.addEventListener('pointerup', (e) => {
            isDown = false;

            clearInterval(interval);
        });

        let levelChanging = false;
        canvasRef.current.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (Math.abs(e.deltaY) > 5 && !levelChanging) {
                levelChanging = true;
                map.current.setLevel(map.current.getLevel() + Math.sign(e.deltaY), { animate: true });
                setTimeout(() => {
                    levelChanging = false;
                }, 50);
            }
        });
    };

    return <canvas ref={canvasRef} className="canvas" style={{ display: phase === 'draw' ? 'inherit' : 'none' }} />; // hidden={phase !== 'drawing'}
}

export default PathCanvas;
