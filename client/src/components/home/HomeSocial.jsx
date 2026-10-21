import { Link, useNavigate } from 'react-router-dom';
import Testimonials from '../Testimonials';
import { useTipsStore } from '../../store/tipsStore';
import { optimizeImageUrl } from '../../utils/imageUrl';
import { truncateText } from './homeContent';

/** The pink band: customers' testimonials and the two latest tips */
export default function HomeSocial({ draft, recentTips }) {
    const navigate = useNavigate();
    const setCurrentTip = useTipsStore(state => state.setCurrentTip);

    return (
        <div className="home-social">
            <svg
                viewBox="0 0 1440 90"
                style={{ display: 'block', width: '100%', height: 72, marginBottom: -2 }}
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <path
                    fill="#fda49e"
                    d="M0,50 C180,90 360,10 540,45 C720,80 900,15 1080,50 C1260,85 1380,30 1440,45 L1440,90 L0,90 Z"
                />
            </svg>

            <div className="home-social__band">
                <h3 className="home-social__title">
                    {draft.titleTestimonials || "תראו מה מספרים עלינו <"}
                </h3>
                <Testimonials items={draft.testimonials} />

                <div className="home-tips">
                    {recentTips.length > 0 ? (
                        recentTips.map((tip) => (
                            <Link
                                to="/tips/tip_page"
                                key={tip._id}
                                onClick={() => setCurrentTip(tip)}
                                className="home-tips__card"
                            >
                                <div className="home-tips__img">
                                    <img src={optimizeImageUrl(tip.img, { width: 600 })} alt={tip.title} loading="lazy" decoding="async" />
                                </div>
                                <div className="home-tips__body">
                                    <h4 className="line-clamp-1">
                                        {tip.title ? tip.title.split(":")[0].trim() : ""}
                                    </h4>
                                    <p className="line-clamp-3">
                                        {truncateText(tip.summary || tip.content, 90)}
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-center text-white/80 text-sm" style={{ gridColumn: '1 / -1' }}>
                            טוען טיפים...
                        </p>
                    )}
                </div>

                <div className="home-tips__cta">
                    <button
                        type="button"
                        onClick={() => navigate('/tips')}
                        className="home-tips__cta-btn"
                    >
                        {draft.goToTips || "לכל הטיפים"}
                    </button>
                </div>
            </div>
        </div>
    );
}
