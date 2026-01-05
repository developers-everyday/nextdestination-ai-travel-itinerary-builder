import React from 'react';

interface SourceToggleProps {
    selectedSource: 'community' | 'model'; // 'model' for AI generated
    onSelectSource: (source: 'community' | 'model') => void;
}

const SourceToggle: React.FC<SourceToggleProps> = ({ selectedSource, onSelectSource }) => {
    return (
        <div className="flex justify-center py-8">
            <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex relative">
                {/* Background Slider */}
                <div
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-sm transition-all duration-300 ease-spring ${selectedSource === 'community' ? 'left-1.5' : 'left-[calc(50%+3px)]'
                        }`}
                />

                <button
                    onClick={() => onSelectSource('community')}
                    className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${selectedSource === 'community' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        👥 Community Created
                    </span>
                </button>

                <button
                    onClick={() => onSelectSource('model')}
                    className={`relative z-10 px-8 py-3 rounded-xl text-sm font-bold transition-colors duration-300 ${selectedSource === 'model' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        ✨ AI Generated
                    </span>
                </button>
            </div>
        </div>
    );
};

export default SourceToggle;
