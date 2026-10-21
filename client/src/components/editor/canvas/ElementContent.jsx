const TEXT_ALIGN_TO_FLEX = { left: 'flex-start', center: 'center', right: 'flex-end' };
const stopPropagation = (event) => event.stopPropagation();

function FrameContent({ element, isGhost }) {
    return (
        <img
            src={element.src}
            alt=""
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                opacity: isGhost ? 0 : (element.opacity ?? 1),
                pointerEvents: 'none',
                userSelect: 'none',
                display: 'block',
                background: 'transparent',
            }}
            draggable={false}
        />
    );
}

function ImageContent({ element, isGhost }) {
    const filter = `brightness(${element.brightness ?? 100}%) contrast(${element.contrast ?? 100}%) grayscale(${element.grayscale ?? 0}%) sepia(${element.sepia ?? 0}%) blur(${element.blur ?? 0}px)`;
    const transform = `scale(${element.scaleX || 1}, ${element.scaleY || 1})`;

    if (element.crop && element.naturalWidth && element.naturalHeight) {
        // The whole photo, scaled and shifted so only the cropped part shows inside the element
        const cropScale = element.width / element.crop.width;
        return (
            <img
                src={element.src}
                alt=""
                draggable={false}
                style={{
                    position: 'absolute',
                    width: `${element.naturalWidth * cropScale}px`,
                    height: `${element.naturalHeight * cropScale}px`,
                    left: `${-element.crop.x * cropScale}px`,
                    top: `${-element.crop.y * cropScale}px`,
                    opacity: isGhost ? 0 : element.opacity,
                    pointerEvents: 'none',
                    maxWidth: 'none',
                    userSelect: 'none',
                    transform,
                    filter,
                }}
            />
        );
    }
    return (
        <img
            src={element.src}
            alt=""
            draggable={false}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: isGhost ? 0 : element.opacity,
                pointerEvents: 'none',
                transform,
                filter,
            }}
        />
    );
}

/** The shape's SVG (from the admin's shape library) painted in the chosen fill color */
function ShapeContent({ element, isGhost }) {
    const svgContent = element.svgContent.includes('fill=')
        ? element.svgContent.replace(/fill="[^"]*"/g, `fill="${element.fill}"`)
        : element.svgContent.replace('<svg', `<svg fill="${element.fill}"`);
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                opacity: isGhost ? 0 : element.opacity,
                pointerEvents: 'none',
                transform: `scale(${element.scaleX || 1}, ${element.scaleY || 1})`,
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
}

function textStyleOf(element, { isGhost, isEditing }) {
    const hasStroke = element.borderWidth > 0 && element.borderColor && element.borderColor !== 'transparent';
    return {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: TEXT_ALIGN_TO_FLEX[element.textAlign] || 'center',
        fontFamily: element.fontFamily,
        fontSize: `${element.fontSize}px`,
        color: element.color,
        fontWeight: element.bold ? 'bold' : 'normal',
        fontStyle: element.italic ? 'italic' : 'normal',
        textAlign: element.textAlign,
        textDecoration: element.underline ? 'underline' : 'none',
        direction: element.direction,
        padding: '0.5rem',
        cursor: isGhost ? 'default' : (element.locked ? 'not-allowed' : (isEditing ? 'text' : 'move')),
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        userSelect: isEditing ? 'text' : 'none',
        backgroundColor: element.backgroundColor,
        opacity: isGhost ? 0 : element.opacity,
        outline: isEditing ? '2px solid #3B82F6' : 'none',
        outlineOffset: '0px',
        boxSizing: 'border-box',
        ...(hasStroke && { WebkitTextStroke: `${element.borderWidth}px ${element.borderColor}` }),
        ...(element.textShadowEnabled && {
            textShadow: `${element.textShadowOffsetX}px ${element.textShadowOffsetY}px ${element.textShadowBlur}px ${element.textShadowColor}`,
        }),
    };
}

function TextContent({ element, isGhost, isEditing, onRegisterTextNode, onTextInput, onTextBlur, onStartEditing }) {
    const style = textStyleOf(element, { isGhost, isEditing });

    if (isEditing && !element.locked) {
        // Typed into directly; the content is set when editing starts (useTextEditing)
        return (
            <div
                ref={(node) => onRegisterTextNode(element.id, node)}
                contentEditable
                suppressContentEditableWarning
                inputMode="text"
                enterKeyHint="done"
                style={{ ...style, WebkitUserSelect: 'text', userSelect: 'text', touchAction: 'manipulation' }}
                onBlur={(e) => onTextBlur(e, element.id)}
                onInput={(e) => onTextInput(element.id, e.currentTarget.innerText)}
                onMouseDown={stopPropagation}
                onPointerDown={stopPropagation}
                onTouchStart={stopPropagation}
                onClick={stopPropagation}
                onDoubleClick={stopPropagation}
            />
        );
    }
    return (
        <div
            style={style}
            onDoubleClick={!isGhost ? (e) => {
                if (element.locked) return;
                e.stopPropagation();
                onStartEditing(element.id);
            } : undefined}
        >
            {element.content}
        </div>
    );
}

/**
 * What an element looks like on the canvas. A "ghost" is an invisible copy that only gives the
 * selection frame its size and place.
 */
export default function ElementContent({ element, isGhost = false, editing }) {
    if (element.type === 'globalFrame') return <FrameContent element={element} isGhost={isGhost} />;
    if (element.type === 'image') return <ImageContent element={element} isGhost={isGhost} />;
    if (element.type === 'shape') return <ShapeContent element={element} isGhost={isGhost} />;
    return (
        <TextContent
            element={element}
            isGhost={isGhost}
            isEditing={!isGhost && element.id === editing.editingElementId}
            onRegisterTextNode={editing.registerTextNode}
            onTextInput={editing.handleTextInput}
            onTextBlur={editing.handleTextBlur}
            onStartEditing={editing.startTextEditing}
        />
    );
}
