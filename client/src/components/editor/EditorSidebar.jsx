import { useState } from 'react';
import { BackgroundIcon, ChevronLeftIcon, CropIcon, GridIcon, ImageIcon, TextIcon, XIcon } from '../icons';
import { DEFAULT_EDITOR_SETTINGS } from '../../constants/editorSettingsDefaults';
import { useEditorAssets } from '../../hooks/useEditorAssets';
import BackgroundPanel from './sidebar/BackgroundPanel.jsx';
import ElementsPanel from './sidebar/ElementsPanel.jsx';
import FramesPanel from './sidebar/FramesPanel.jsx';
import ImagePanel from './sidebar/ImagePanel.jsx';
import SidebarTab from './sidebar/SidebarTab.jsx';
import TextPanel from './sidebar/TextPanel.jsx';
import { FALLBACK_EDITOR_ASSETS } from './sidebar/fallbackEditorAssets';

const EditorSidebar = ({
    addTextElement,
    addCaptionElement,
    addImageElement,
    addShapeElement,
    uploadedImages,
    deleteUploadedImage,
    canvasBackground,
    setCanvasBackground,
    uploadedBackgrounds,
    addUploadedBackground,
    deleteUploadedBackground,
    onApplyGlobalFrame,
    onRemoveGlobalFrame,
    onSelectGlobalFrame,
    activeGlobalFrameId,
    editorSettings = DEFAULT_EDITOR_SETTINGS,
    colors,
}) => {
    const { assets } = useEditorAssets(FALLBACK_EDITOR_ASSETS);
    const [activeTab, setActiveTab] = useState('background');
    const [isCollapsed, setIsCollapsed] = useState(false);
    /** On mobile: whether the tools panel is open above the tabs */
    const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

    const tabs = [
        { id: 'elements', label: 'אלמנטים', icon: <GridIcon className="w-6 h-6 md:w-7 md:h-7" /> },
        { id: 'frames', label: 'מסגרות', icon: <CropIcon className="w-6 h-6 md:w-7 md:h-7" /> },
        { id: 'background', label: 'רקע', icon: <BackgroundIcon className="w-6 h-6 md:w-7 md:h-7" /> },
        { id: 'text', label: 'טקסט', icon: <TextIcon className="w-6 h-6 md:w-7 md:h-7" /> },
        { id: 'images', label: 'תמונות', icon: <ImageIcon className="w-6 h-6 md:w-7 md:h-7" /> },
    ];

    const handleTabClick = (tabId) => {
        if (activeTab === tabId && mobilePanelOpen) {
            setMobilePanelOpen(false);
            return;
        }
        setActiveTab(tabId);
        setMobilePanelOpen(true);
        if (isCollapsed) setIsCollapsed(false);
    };

    const panelContent = (
        <>
            {activeTab === 'background' && (
                <BackgroundPanel
                    canvasBackground={canvasBackground}
                    setCanvasBackground={setCanvasBackground}
                    uploadedBackgrounds={uploadedBackgrounds}
                    addUploadedBackground={addUploadedBackground}
                    deleteUploadedBackground={deleteUploadedBackground}
                    colors={colors?.length ? colors : assets.colors}
                    backgroundImages={assets.canvasBackgrounds}
                />
            )}
            {activeTab === 'elements' && (
                <ElementsPanel
                    addImageElement={addImageElement}
                    addShapeElement={addShapeElement}
                    shapes={assets.shapes}
                    backgroundAssets={assets.backgroundAssets}
                    graphics={assets.graphics}
                    icons={assets.icons}
                />
            )}
            {activeTab === 'frames' && (
                <FramesPanel
                    editorSettings={editorSettings}
                    activeGlobalFrameId={activeGlobalFrameId}
                    onApplyGlobalFrame={onApplyGlobalFrame}
                    onRemoveGlobalFrame={onRemoveGlobalFrame}
                    onSelectGlobalFrame={onSelectGlobalFrame}
                />
            )}
            {activeTab === 'text' && (
                <TextPanel
                    addTextElement={addTextElement}
                    addCaptionElement={addCaptionElement}
                    captionDefaults={editorSettings.captionDefaults}
                />
            )}
            {activeTab === 'images' && (
                <ImagePanel
                    addImageElement={addImageElement}
                    uploadedImages={uploadedImages}
                    deleteUploadedImage={deleteUploadedImage}
                />
            )}
        </>
    );

    return (
        <>
            {/* —— Mobile: bottom panel + horizontal tabs —— */}
            <aside className="md:hidden shrink-0 z-30 flex flex-col bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                {mobilePanelOpen && (
                    <div className="relative border-b border-gray-100">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
                            <span className="text-sm font-semibold text-gray-800">
                                {tabs.find((t) => t.id === activeTab)?.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobilePanelOpen(false)}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label="סגור פאנל"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="max-h-[42vh] overflow-y-auto overscroll-contain">
                            {panelContent}
                        </div>
                    </div>
                )}
                <div className="flex items-stretch gap-1 p-1.5 bg-white safe-area-pb">
                    {tabs.map((tab) => (
                        <SidebarTab
                            key={tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            isActive={activeTab === tab.id && mobilePanelOpen}
                            compact
                            onClick={() => handleTabClick(tab.id)}
                        />
                    ))}
                </div>
            </aside>

            {/* —— Desktop: classic sidebar —— */}
            <aside
                className={`hidden md:flex bg-white shadow-lg flex-col transition-all duration-300 relative z-10 h-full flex-1 ${
                    isCollapsed ? 'w-24' : 'w-80 lg:w-96'
                }`}
            >
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-1/2 left-0 -translate-x-1/2 z-40 bg-white border border-gray-200 shadow-md rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    data-tooltip={isCollapsed ? 'הרחב סרגל' : 'צמצם סרגל'}
                    data-tooltip-pos="bottom"
                >
                    <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-24 bg-white flex flex-col items-center p-2 space-y-2 border-l border-gray-200 shrink-0 relative">
                        {tabs.map((tab) => (
                            <SidebarTab
                                key={tab.id}
                                icon={tab.icon}
                                label={tab.label}
                                isActive={activeTab === tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (isCollapsed) setIsCollapsed(false);
                                }}
                            />
                        ))}
                    </div>

                    <div
                        className={`flex-1 overflow-y-auto transition-opacity duration-300 ${
                            isCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100 visible'
                        }`}
                    >
                        {panelContent}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default EditorSidebar;