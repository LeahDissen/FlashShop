import React, { useRef, useState, useEffect } from 'react';
import { RotateIcon, TrashIcon, LockIcon, UnlockIcon, DuplicateIcon } from '../icons';
import { ReactCrop } from 'react-image-crop';

const rotatePoint = (point, angleDegrees) => {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
};

const getCursorForHandle = (handle, rotation) => {
  let angle = 0;
  switch (handle) {
    case 'tr': angle = 45; break;
    case 'br': angle = 135; break;
    case 'bl': angle = 225; break;
    case 'tl': angle = 315; break;
    default: break;
  }
  let totalAngle = (angle + rotation) % 360;

  if (totalAngle < 0) totalAngle += 360;

  if ((totalAngle >= 0 && totalAngle < 22.5) || (totalAngle >= 337.5 && totalAngle < 360)) return 'ew-resize';
  if (totalAngle >= 22.5 && totalAngle < 67.5) return 'nesw-resize';
  if (totalAngle >= 67.5 && totalAngle < 112.5) return 'ns-resize';
  if (totalAngle >= 112.5 && totalAngle < 157.5) return 'nwse-resize';
  if (totalAngle >= 157.5 && totalAngle < 202.5) return 'ew-resize';
  if (totalAngle >= 202.5 && totalAngle < 247.5) return 'nesw-resize';
  if (totalAngle >= 247.5 && totalAngle < 292.5) return 'ns-resize';
  if (totalAngle >= 292.5 && totalAngle < 337.5) return 'nwse-resize';

  return 'default'; // fallback
};

