import { Link, useNavigate } from 'react-router-dom';
import ProductSearch from '../ProductSearch';
import WaveDivider from '../WaveDivider';
import { optimizeImageUrl, screenWidthImageSize } from '../../utils/imageUrl';
import { HERO_HEIGHTS, PHOTO_DEVELOPMENT_PATH, tileLink } from './homeContent';

/** The hero image with its wave, the title, search, the photo upload badge and the product tiles */
export default function HomeHero({ draft, heroHeightKey, heroFocus, uploadBadgeText, tiles }) {
    const navigate = useNavigate();

    return (
        <section className="home-hero">
            <div className="home-hero__banner">
                <div
                    className="home-hero__banner-bg"
                    style={{
                        backgroundColor: '#f8dcdb',
                        backgroundImage: draft.mainImg ? `url(${optimizeImageUrl(draft.mainImg, { width: screenWidthImageSize() })})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: `center ${heroFocus}%`,
                        '--hero-height': `${HERO_HEIGHTS[heroHeightKey].px}px`,
                    }}
                >
                    {draft.mainImg ? <div className="home-hero__banner-overlay" /> : null}
                    <WaveDivider fill="#ffffff" className="home-hero__wave" />
                </div>
            </div>

            <div className="home-hero__inner">
                <h1 className="home-hero__title">
                    {draft.title || (<>מה הסיפור<br />שלכם?</>)}
                </h1>

                <ProductSearch className="mb-6" />

                <div className="home-products">
                    <Link
                        to={PHOTO_DEVELOPMENT_PATH}
                        className="home-products__badge"
                        aria-label={uploadBadgeText}
                    >
                        <svg className="home-products__badge-ring" viewBox="0 0 100 100" aria-hidden="true">
                            <defs>
                                <path id="uploadRing" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                            </defs>
                            <text fill="#F2665E" fontSize="9" fontWeight="700">
                                <textPath href="#uploadRing" startOffset="0%" textLength="232" lengthAdjust="spacing">
                                    {`${uploadBadgeText} · `}
                                </textPath>
                            </text>
                        </svg>
                        <span className="home-products__badge-inner" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"
                                viewBox="0 0 24 24" fill="none" stroke="#fff"
                                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 19V5" />
                                <path d="M5 12l7-7 7 7" />
                            </svg>
                        </span>
                    </Link>

                    <div className="home-products__grid">
                        {tiles.map((prod, index) => (
                            <Link
                                key={index}
                                to={tileLink(prod)}
                                aria-label={prod.name || `קטגוריה ${index + 1}`}
                                className="home-products__tile"
                            >
                                <img
                                    src={optimizeImageUrl(prod.image, { width: 600 })}
                                    alt={prod.name || `מוצר ${index + 1}`}
                                    width="600"
                                    height="600"
                                    loading="lazy"
                                />
                                {prod.name ? (
                                    <span className="home-products__tile-label">{prod.name}</span>
                                ) : null}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="home-products__all">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="home-products__all-btn"
                    >
                        {draft.goToAll || "לכל המוצרים"}
                    </button>
                </div>
            </div>
        </section>
    );
}
