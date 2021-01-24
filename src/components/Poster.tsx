import { useEffect } from 'react';
import './Poster.scss';

interface PosterProps {}

const degrees = [4, -4, 1, -7, 8, 3, -2];

function Poster(props: PosterProps) {
    useEffect(() => {
        const posters = document.getElementsByClassName('poster');

        for (let i = 0; i < posters.length; i++) {
            const poster = posters.item(i);
            poster?.setAttribute('style', `transform: rotate(${degrees[i]}deg)`);
        }
    }, []);

    return (
        <section className="Poster">
            <div className="poster">
                <img src="/archi101-poster-0.jpg" alt="poster" />
                {/* <img src="https://archi101.s3.ap-northeast-2.amazonaws.com/archi101-poster-0.jpg" alt="poster" /> */}
            </div>
            <div className="poster">
                <img src="/archi101-poster-1.jpg" alt="poster" />
                {/* <img src="https://archi101.s3.ap-northeast-2.amazonaws.com/archi101-poster-1.jpg" alt="poster" /> */}
            </div>
            <div className="poster">
                <img src="/archi101-poster-2.jpg" alt="poster" />
                {/* <img src="https://archi101.s3.ap-northeast-2.amazonaws.com/archi101-poster-2.jpg" alt="poster" /> */}
            </div>
            <div className="poster">
                <img src="/archi101-poster-3.jpg" alt="poster" />
                {/* <img src="https://archi101.s3.ap-northeast-2.amazonaws.com/archi101-poster-3.jpg" alt="poster" /> */}
            </div>
        </section>
    );
}

export default Poster;
