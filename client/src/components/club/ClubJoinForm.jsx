/**
 * The signup form: name, email, birth date and agreeing to the terms. `texts` holds the admin's
 * placeholders, checkbox and button texts; `error` is the last signup error.
 */
export default function ClubJoinForm({ texts, formData, onChange, onSubmit, onOpenTerms, error, isJoining }) {
    return (
        <form onSubmit={onSubmit} className="w-full max-w-xs flex flex-col gap-3 z-20">
            <input type="text" name="name" placeholder={texts.inputNamePlaceholder} value={formData.name} onChange={onChange} required className="w-full px-4 py-2 rounded-md text-gray-700 bg-white/90 text-right" />
            <input type="email" name="email" placeholder={texts.inputEmailPlaceholder} value={formData.email} onChange={onChange} required className="w-full px-4 py-2 rounded-md text-gray-700 bg-white/90 text-right" />
            <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} name="birthdate" placeholder={texts.inputDatePlaceholder} value={formData.birthdate} onChange={onChange} required className="w-full px-4 py-2 rounded-md text-gray-700 bg-white/90 text-right" />
            <div className="flex items-start gap-2 mt-2 justify-end w-full px-2">
                <label className="text-[11px] leading-tight text-right cursor-pointer select-none" htmlFor="club-terms">
                    {texts.checkboxText}{" "}
                    <span onClick={onOpenTerms} className="underline font-bold text-white hover:text-gray-200 cursor-pointer">
                        (לקריאת התקנון)
                    </span>
                </label>
                <input type="checkbox" id="club-terms" name="agreed" checked={formData.agreed} onChange={onChange} className="mt-0.5 w-4 h-4 accent-white cursor-pointer shrink-0" />
            </div>
            {error && (
                <p className="text-sm font-bold bg-white/90 text-[#a93636] rounded-md px-3 py-2" role="alert">
                    {error}
                </p>
            )}
            <button type="submit" disabled={isJoining} className="bg-white text-[#f0645a] font-bold py-2 px-6 rounded-full mt-4 mx-auto hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-60">
                {isJoining ? "רגע..." : texts.btnText}
            </button>
        </form>
    );
}
