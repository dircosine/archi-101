import './Poster.scss';

interface PosterProps {}

function Poster({}: PosterProps) {
    return (
        <section className="Poster">
            <div className="poster">
                <img src="/archi101-poster-0.jpg" alt="poster" />
            </div>
            <div className="poster">
                <img src="/archi101-poster-1.jpg" alt="poster" />
            </div>
            <div className="poster">
                <img src="/archi101-poster-2.jpg" alt="poster" />
            </div>
            <div className="poster">
                <img src="/archi101-poster-3.jpg" alt="poster" />
            </div>

            {/* <div className="buttons">
                    <button onClick={() => setActiveSection('video')}>넵</button>
                    <button onClick={() => setActiveSection('video')}>아뇨</button>
                </div> */}
        </section>
    );
}

export default Poster;
