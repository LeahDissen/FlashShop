import { ChevronLeftIcon, FolderOpenIcon, RedoIcon, SaveIcon, UndoIcon } from '../icons';

const EditorHeader = ({ 
    onExit, 
    projectName, 
    onProjectNameChange, 
    onPreview, 
    isPreviewLoading,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onSave,
    onLoad,
    productLabel,
    printSizeLabel,
}) => {
  return (
    <header className="editor-header bg-white shadow-md relative z-50 shrink-0 p-2 flex items-center justify-between border-b overflow-visible">
      {/* Right side in RTL */}
        <div className="flex items-center gap-2 relative z-50">
        <button 
          onClick={onPreview}
          disabled={isPreviewLoading}
          className="bg-red-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPreviewLoading ? (
               <>
                  <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    טוען ומעביר לסל...
               </>
          ) : 'המשך'}
        </button>
        <button 
            onClick={onPreview}
            disabled={isPreviewLoading}
            className="border border-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          תצוגה מקדימה
        </button>
        <div className="h-8 w-px bg-gray-300 mx-1"></div>
        <button 
            onClick={onSave}
            className="p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors" 
            aria-label="שמור בספריה"
            data-tooltip="שמור בספריה"
            data-tooltip-pos="bottom"
        >
          <SaveIcon className="w-6 h-6" />
        </button>
        <button 
            onClick={onLoad}
            className="p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors" 
            aria-label="פתח מהספריה"
            data-tooltip="הפרויקטים שלי"
            data-tooltip-pos="bottom"
        >
          <FolderOpenIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Middle */}
      <div className="flex flex-col items-center gap-0.5 min-w-0">
        <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="text-gray-700 font-medium text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-red-400 focus:outline-none transition-colors px-2 py-1 w-40 sm:w-64"
            aria-label="שם הפרויקט"
        />
        {(productLabel || printSizeLabel) && (
          <p className="text-xs text-gray-500 truncate max-w-[280px] sm:max-w-md text-center">
            {productLabel}
            {productLabel && printSizeLabel ? ' · ' : ''}
            {printSizeLabel && <span className="text-[#f2665e] font-medium">משטח {printSizeLabel}</span>}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
        <button 
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600" 
            aria-label="בטל"
            data-tooltip="בטל"
            data-tooltip-pos="bottom"
        >
          <UndoIcon className="w-5 h-5" />
        </button>
        <button 
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600" 
            aria-label="בצע שוב"
            data-tooltip="בצע שוב"
            data-tooltip-pos="bottom"
        >
          <RedoIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Left side in RTL */}
      <div 
        className="flex items-center cursor-pointer hover:text-red-500 transition-colors rounded-md px-1" 
        onClick={onExit}
        data-tooltip="חזרה לדף המוצרים"
        data-tooltip-pos="bottom"
      >
        <span className="text-2xl font-bold text-gray-800 hover:text-red-500">FLASH</span>
        <ChevronLeftIcon className="w-5 h-5 mr-2 rotate-180" />
      </div>
    </header>
  );
};

export default EditorHeader;