const Canvas = ({ 
  elements, 
  selectedElementId, 
  setSelectedElementId, 
  updateElement, 
  croppingElementId, 
  onSaveCrop, 
  onCancelCrop, 
  onDelete, 
  onDuplicate, 
  onToggleLock, 
  canvasBackground, 
  showGrid, 
  gridSize, 
  zoom 
}) => {
  const [editingElementId, setEditingElementId] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const cropImageRef = useRef(null);

  const dragInfo = useRef({
    isDragging: false,
    elementId: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialTop: 0,
    initialLeft: 0,
  });

  const rotationInfo = useRef({
    isRotating: false,
    elementId: null,
    centerX: 0,
    centerY: 0,
    startAngle: 0,
    initialRotation: 0,
  });

  const resizeInfo = useRef({
    isResizing: false,
    elementId: null,
    handle: '',
    initialWidth: 0,
    initialHeight: 0,
    initialTop: 0,
    initialLeft: 0,
    initialRotation: 0,
    initialMouseX: 0,
    initialMouseY: 0,
    aspectRatio: 1,
  });

  const scale = zoom / 100;
  const selectedElement = elements.find(el => el.id === selectedElementId);

  useEffect(() => {
    if (!croppingElementId) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [croppingElementId]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if editing text inside the canvas
      if (editingElementId) return;

      // Skip if interacting with form inputs outside canvas
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        if (croppingElementId) {
          onCancelCrop();
        } else {
          setSelectedElementId(null);
        }
        return;
      }

      const currentSelectedElement = elements.find(el => el.id === selectedElementId);
      if (!selectedElementId || !currentSelectedElement || croppingElementId) return;

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!currentSelectedElement.locked) {
          onDelete();
        }
        return;
      }

      // Duplicate (Ctrl+D / Cmd+D)
      if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentSelectedElement.locked) {
          onDuplicate();
        }
        return;
      }

      // Arrow Movement
      if (currentSelectedElement.locked) return;

      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 10 : 1; // Shift for faster movement

      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        updateElement(selectedElementId, {
          left: currentSelectedElement.left + dx,
          top: currentSelectedElement.top + dy
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedElementId, editingElementId, croppingElementId, updateElement, onDelete, onDuplicate, setSelectedElementId, onCancelCrop]);

  // Global event listeners for Drag, Rotate, Resize
  useEffect(() => {
    if (!isInteracting) return;

    const handleGlobalMouseMove = (e) => {
      // Dragging Logic
      if (dragInfo.current.isDragging && dragInfo.current.elementId) {
        const dx = (e.clientX - dragInfo.current.initialMouseX) / scale;
        const dy = (e.clientY - dragInfo.current.initialMouseY) / scale;

        const newTop = dragInfo.current.initialTop + dy;
        const newLeft = dragInfo.current.initialLeft + dx;

        updateElement(dragInfo.current.elementId, { top: newTop, left: newLeft });
      }
      // Rotation Logic
      else if (rotationInfo.current.isRotating && rotationInfo.current.elementId) {
        const { centerX, centerY, startAngle, initialRotation } = rotationInfo.current;
        const currentX = e.clientX - centerX;
        const currentY = e.clientY - centerY;
        const currentAngle = Math.atan2(currentY, currentX) * (180 / Math.PI);

        let newRotation = initialRotation + (currentAngle - startAngle);
        updateElement(rotationInfo.current.elementId, { rotation: newRotation });
      }
      // Resize Logic
      else if (resizeInfo.current.isResizing && resizeInfo.current.elementId) {
        const {
          elementId, handle, initialWidth, initialHeight, initialTop, initialLeft,
          initialRotation, initialMouseX, initialMouseY, aspectRatio
        } = resizeInfo.current;

        const dx = (e.clientX - initialMouseX) / scale;
        const dy = (e.clientY - initialMouseY) / scale;

        const rotatedDelta = rotatePoint({ x: dx, y: dy }, -initialRotation);

        let tempNewWidth = initialWidth;
        let tempNewHeight = initialHeight;

        if (handle.includes('r')) {
          tempNewWidth += rotatedDelta.x;
        } else { // 'l'
          tempNewWidth -= rotatedDelta.x;
        }

        if (handle.includes('b')) {
          tempNewHeight += rotatedDelta.y;
        } else { // 't'
          tempNewHeight -= rotatedDelta.y;
        }

        let newWidth, newHeight;
        if (Math.abs(tempNewWidth - initialWidth) > Math.abs(tempNewHeight - initialHeight)) {
          newWidth = tempNewWidth;
          newHeight = tempNewWidth / aspectRatio;
        } else {
          newHeight = tempNewHeight;
          newWidth = tempNewHeight * aspectRatio;
        }

        const minSize = 20;
        if (newWidth < minSize) {
          newWidth = minSize;
          newHeight = minSize / aspectRatio;
        }
        if (newHeight < minSize) {
          newHeight = minSize;
          newWidth = minSize * aspectRatio;
        }

        const deltaW = newWidth - initialWidth;
        const deltaH = newHeight - initialHeight;

        let shiftX = deltaW / 2;
        let shiftY = deltaH / 2;

        if (handle.includes('l')) {
          shiftX = -shiftX;
        }
        if (handle.includes('t')) {
          shiftY = -shiftY;
        }

        const rotatedShift = rotatePoint({ x: shiftX, y: shiftY }, initialRotation);

        const initialCenterX = initialLeft + initialWidth / 2;
        const initialCenterY = initialTop + initialHeight / 2;
        const newCenterX = initialCenterX + rotatedShift.x;
        const newCenterY = initialCenterY + rotatedShift.y;

        const newTop = newCenterY - newHeight / 2;
        const newLeft = newCenterX - newWidth / 2;

        updateElement(elementId, { width: newWidth, height: newHeight, top: newTop, left: newLeft });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsInteracting(false);
      if (dragInfo.current.isDragging) {
        dragInfo.current = { ...dragInfo.current, isDragging: false, elementId: null };
      }
      if (rotationInfo.current.isRotating) {
        rotationInfo.current = { ...rotationInfo.current, isRotating: false, elementId: null };
      }
      if (resizeInfo.current.isResizing) {
        resizeInfo.current = { ...resizeInfo.current, isResizing: false, elementId: null };
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isInteracting, scale, updateElement]);

  const handleTextChange = (id, content) => {
    updateElement(id, { content });
  };

  const handleBlur = (e, elementId) => {
    handleTextChange(elementId, e.currentTarget.innerText);
    setEditingElementId(null);
  };

  const handleDoubleClick = (e, elementId) => {
    e.stopPropagation();
    setEditingElementId(elementId);

    const target = e.currentTarget;
    setTimeout(() => {
      target.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  };

  const handleMouseDown = (e, el) => {
    if (el.id === croppingElementId || el.locked) return;
    if (el.type === 'text' && el.id === editingElementId) return;

    e.preventDefault();
    e.stopPropagation();

    setSelectedElementId(el.id);

    dragInfo.current = {
      isDragging: true,
      elementId: el.id,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialTop: el.top,
      initialLeft: el.left,
    };
    setIsInteracting(true);
  };

  const handleRotationStart = (e, el) => {
    if (el.locked) return;
    e.preventDefault();
    e.stopPropagation();

    // When using the ghost overlay, we need to find the ghost wrapper's bounding rect
    // The event target is the rotation handle, parent is the ghost wrapper
    const wrapper = e.currentTarget.parentElement;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startX = e.clientX - centerX;
    const startY = e.clientY - centerY;
    const startAngle = Math.atan2(startY, startX) * (180 / Math.PI);

    rotationInfo.current = {
      isRotating: true,
      elementId: el.id,
      centerX,
      centerY,
      startAngle,
      initialRotation: el.rotation || 0,
    };
    setIsInteracting(true);
  };

  const handleResizeStart = (e, el, handle) => {
    if (el.locked || (el.type !== 'image' && el.type !== 'shape')) return;

    e.preventDefault();
    e.stopPropagation();

    const resizableEl = el;

    resizeInfo.current = {
      isResizing: true,
      elementId: el.id,
      handle,
      initialWidth: resizableEl.width,
      initialHeight: resizableEl.height,
      initialTop: el.top,
      initialLeft: el.left,
      initialRotation: el.rotation || 0,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      aspectRatio: resizableEl.width / resizableEl.height,
    };
    setIsInteracting(true);
  };

  const handleSaveCurrentCrop = (elementId) => {
    if (!completedCrop || !cropImageRef.current || completedCrop.width === 0 || completedCrop.height === 0) {
      onCancelCrop();
      return;
    }
    const imageEl = cropImageRef.current;
    const scaleX = imageEl.naturalWidth / imageEl.width;
    const scaleY = imageEl.naturalHeight / imageEl.height;

    const finalCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
      unit: 'px',
    };
    onSaveCrop(elementId, finalCrop);
  };

  const handleImageLoadForCropping = (e) => {
    const { width, height } = e.currentTarget;
    const elementToCrop = elements.find(el => el.id === croppingElementId);

    if (!elementToCrop || elementToCrop.type !== 'image') {
      onCancelCrop();
      return;
    }

    if (elementToCrop.crop && elementToCrop.naturalWidth && elementToCrop.naturalHeight) {
      const currentCrop = elementToCrop.crop;
      const newCrop = {
        unit: 'px',
        x: (currentCrop.x / elementToCrop.naturalWidth) * width,
        y: (currentCrop.y / elementToCrop.naturalHeight) * height,
        width: (currentCrop.width / elementToCrop.naturalWidth) * width,
        height: (currentCrop.height / elementToCrop.naturalHeight) * height,
      };
      setCrop(newCrop);
    } else {
      const newCrop = {
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90,
      };
      setCrop(newCrop);
    }
  };

  const canvasDynamicStyles =
    canvasBackground.type === 'color'
      ? { backgroundColor: canvasBackground.value }
      : {
        backgroundImage: `url(${canvasBackground.value})`,
        backgroundSize: canvasBackground.size || 'cover',
        backgroundPosition: canvasBackground.position || 'center',
        backgroundRepeat: canvasBackground.repeat || 'no-repeat',
      };

  const gridCellSize = 350 / gridSize;

  // Helper to render element content (used for both real element and selection ghost)
  const renderElementContent = (el, isGhost = false) => {
    const elIsImage = el.type === 'image';
    const elIsShape = el.type === 'shape';

    if (el.type === 'image') {
      const imgEl = el;
      const filterStyle = `brightness(${imgEl.brightness ?? 100}%) contrast(${imgEl.contrast ?? 100}%) grayscale(${imgEl.grayscale ?? 0}%) sepia(${imgEl.sepia ?? 0}%) blur(${imgEl.blur ?? 0}px)`;
      const imageTransform = `scale(${imgEl.scaleX || 1}, ${imgEl.scaleY || 1})`;

      const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: isGhost ? 0 : el.opacity, // Invisible if ghost
        pointerEvents: 'none', // Images never capture pointer events directly, the wrapper does
        transform: imageTransform,
        filter: filterStyle,
      };

      if (imgEl.crop && imgEl.naturalWidth && imgEl.naturalHeight) {
        const scale = imgEl.width / imgEl.crop.width;
        const croppedStyle = {
          position: 'absolute',
          width: `${imgEl.naturalWidth * scale}px`,
          height: `${imgEl.naturalHeight * scale}px`,
          left: `${-imgEl.crop.x * scale}px`,
          top: `${-imgEl.crop.y * scale}px`,
          opacity: isGhost ? 0 : imgEl.opacity,
          pointerEvents: 'none',
          maxWidth: 'none',
          userSelect: 'none',
          transform: imageTransform,
          filter: filterStyle,
        };
        return <img src={imgEl.src} alt="" style={croppedStyle} draggable={false} />;
      } else {
        return <img src={el.src} alt="" style={imageStyle} draggable={false} />;
      }
    }

    if (el.type === 'shape') {
      const shapeEl = el;
      const shapeTransform = `scale(${shapeEl.scaleX || 1}, ${shapeEl.scaleY || 1})`;
      const shapeStyle = {
        width: '100%',
        height: '100%',
        opacity: isGhost ? 0 : el.opacity,
        pointerEvents: 'none',
        transform: shapeTransform,
      };
      let svgContent = shapeEl.svgContent;
      if (svgContent.includes('fill=')) {
        svgContent = svgContent.replace(/fill="[^"]*"/g, `fill="${shapeEl.fill}"`);
      } else {
        svgContent = svgContent.replace('<svg', `<svg fill="${shapeEl.fill}"`);
      }
      return <div style={shapeStyle} dangerouslySetInnerHTML={{ __html: svgContent }} />;
    }

    const textEl = el;
    const isEditing = textEl.id === editingElementId;
    const textStyle = {
      fontFamily: textEl.fontFamily,
      fontSize: `${textEl.fontSize}px`,
      color: textEl.color,
      fontWeight: textEl.bold ? 'bold' : 'normal',
      fontStyle: textEl.italic ? 'italic' : 'normal',
      textAlign: textEl.textAlign,
      textDecoration: textEl.underline ? 'underline' : 'none',
      direction: textEl.direction,
      padding: '0.5rem',
      // If ghost, we want it invisible but taking up space. 
      // pointerEvents 'none' so clicks go through to the real text below (for drag)
      cursor: isGhost ? 'default' : (el.locked ? 'not-allowed' : (isEditing ? 'text' : 'move')),
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      userSelect: isEditing ? 'text' : 'auto',
      backgroundColor: textEl.backgroundColor,
      opacity: isGhost ? 0 : textEl.opacity,
      ...((textEl.borderWidth > 0 && textEl.borderColor && textEl.borderColor !== 'transparent') && {
        WebkitTextStroke: `${textEl.borderWidth}px ${textEl.borderColor}`,
      }),
      ...(textEl.textShadowEnabled && {
        textShadow: `${textEl.textShadowOffsetX}px ${textEl.textShadowOffsetY}px ${textEl.textShadowBlur}px ${textEl.textShadowColor}`
      }),
      minWidth: '20px',
    };

    return (
      <div
        contentEditable={!isGhost && isEditing && !el.locked}
        suppressContentEditableWarning
        style={textStyle}
        onBlur={!isGhost ? (e) => handleBlur(e, textEl.id) : undefined}
        onDoubleClick={!isGhost ? (e) => !el.locked && handleDoubleClick(e, textEl.id) : undefined}
      >
        {textEl.content}
      </div>
    );
  };

  const renderSelectionUI = (el) => {
    const handlePositions = {
      tl: { top: '-6px', left: '-6px' },
      tr: { top: '-6px', right: '-6px' },
      bl: { bottom: '-6px', left: '-6px' },
      br: { bottom: '-6px', right: '-6px' },
    };

    return (
      <>
        {/* Floating Toolbar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg flex items-center gap-1 p-1"
          style={{
            top: '-45px',
            pointerEvents: 'auto', // Must be auto to click buttons
            zIndex: 100,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            aria-label={el.locked ? "בטל נעילה" : "נעל"}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {el.locked ? <UnlockIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            disabled={el.locked}
            aria-label="שכפל"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <DuplicateIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={el.locked}
            aria-label="מחק"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Border */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            border: `2px solid ${el.locked ? '#f87171' : '#3B82F6'}`,
            pointerEvents: 'none', // Pass through to element below
          }}
        />

        {/* Rotate Handle */}
        {!el.locked && (
          <div
            className="absolute left-1/2 -translate-x-1/2 p-1 cursor-grab bg-white rounded-full shadow active:cursor-grabbing"
            style={{ pointerEvents: 'auto', bottom: '-40px' }}
            onMouseDown={(e) => handleRotationStart(e, el)}
          >
            <RotateIcon className="w-4 h-4 text-gray-700" />
          </div>
        )}

        {/* Resize Handles - Only for Image/Shape */}
        {!el.locked && (el.type === 'image' || el.type === 'shape') && Object.keys(handlePositions).map(pos => (
          <div
            key={pos}
            style={{
              position: 'absolute',
              width: '12px', height: '12px',
              backgroundColor: 'white',
              border: '2px solid #3B82F6',
              borderRadius: '50%',
              pointerEvents: 'auto',
              ...handlePositions[pos],
              cursor: getCursorForHandle(pos, el.rotation || 0),
            }}
            onMouseDown={(e) => handleResizeStart(e, el, pos)}
          />
        ))}
      </>
    );
  };

  return (
    <main className="flex-1 bg-gray-200 flex items-center justify-center p-8 overflow-auto" onClick={() => !croppingElementId && setSelectedElementId(null)}>
      <div
        id="canvas-container"
        className="shadow-lg relative transition-transform duration-200 ease-in-out origin-center"
        style={{
          width: '350px',
          height: '525px',
          outline: '1px solid #fecaca',
          outlineOffset: '4px',
          transform: `scale(${scale})`,
          ...canvasDynamicStyles,
        }}
      >
        {/* Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-30 opacity-30 canvas-grid-overlay"
            style={{
              backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
              backgroundSize: `${gridCellSize}px ${gridCellSize}px`,
            }}
          />
        )}

        {/* 1. RENDER ELEMENTS (Content Only, Z-Index = index) */}
        {elements.map((el, index) => {
          const isCroppingThis = el.id === croppingElementId;
          const elIsImage = el.type === 'image';
          const elIsShape = el.type === 'shape';

          // Accessible label generation
          let ariaLabel = el.type;
          if (el.type === 'text') {
            const textContent = el.content;
            ariaLabel = `Text: ${textContent.length > 20 ? textContent.substring(0, 20) + '...' : textContent}`;
          } else if (el.type === 'image') {
            ariaLabel = 'Image';
          } else if (el.type === 'shape') {
            ariaLabel = 'Shape';
          }
          if (el.locked) ariaLabel += ' (Locked)';
          if (selectedElementId === el.id) ariaLabel += ' (Selected)';

          const outerWrapperStyle = {
            position: 'absolute',
            top: `${el.top}px`,
            left: `${el.left}px`,
            width: (elIsImage || elIsShape) ? `${el.width}px` : 'auto',
            height: (elIsImage || elIsShape) ? `${el.height}px` : 'auto',
            transform: `rotate(${el.rotation || 0}deg)`,
            transformOrigin: 'center center',
            // Z-index is strictly based on array order to support "Send to Back" visually
            // Unless cropping, then it pops up
            zIndex: isCroppingThis ? 50 : index,
          };

          const innerWrapperStyle = {
            position: 'relative',
            width: (elIsImage || elIsShape) ? '100%' : 'auto',
            height: (elIsImage || elIsShape) ? '100%' : 'auto',
            cursor: isCroppingThis ? 'default' : (el.locked ? 'not-allowed' : 'move'),
            userSelect: 'none',
            ...(elIsImage && { overflow: isCroppingThis ? 'visible' : 'hidden' }),
          };

          return (
            <div
              key={el.id}
              style={outerWrapperStyle}
              // Accessibility
              role="button"
              tabIndex={0}
              aria-label={ariaLabel}
              aria-pressed={selectedElementId === el.id}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (croppingElementId) return;
                  setSelectedElementId(el.id);
                }
              }}
            >
              <div
                style={innerWrapperStyle}
                onMouseDown={(e) => handleMouseDown(e, el)}
                onClick={(e) => {
                  if (croppingElementId) return;
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                }}
              >
                {isCroppingThis ? (
                  <>
                    <ReactCrop
                      crop={crop}
                      onChange={c => setCrop(c)}
                      onComplete={c => setCompletedCrop(c)}
                    >
                      <img
                        ref={cropImageRef}
                        src={el.src}
                        alt="Image to crop"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onLoad={handleImageLoadForCropping}
                      />
                    </ReactCrop>
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-3 bg-white/90 p-2 rounded shadow z-50">
                      <button
                        onClick={onCancelCrop}
                        className="px-4 py-2 bg-white text-gray-800 font-semibold rounded-md shadow hover:bg-gray-100 transition-colors"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={() => handleSaveCurrentCrop(croppingElementId)}
                        className="px-6 py-2 bg-red-500 text-white font-semibold rounded-md shadow hover:bg-red-600 transition-colors"
                      >
                        שמור
                      </button>
                    </div>
                  </>
                ) : (
                  renderElementContent(el, false)
                )}
              </div>
            </div>
          )
        })}

        {/* 2. SELECTION GHOST OVERLAY (Rendered ON TOP of everything) */}
        {selectedElement && !croppingElementId && (
          <div
            style={{
              position: 'absolute',
              top: `${selectedElement.top}px`,
              left: `${selectedElement.left}px`,
              width: (selectedElement.type === 'image' || selectedElement.type === 'shape') ? `${selectedElement.width}px` : 'auto',
              height: (selectedElement.type === 'image' || selectedElement.type === 'shape') ? `${selectedElement.height}px` : 'auto',
              transform: `rotate(${selectedElement.rotation || 0}deg)`,
              transformOrigin: 'center center',
              zIndex: 100, // Always on top
              pointerEvents: 'none', // Allow clicks to pass through to real element (for dragging)
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* Render Invisible Content to set dimensions for Text, or fixed size for Image */}
              {renderElementContent(selectedElement, true)}

              {/* Render Visible Controls (Border, Handles, Toolbar) */}
              {renderSelectionUI(selectedElement)}
            </div>
          </div>
        )}

        {croppingElementId && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-40"
            onClick={onCancelCrop}
          />
        )}
      </div>
    </main>
  );
};

export default Canvas;