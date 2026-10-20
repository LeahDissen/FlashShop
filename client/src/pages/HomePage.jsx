import { useRef, useEffect, useState, useMemo } from "react";
import { getPage } from '../api/pages';
import { getAllTips } from '../api/tips';
import AdminControls from '../components/AdminControls.jsx';
import HomeEditPanel from '../components/home/HomeEditPanel';
import HomeHero from '../components/home/HomeHero';
import HomeSocial from '../components/home/HomeSocial';
import {
    DEFAULT_HERO_FOCUS, DEFAULT_HERO_HEIGHT, DEFAULT_UPLOAD_BADGE_TEXT, HERO_HEIGHTS, INITIAL_DATA,
    homeEditTiles, parseJsonField, readHomeCache, writeHomeCache,
} from '../components/home/homeContent';
import { DEFAULT_TESTIMONIALS } from '../constants/testimonials';
import { useAdminControl } from '../hooks/useAdminControl.jsx';
import useAppStore from '../store/appStore';

/**
 * HomePage — Figma-inspired layout with wave hero.
 *
 * Layout:
 *  - Full-width hero image with the same wave divider as the products page
 *  - Title, search and the product tiles below the wave
 *  - Story, Testimonials, Tips
 */
export default function HomePage() {
    const [cachedHome] = useState(readHomeCache);
    // Don't draw the page until the content arrives, so it does not "jump" when the image and tiles load
    const [isLoaded, setIsLoaded] = useState(Boolean(cachedHome));
    const adminControls = useAdminControl(cachedHome ? { ...INITIAL_DATA, ...cachedHome } : INITIAL_DATA, "home");
    const { draft, updateDraft, editMode } = adminControls;

    const setClubOpen = useAppStore(state => state.setClubOpen);
    const [recentTips, setRecentTips] = useState([]);

    // Track if we already loaded data — prevent double-fetch
    const loadedRef = useRef(false);

    /** Show club popup after 8s if not dismissed this session */
    useEffect(() => {
        const dismissed = sessionStorage.getItem("club-popup-dismissed");
        if (dismissed) return;
        const timer = setTimeout(() => {
            if (!sessionStorage.getItem("club-popup-dismissed")) setClubOpen(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, [setClubOpen]);

    /** Fetch CMS data and tips exactly once on mount */
    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        getPage("home").then((data) => {
            data.products = parseJsonField(data.products, []);
            data.testimonials = parseJsonField(data.testimonials, DEFAULT_TESTIMONIALS);
            adminControls.setPage(data);
            adminControls.setDraft(data);
            setIsLoaded(true);
            writeHomeCache(data);
        });

        getAllTips(1, 2)
            .then((data) => { if (data?.tips) setRecentTips(data.tips); })
            .catch((err) => console.error("Failed to fetch tips:", err));
    }); // intentionally no dependency array — the ref guard prevents double-execution

    const heroHeightKey = HERO_HEIGHTS[draft.heroHeight] ? draft.heroHeight : DEFAULT_HERO_HEIGHT;
    const heroFocus = Number.isFinite(Number(draft.heroFocus)) ? Number(draft.heroFocus) : DEFAULT_HERO_FOCUS;

    const uploadBadgeText = (draft.uploadBadgeText || '').trim() || DEFAULT_UPLOAD_BADGE_TEXT;
    const editTiles = useMemo(() => homeEditTiles(draft.products), [draft.products]);
    /** The shop shows only tiles that have an image – no empty slots */
    const visibleTiles = useMemo(() => editTiles.filter((prod) => prod?.image), [editTiles]);

    const viewContent = !isLoaded ? (
        <div className="w-full min-h-screen bg-white" aria-busy="true" />
    ) : (
        <div className="w-full bg-white overflow-x-hidden">
            <HomeHero
                draft={draft}
                heroHeightKey={heroHeightKey}
                heroFocus={heroFocus}
                uploadBadgeText={uploadBadgeText}
                tiles={visibleTiles}
            />

            {/* ══ STORY ═════════════════════════════════════════════════════ */}
            <section className="home-story">
                <div className="home-story__inner">
                    <h2 className="home-story__title">
                        {draft.titleAbout || "זה הסיפור שלנו <"}
                    </h2>
                    <p className="home-story__text">{draft.textAbout}</p>
                </div>
            </section>

            <HomeSocial draft={draft} recentTips={recentTips} />
        </div>
    );

    return (
        <div className="w-full">
            <AdminControls
                editMode={editMode}
                previewContent={(
                    <HomeEditPanel
                        draft={draft}
                        updateDraft={updateDraft}
                        heroHeightKey={heroHeightKey}
                        heroFocus={heroFocus}
                        editTiles={editTiles}
                    />
                )}
                adminControls={adminControls}
            >
                {viewContent}
            </AdminControls>
        </div>
    );
}
