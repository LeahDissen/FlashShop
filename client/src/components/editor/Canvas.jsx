import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { RotateIcon, TrashIcon, LockIcon, UnlockIcon, DuplicateIcon, FlipHorizontalIcon, XIcon, TextIcon, PlusIcon } from '../icons';
import { ReactCrop } from 'react-image-crop';
import { getSafeZoneInsets, analyzeDesignSafeZone, getDesignZoneWarningMessage } from '../../utils/safeZone';
import { partitionElementsByLayer, getDropzoneImageForSlot } from '../../utils/editorLayering';
import { getClipStyle, isMultiDropzoneFrame, resolveDropzones } from '../../utils/dropzoneUtils';

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

  return 'default';
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
  zoom,
  canvasWidth = 350,
  canvasHeight = 525,
  printWidthCm,
  printHeightCm,
  showOrientationToggle = false,
  onToggleOrientation,
  onAddImageToDropzone,
}) => {
  const [editingElementId, setEditingElementId] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const cropImageRef = useRef(null);
  const mainRef = useRef(null);
  const textEditRefs = useRef({});
  const dropzoneFileInputRef = useRef(null);
  const pendingDropzoneIdRef = useRef(null);
  /** מונע ביטול בחירה מיידי אחרי לחיצה על אלמנט (בגלל re-render של שכבת הבחירה) */
  const skipCanvasDeselectUntilRef = useRef(0);
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  const dragInfo = useRef({
    isDragging: false,
    pendingDrag: false,
    elementId: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialTop: 0,
    initialLeft: 0,
    wasAlreadySelected: false,
    didMove: false,
  });
  /** שמירת מצב הלחיצה האחרונה לזיהוי הקשה שנייה על טקסט (מובייל) */
  const lastTapRef = useRef({
    elementId: null,
    wasAlreadySelected: false,
    didMove: false,
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
  const bleedAlertShownRef = useRef(false);
  const wasInteractingRef = useRef(false);
  const [zoneWarningToast, setZoneWarningToast] = useState(null);
  const canvasDimsRef = useRef({ canvasWidth, canvasHeight, printWidthCm, printHeightCm });
  canvasDimsRef.current = { canvasWidth, canvasHeight, printWidthCm, printHeightCm };

  const analyzeCurrentDesign = (items = elementsRef.current) => analyzeDesignSafeZone(
    items,
    canvasDimsRef.current.canvasWidth,
    canvasDimsRef.current.canvasHeight,
    canvasDimsRef.current.printWidthCm,
    canvasDimsRef.current.printHeightCm,
  );

  const showDesignZoneAlert = (analysis = analyzeCurrentDesign()) => {
    const message = getDesignZoneWarningMessage(analysis);
    if (!message || bleedAlertShownRef.current) return;
    bleedAlertShownRef.current = true;
    setZoneWarningToast({
      message,
      type: analysis.hasOutside ? 'error' : 'warning',
    });
  };

  const scale = zoom / 100;
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const layeredElements = useMemo(() => partitionElementsByLayer(elements), [elements]);
  const activeFrame = layeredElements.frames[0] || null;
  const resolvedDropzones = useMemo(() => {
    if (!activeFrame || !isMultiDropzoneFrame(activeFrame)) return [];
    return resolveDropzones(
      activeFrame.dropzones,
      activeFrame.width || canvasWidth,
      activeFrame.height || canvasHeight,
      activeFrame.left ?? 0,
      activeFrame.top ?? 0,
    );
  }, [activeFrame, canvasWidth, canvasHeight]);

  const handleDropzoneUploadClick = useCallback((dropzoneId) => {
    if (!onAddImageToDropzone || !dropzoneId) return;
    pendingDropzoneIdRef.current = dropzoneId;
    dropzoneFileInputRef.current?.click();
  }, [onAddImageToDropzone]);

  const handleDropzoneFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    const dropzoneId = pendingDropzoneIdRef.current;
    pendingDropzoneIdRef.current = null;
    if (event.target) event.target.value = '';
    if (!file || !dropzoneId || !onAddImageToDropzone) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        onAddImageToDropzone(dropzoneId, result, img.naturalWidth, img.naturalHeight);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, [onAddImageToDropzone]);
  const safeZoneInsets = useMemo(
    () => getSafeZoneInsets(canvasWidth, canvasHeight, printWidthCm, printHeightCm),
    [canvasWidth, canvasHeight, printWidthCm, printHeightCm],
  );
  const designAnalysis = useMemo(
    () => analyzeDesignSafeZone(
      elements,
      canvasWidth,
      canvasHeight,
      printWidthCm,
      printHeightCm,
    ),
    [elements, canvasWidth, canvasHeight, printWidthCm, printHeightCm],
  );
  useEffect(() => {
    if (!designAnalysis.hasOutside && !designAnalysis.hasNearEdge) {
      bleedAlertShownRef.current = false;
      setZoneWarningToast(null);
    }
  }, [designAnalysis.hasOutside, designAnalysis.hasNearEdge]);

  const focusTextEditor = useCallback((elementId) => {
    const node = textEditRefs.current[elementId];
    const element = elementsRef.current.find((el) => el.id === elementId);
    if (!node || element?.type !== 'text') return false;

    if (node.textContent !== element.content) {
      node.textContent = element.content;
    }

    node.focus({ preventScroll: true });

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch {
      // חלק מדפדפני מובייל לא תומכים בבחירת טווח על contentEditable
    }
    return true;
  }, []);

  /** כניסה לעריכת טקסט – flushSync כדי שהמקלדת במובייל תיפתח בתוך מחוות המשתמש */
  const startTextEditing = useCallback((elementId) => {
    const element = elementsRef.current.find((el) => el.id === elementId);
    if (!element || element.type !== 'text' || element.locked) return;

    flushSync(() => {
      setSelectedElementId(elementId);
      setEditingElementId(elementId);
    });

    if (!focusTextEditor(elementId)) {
      window.requestAnimationFrame(() => focusTextEditor(elementId));
    }
  }, [focusTextEditor, setSelectedElementId]);

  useEffect(() => {
    if (!editingElementId) return;
    // גיבוי אם ה־ref עדיין לא מוכן אחרי flushSync
    const timer = window.setTimeout(() => focusTextEditor(editingElementId), 0);
    return () => window.clearTimeout(timer);
  }, [editingElementId, focusTextEditor]);

  useEffect(() => {
    if (!croppingElementId) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [croppingElementId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingElementId) return;
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!currentSelectedElement.locked) {
          onDelete();
        }
        return;
      }
      if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentSelectedElement.locked) {
          onDuplicate();
        }
        return;
      }
      if (currentSelectedElement.locked) return;

      let dx = 0;
      let dy = 0;
      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        const nextLeft = currentSelectedElement.left + dx;
        const nextTop = currentSelectedElement.top + dy;
        updateElement(selectedElementId, {
          left: nextLeft,
          top: nextTop,
        });
        const nextElements = elementsRef.current.map((el) => (
          el.id === selectedElementId
            ? { ...el, left: nextLeft, top: nextTop }
            : el
        ));
        window.setTimeout(() => {
          showDesignZoneAlert(analyzeDesignSafeZone(
            nextElements,
            canvasDimsRef.current.canvasWidth,
            canvasDimsRef.current.canvasHeight,
            canvasDimsRef.current.printWidthCm,
            canvasDimsRef.current.printHeightCm,
          ));
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements, selectedElementId, editingElementId, croppingElementId, updateElement, onDelete, onDuplicate, setSelectedElementId, onCancelCrop]);

  useEffect(() => {
    if (!isInteracting) return;
    wasInteractingRef.current = true;

    const handleGlobalMouseMove = (e) => {
      const point = e.touches?.[0] || e.changedTouches?.[0] || e;
      const clientX = point.clientX;
      const clientY = point.clientY;

      if (dragInfo.current.isDragging && dragInfo.current.elementId) {
        const dx = (clientX - dragInfo.current.initialMouseX) / scale;
        const dy = (clientY - dragInfo.current.initialMouseY) / scale;

        const newTop = dragInfo.current.initialTop + dy;
        const newLeft = dragInfo.current.initialLeft + dx;

        updateElement(dragInfo.current.elementId, { top: newTop, left: newLeft });
      } else if (dragInfo.current.elementId && dragInfo.current.pendingDrag) {
        const dx = clientX - dragInfo.current.initialMouseX;
        const dy = clientY - dragInfo.current.initialMouseY;
        if (Math.hypot(dx, dy) > 4) {
          dragInfo.current.isDragging = true;
          dragInfo.current.pendingDrag = false;
          dragInfo.current.didMove = true;
        }
      }
      else if (rotationInfo.current.isRotating && rotationInfo.current.elementId) {
        const { centerX, centerY, startAngle, initialRotation } = rotationInfo.current;
        const currentX = clientX - centerX;
        const currentY = clientY - centerY;
        const currentAngle = Math.atan2(currentY, currentX) * (180 / Math.PI);

        let newRotation = initialRotation + (currentAngle - startAngle);
        updateElement(rotationInfo.current.elementId, { rotation: newRotation });
      }
      else if (resizeInfo.current.isResizing && resizeInfo.current.elementId) {
        const {
          elementId, handle, initialWidth, initialHeight, initialTop, initialLeft,
          initialRotation, initialMouseX, initialMouseY, aspectRatio
        } = resizeInfo.current;

        const dx = (clientX - initialMouseX) / scale;
        const dy = (clientY - initialMouseY) / scale;

        const rotatedDelta = rotatePoint({ x: dx, y: dy }, -initialRotation);

        let tempNewWidth = initialWidth;
        let tempNewHeight = initialHeight;

        if (handle.includes('r')) {
          tempNewWidth += rotatedDelta.x;
        } else {
          tempNewWidth -= rotatedDelta.x;
        }

        if (handle.includes('b')) {
          tempNewHeight += rotatedDelta.y;
        } else {
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
      if (
        dragInfo.current.elementId ||
        rotationInfo.current.isRotating ||
        resizeInfo.current.isResizing
      ) {
        lastTapRef.current = {
          elementId: dragInfo.current.elementId,
          wasAlreadySelected: dragInfo.current.wasAlreadySelected,
          didMove: Boolean(dragInfo.current.didMove || dragInfo.current.isDragging),
        };
      }

      const didInteract = wasInteractingRef.current;
      setIsInteracting(false);
      if (dragInfo.current.isDragging || dragInfo.current.pendingDrag || dragInfo.current.elementId) {
        dragInfo.current = {
          ...dragInfo.current,
          isDragging: false,
          pendingDrag: false,
          elementId: null,
          didMove: false,
        };
      }
      if (rotationInfo.current.isRotating) {
        rotationInfo.current = { ...rotationInfo.current, isRotating: false, elementId: null };
      }
      if (resizeInfo.current.isResizing) {
        resizeInfo.current = { ...resizeInfo.current, isResizing: false, elementId: null };
      }

      if (didInteract) {
        showDesignZoneAlert(analyzeCurrentDesign());
      }
      wasInteractingRef.current = false;
    };

    window.addEventListener('pointermove', handleGlobalMouseMove);
    window.addEventListener('pointerup', handleGlobalMouseUp);
    window.addEventListener('pointercancel', handleGlobalMouseUp);
    // גיבוי לדפדפנים ישנים בלי Pointer Events מלאים
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalMouseMove);
      window.removeEventListener('pointerup', handleGlobalMouseUp);
      window.removeEventListener('pointercancel', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isInteracting, scale, updateElement]);

  const handleTextChange = (id, content) => {
    updateElement(id, { content });
  };

  const handleTextInput = (id, content) => {
    updateElement(id, { content });
  };

  const handleBlur = (e, elementId) => {
    handleTextChange(elementId, e.currentTarget.innerText);
    setEditingElementId(null);
    window.setTimeout(() => {
      showDesignZoneAlert(analyzeCurrentDesign());
    }, 150);
  };

  const handleDoubleClick = (e, elementId) => {
    e.stopPropagation();
    startTextEditing(elementId);
  };

  const handleMouseDown = (e, el) => {
    if (el.id === croppingElementId || el.locked) return;
    if (el.type === 'text' && el.id === editingElementId) return;

    e.stopPropagation();
    skipCanvasDeselectUntilRef.current = Date.now() + 400;

    const point = e.touches?.[0] || e;
    const wasAlreadySelected = selectedElementId === el.id;

    // בטקסט שכבר נבחר – לא מונעים default, כדי שהקלדה במובייל תוכל לקבל פוקוס
    if (!(el.type === 'text' && wasAlreadySelected)) {
      e.preventDefault();
    }

    setSelectedElementId(el.id);

    dragInfo.current = {
      isDragging: el.type !== 'text',
      pendingDrag: el.type === 'text',
      elementId: el.id,
      initialMouseX: point.clientX,
      initialMouseY: point.clientY,
      initialTop: el.top,
      initialLeft: el.left,
      wasAlreadySelected,
      didMove: false,
      dropzoneId: el.dropzoneId || null,
    };
    setIsInteracting(true);
  };

  const handleRotationStart = (e, el) => {
    if (el.locked) return;
    e.preventDefault();
    e.stopPropagation();
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
    if (el.locked || (el.type !== 'image' && el.type !== 'shape' && el.type !== 'globalFrame')) return;

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
      aspectRatio: el.type === 'image' && el.naturalWidth > 0 && el.naturalHeight > 0
        ? el.naturalWidth / el.naturalHeight
        : resizableEl.width / resizableEl.height,
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

  const gridCellSize = canvasWidth / gridSize;

  const renderElementContent = (el, isGhost = false) => {
    const elIsGlobalFrame = el.type === 'globalFrame';

    if (elIsGlobalFrame) {
      return (
        <img
          src={el.src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            opacity: isGhost ? 0 : (el.opacity ?? 1),
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'block',
            background: 'transparent',
          }}
          draggable={false}
        />
      );
    }

    if (el.type === 'image') {
      const imgEl = el;
      const filterStyle = `brightness(${imgEl.brightness ?? 100}%) contrast(${imgEl.contrast ?? 100}%) grayscale(${imgEl.grayscale ?? 0}%) sepia(${imgEl.sepia ?? 0}%) blur(${imgEl.blur ?? 0}px)`;
      const imageTransform = `scale(${imgEl.scaleX || 1}, ${imgEl.scaleY || 1})`;

      const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: isGhost ? 0 : el.opacity,
        pointerEvents: 'none',
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
    const isEditing = !isGhost && textEl.id === editingElementId;
    const textAlignToFlex = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end',
    };

    const textStyle = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: textAlignToFlex[textEl.textAlign] || 'center',
      fontFamily: textEl.fontFamily,
      fontSize: `${textEl.fontSize}px`,
      color: textEl.color,
      fontWeight: textEl.bold ? 'bold' : 'normal',
      fontStyle: textEl.italic ? 'italic' : 'normal',
      textAlign: textEl.textAlign,
      textDecoration: textEl.underline ? 'underline' : 'none',
      direction: textEl.direction,
      padding: '0.5rem',
      cursor: isGhost ? 'default' : (el.locked ? 'not-allowed' : (isEditing ? 'text' : 'move')),
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      userSelect: isEditing ? 'text' : 'none',
      backgroundColor: textEl.backgroundColor,
      opacity: isGhost ? 0 : textEl.opacity,
      outline: isEditing ? '2px solid #3B82F6' : 'none',
      outlineOffset: '0px',
      boxSizing: 'border-box',
      ...((textEl.borderWidth > 0 && textEl.borderColor && textEl.borderColor !== 'transparent') && {
        WebkitTextStroke: `${textEl.borderWidth}px ${textEl.borderColor}`,
      }),
      ...(textEl.textShadowEnabled && {
        textShadow: `${textEl.textShadowOffsetX}px ${textEl.textShadowOffsetY}px ${textEl.textShadowBlur}px ${textEl.textShadowColor}`
      }),
    };

    if (isEditing && !el.locked) {
      return (
        <div
          ref={(node) => {
            if (node) textEditRefs.current[textEl.id] = node;
          }}
          contentEditable
          suppressContentEditableWarning
          inputMode="text"
          enterKeyHint="done"
          style={{
            ...textStyle,
            WebkitUserSelect: 'text',
            userSelect: 'text',
            touchAction: 'manipulation',
          }}
          onBlur={(e) => handleBlur(e, textEl.id)}
          onInput={(e) => handleTextInput(textEl.id, e.currentTarget.innerText)}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <div
        style={textStyle}
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
            pointerEvents: 'auto',
            zIndex: 100,
          }}
          onMouseDown={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          {el.type === 'text' && !el.locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startTextEditing(el.id);
              }}
              aria-label="ערוך טקסט"
              className="p-2 text-[#f2665e] hover:bg-red-50 rounded-md"
            >
              <TextIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            aria-label={el.locked ? "בטל נעילה" : "נעל"}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {el.locked ? <UnlockIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            disabled={el.locked || el.type === 'globalFrame'}
            aria-label="שכפל"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <DuplicateIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={el.locked}
            aria-label={el.type === 'globalFrame' ? 'הסר מסגרת' : 'מחק'}
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
            pointerEvents: 'none',
          }}
        />

        {/* Rotate Handle – לא למסגרת קולאז׳ פנימית (רק הזזה/גודל) */}
        {!el.locked && !el.dropzoneId && (
          <div
            className="absolute left-1/2 -translate-x-1/2 p-1 cursor-grab bg-white rounded-full shadow active:cursor-grabbing"
            style={{ pointerEvents: 'auto', bottom: '-40px' }}
            onMouseDown={(e) => handleRotationStart(e, el)}
          >
            <RotateIcon className="w-4 h-4 text-gray-700" />
          </div>
        )}

        {/* Resize Handles – כולל תמונות בתוך חלונות קולאז׳ */}
        {!el.locked && (el.type === 'image' || el.type === 'shape' || el.type === 'globalFrame') && Object.keys(handlePositions).map(pos => (
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

  const isEditingSelectedText = selectedElement?.type === 'text' && editingElementId === selectedElement.id;

  return (
    <section className="flex-1 min-h-0 min-w-0 w-full bg-gray-200 relative overflow-hidden">
      {zoneWarningToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 pointer-events-none">
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto ${
              zoneWarningToast.type === 'error'
                ? 'border-red-400 bg-red-50 text-red-900'
                : 'border-amber-400 bg-amber-50 text-amber-900'
            }`}
          >
            <p className="flex-1 text-right leading-relaxed">{zoneWarningToast.message}</p>
            <button
              type="button"
              onClick={() => setZoneWarningToast(null)}
              className="shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="סגור הודעה"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div
        ref={mainRef}
        className="absolute inset-0 overflow-auto"
        onClick={(e) => {
          if (croppingElementId || editingElementId) return;
          if (Date.now() < skipCanvasDeselectUntilRef.current) return;
          // אל תבטל בחירה אם הלחיצה הגיעה מתוך משטח העיצוב/אלמנט
          if (e.target.closest?.('#canvas-container')) return;
          setSelectedElementId(null);
        }}
      >
        <div
          className="flex min-h-full w-full items-center justify-center p-3 sm:p-6 md:p-8 box-border canvas-deselect-area"
          onClick={(e) => {
            if (croppingElementId || editingElementId) return;
            if (Date.now() < skipCanvasDeselectUntilRef.current) return;
            // לחיצה על הריפוד סביב הקנבס מבטלת בחירה; לחיצה על הקנבס עצמו מטופלת שם
            if (e.target === e.currentTarget) {
              setSelectedElementId(null);
            }
          }}
        >
      <div className="flex flex-col items-center gap-4 shrink-0">
        {showOrientationToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOrientation?.();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f2665e] text-white font-semibold text-sm shadow-lg shadow-[#f2665e]/25 hover:bg-[#d95248] active:bg-[#c44840] transition-colors duration-200 pointer-events-auto"
            aria-label="הפוך כיוון משטח"
            title="הפוך כיוון משטח"
          >
            <FlipHorizontalIcon className="w-5 h-5 shrink-0" />
            <span>הפוך כיוון משטח</span>
          </button>
        )}
      <div
        id="canvas-container"
        className="shrink-0 shadow-lg relative transition-transform duration-200 ease-in-out origin-center"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          outline: '1px solid #fecaca',
          outlineOffset: '4px',
          transform: `scale(${scale})`,
          isolation: 'isolate',
          ...canvasDynamicStyles,
        }}
        onClick={(e) => {
          // לחיצה על רקע ריק בתוך הקנבס מבטלת בחירה
          if (croppingElementId || editingElementId) return;
          if (Date.now() < skipCanvasDeselectUntilRef.current) return;
          if (e.target === e.currentTarget) {
            setSelectedElementId(null);
          }
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

        {/* Safe zone – מסגרת חיתוך מקווקות */}
        <div
          className="absolute pointer-events-none canvas-safe-zone-overlay"
          style={{
            top: `${safeZoneInsets.top}px`,
            left: `${safeZoneInsets.left}px`,
            right: `${safeZoneInsets.right}px`,
            bottom: `${safeZoneInsets.bottom}px`,
            zIndex: 90,
          }}
          aria-hidden="true"
        >
          <svg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            style={{ display: 'block', overflow: 'visible' }}
            aria-hidden="true"
          >
            <rect
              width="100%"
              height="100%"
              fill="none"
              stroke="rgba(0, 0, 0, 0.45)"
              strokeWidth="1"
              strokeDasharray="7 5"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              width="100%"
              height="100%"
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="1"
              strokeDasharray="7 5"
              strokeDashoffset="7"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* RENDER ELEMENTS – תוכן תחתון, מסגרת overlay, טקסט */}
        {[
          ...layeredElements.bottom.map((el, index) => ({ el, zIndex: index })),
          ...layeredElements.texts.map((el, index) => ({ el, zIndex: 1000 + index })),
        ].map(({ el, zIndex }) => {
          const isCroppingThis = el.id === croppingElementId;
          const elIsImage = el.type === 'image';
          const elIsShape = el.type === 'shape';
          const elIsText = el.type === 'text';
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

          const hasFixedSize = elIsImage || elIsShape || elIsText;

          const outerWrapperStyle = {
            position: 'absolute',
            top: `${el.top}px`,
            left: `${el.left}px`,
            width: hasFixedSize ? `${el.width}px` : 'auto',
            height: hasFixedSize ? `${el.height}px` : 'auto',
            transform: `rotate(${el.rotation || 0}deg)`,
            transformOrigin: 'center center',
            zIndex: isCroppingThis ? 50 : (el.id === editingElementId ? 1100 : zIndex),
          };

          const innerWrapperStyle = {
            position: 'relative',
            width: hasFixedSize ? '100%' : 'auto',
            height: hasFixedSize ? '100%' : 'auto',
            cursor: isCroppingThis ? 'default' : (el.locked ? 'not-allowed' : (el.id === editingElementId ? 'text' : 'move')),
            userSelect: el.id === editingElementId ? 'text' : 'none',
            ...(elIsImage && { overflow: isCroppingThis ? 'visible' : 'hidden' }),
          };

          return (
            <div
              key={el.id}
              style={outerWrapperStyle}
              role="button"
              tabIndex={0}
              aria-label={ariaLabel}
              aria-pressed={selectedElementId === el.id}
              onKeyDown={(e) => {
                // במצב עריכת טקסט – לא לחסום רווח/Enter (נדרשים להקלדה)
                if (el.type === 'text' && el.id === editingElementId) return;
                if (e.target.isContentEditable) return;

                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (croppingElementId) return;
                  setSelectedElementId(el.id);
                }
              }}
            >
              <div
                style={innerWrapperStyle}
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  handleMouseDown(e, el);
                }}
                onClick={(e) => {
                  if (croppingElementId) return;
                  e.stopPropagation();

                  const tap = lastTapRef.current;
                  const isSecondTapOnText =
                    el.type === 'text' &&
                    !el.locked &&
                    tap.elementId === el.id &&
                    tap.wasAlreadySelected &&
                    !tap.didMove;

                  if (isSecondTapOnText) {
                    startTextEditing(el.id);
                    return;
                  }

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
                  renderElementContent(el)
                )}
              </div>
            </div>
          )
        })}

        {/* תצוגת תמונות קולאז׳ – מתחת למסגרת */}
        {resolvedDropzones.length > 0 && (
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 400 }} aria-hidden="true">
            {resolvedDropzones.map((zone) => {
              const imageEl = getDropzoneImageForSlot(elements, zone.id);
              if (!imageEl) return null;
              const clipStyle = getClipStyle(zone);
              return (
                <div
                  key={`visual-${zone.id}`}
                  style={{
                    position: 'absolute',
                    left: `${zone.left}px`,
                    top: `${zone.top}px`,
                    width: `${zone.width}px`,
                    height: `${zone.height}px`,
                    overflow: 'hidden',
                    ...clipStyle,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(imageEl.left ?? 0) - zone.left}px`,
                      top: `${(imageEl.top ?? 0) - zone.top}px`,
                      width: `${imageEl.width}px`,
                      height: `${imageEl.height}px`,
                    }}
                  >
                    {renderElementContent(imageEl)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* שכבת מסגרת גלובלית – לחיצה לבחירה ולהזזה */}
        {layeredElements.frames.length > 0 && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 500, isolation: 'isolate' }}
          >
            {layeredElements.frames.map((el) => (
              <div
                key={el.id}
                role="button"
                tabIndex={0}
                aria-label={el.title ? `מסגרת: ${el.title}` : 'מסגרת עיצוב'}
                aria-pressed={selectedElementId === el.id}
                style={{
                  position: 'absolute',
                  top: `${el.top ?? 0}px`,
                  left: `${el.left ?? 0}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  pointerEvents: 'auto',
                  cursor: el.locked ? 'not-allowed' : 'move',
                  background: 'transparent',
                }}
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  e.stopPropagation();
                  handleMouseDown(e, el);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedElementId(el.id);
                  }
                }}
              >
                {renderElementContent(el)}
              </div>
            ))}
          </div>
        )}

        {/* לחיצה על חלונות קולאז׳ – מעל המסגרת */}
        {resolvedDropzones.length > 0 && (
          <div className="absolute inset-0" style={{ zIndex: 550 }} aria-label="חלונות תמונה לקולאז׳">
            <input
              ref={dropzoneFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={handleDropzoneFileChange}
            />
            {resolvedDropzones.map((zone) => {
              const imageEl = getDropzoneImageForSlot(elements, zone.id);
              const clipStyle = getClipStyle(zone);
              const isSelected = imageEl && selectedElementId === imageEl.id;

              return (
                <div
                  key={`hit-${zone.id}`}
                  style={{
                    position: 'absolute',
                    left: `${zone.left}px`,
                    top: `${zone.top}px`,
                    width: `${zone.width}px`,
                    height: `${zone.height}px`,
                    overflow: 'hidden',
                    zIndex: isSelected ? 560 : 550,
                    ...clipStyle,
                  }}
                >
                  {imageEl ? (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={zone.label || 'תמונת קולאז׳'}
                      aria-pressed={isSelected}
                      style={{
                        width: '100%',
                        height: '100%',
                        cursor: 'move',
                        background: 'transparent',
                        boxShadow: isSelected ? 'inset 0 0 0 2px #3B82F6' : 'none',
                      }}
                      onPointerDown={(e) => {
                        if (e.pointerType === 'mouse' && e.button !== 0) return;
                        e.stopPropagation();
                        // תמיד משתמשים בגרסה העדכנית מה-ref כדי שהגרירה תהיה חלקה
                        const latest = elementsRef.current.find((item) => item.id === imageEl.id) || imageEl;
                        handleMouseDown(e, latest);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(imageEl.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleDropzoneUploadClick(zone.id);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropzoneUploadClick(zone.id);
                      }}
                      className="w-full h-full flex flex-col items-center justify-center gap-1 bg-white/70 hover:bg-white/90 border-2 border-dashed border-red-300 text-red-500 transition-colors"
                      aria-label={`העלה תמונה ל${zone.label || 'חלון'}`}
                    >
                      <PlusIcon className="w-6 h-6" />
                      <span className="text-[10px] sm:text-xs font-bold px-1 text-center leading-tight">
                        {zone.label || 'העלה תמונה'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SELECTION GHOST OVERLAY (Rendered ON TOP of everything) */}
        {selectedElement && !croppingElementId && !isEditingSelectedText && (
          <div
            style={{
              position: 'absolute',
              top: `${selectedElement.top}px`,
              left: `${selectedElement.left}px`,
              width: (selectedElement.type === 'image'
                || selectedElement.type === 'shape'
                || selectedElement.type === 'text'
                || selectedElement.type === 'globalFrame')
                ? `${selectedElement.width}px`
                : 'auto',
              height: (selectedElement.type === 'image'
                || selectedElement.type === 'shape'
                || selectedElement.type === 'text'
                || selectedElement.type === 'globalFrame')
                ? `${selectedElement.height}px`
                : 'auto',
              transform: `rotate(${selectedElement.rotation || 0}deg)`,
              transformOrigin: 'center center',
              zIndex: (selectedElement.type === 'globalFrame' || selectedElement.dropzoneId) ? 600 : 100,
              pointerEvents: 'none',
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {selectedElement.type !== 'text'
                && selectedElement.type !== 'globalFrame'
                && !selectedElement.dropzoneId
                && renderElementContent(selectedElement, true)}

              {selectedElement.type === 'globalFrame' && !selectedElement.locked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'auto',
                    cursor: 'move',
                    background: 'transparent',
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    e.stopPropagation();
                    handleMouseDown(e, selectedElement);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="הזז מסגרת"
                />
              )}

              {selectedElement.dropzoneId && !selectedElement.locked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'auto',
                    cursor: 'move',
                    background: 'transparent',
                  }}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    e.stopPropagation();
                    handleMouseDown(e, selectedElement);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="הזז תמונה בחלון"
                />
              )}

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
      </div>
        </div>
      </div>
    </section>
  );
};

export default Canvas;