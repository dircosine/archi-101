import { BASE_NAME } from '../App';
import Poster from '../components/Poster';
import Video from '../components/Video';

function IntroPage() {
    return (
        <>
            <section className="Title">
                <img src={`${BASE_NAME}/title-ko.png`} alt="title - architecture 101" />
                <p>봤어요..?</p>
            </section>
            <Poster />
            <Video />
        </>
    );
}

export default IntroPage;
