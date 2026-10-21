import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCustomCategoriesPage, saveCategorySettings } from '../../api/productCategoriesApi';
import {
    DISPLAY_TYPES,
    applyCategoryPageData,
    buildCustomCategory,
    findCategoryByName,
    getAllCategories,
    getCustomCategories,
    getHiddenCategories,
    isCustomCategory,
    parseCustomCategoriesFromPage,
    parseHiddenCategoriesFromPage,
    sanitizeCustomCategories,
} from '../../constants/productCategories';

/**
 * The shop's product categories in the admin: the built-in ones (some may be hidden) and the shop's
 * own, saved on the categories page. `listVersion` changes whenever the list changes, so lists derived
 * from the shared category module refresh.
 * @param {{ products: object[], onCategoryAdded: (name: string, displayType: string) => void,
 *           onCategoryRemoved: (value: string) => void }} options
 */
export function useProductCategories({ products, onCategoryAdded, onCategoryRemoved }) {
    const [listVersion, setListVersion] = useState(0);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDisplayType, setNewCategoryDisplayType] = useState(DISPLAY_TYPES.DESIGN);
    const [savingCategory, setSavingCategory] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);

    /* eslint-disable react-hooks/exhaustive-deps -- the lists live in the category module; listVersion marks their changes */
    const allCategories = useMemo(() => getAllCategories(), [listVersion]);
    const customCategories = useMemo(() => getCustomCategories(), [listVersion]);
    const hiddenCategories = useMemo(() => getHiddenCategories(), [listVersion]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const persistCategorySettings = useCallback(async (nextCustom, nextHidden) => {
        await saveCategorySettings({ customCategories: nextCustom, hiddenCategories: nextHidden });
        applyCategoryPageData({
            customCategories: JSON.stringify(nextCustom),
            hiddenCategories: JSON.stringify(nextHidden),
        });
        setListVersion((v) => v + 1);
    }, []);

    // The shop's own categories; broken entries saved by older versions are cleaned up once
    useEffect(() => {
        (async () => {
            try {
                const page = await fetchCustomCategoriesPage();
                const rawCustom = parseCustomCategoriesFromPage(page);
                const sanitized = sanitizeCustomCategories(rawCustom);
                applyCategoryPageData(page);
                if (sanitized.length !== rawCustom.length) {
                    await persistCategorySettings(sanitized, parseHiddenCategoriesFromPage(page));
                }
                setListVersion((v) => v + 1);
            } catch (err) {
                console.error(err);
            }
        })();
    }, [persistCategorySettings]);

    const closeAddCategory = useCallback(() => {
        setShowAddCategory(false);
        setNewCategoryName('');
        setNewCategoryDisplayType(DISPLAY_TYPES.DESIGN);
    }, []);

    const addCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) {
            alert('יש להזין שם לקטגוריה');
            return;
        }
        const existing = findCategoryByName(name);
        if (existing) {
            alert(`הקטגוריה "${existing.label}" כבר קיימת ברשימה`);
            return;
        }
        setSavingCategory(true);
        try {
            await persistCategorySettings(
                [...customCategories, buildCustomCategory(name, newCategoryDisplayType)],
                hiddenCategories.filter((v) => v !== name),
            );
            onCategoryAdded(name, newCategoryDisplayType);
            closeAddCategory();
        } catch (err) {
            console.error(err);
            alert('שגיאה בשמירת הקטגוריה');
        } finally {
            setSavingCategory(false);
        }
    };

    /** A built-in category is hidden; the shop's own is deleted. Products keep their category either way. */
    const removeCategory = async (categoryValue) => {
        if (!categoryValue) return;
        const inUse = products.some((p) => p.category === categoryValue);
        const msg = inUse
            ? `להסיר את הקטגוריה "${categoryValue}" מהרשימה? מוצרים קיימים יישארו משויכים אליה.`
            : `להסיר את הקטגוריה "${categoryValue}" מהרשימה?`;
        if (!confirm(msg)) return;

        const custom = isCustomCategory(categoryValue);
        setSavingCategory(true);
        try {
            await persistCategorySettings(
                custom ? customCategories.filter((c) => c.value !== categoryValue) : customCategories,
                custom ? hiddenCategories : [...hiddenCategories, categoryValue],
            );
            onCategoryRemoved(categoryValue);
        } catch (err) {
            console.error(err);
            alert('שגיאה במחיקת הקטגוריה');
        } finally {
            setSavingCategory(false);
        }
    };

    return {
        listVersion,
        allCategories,
        savingCategory,
        showAddCategory,
        setShowAddCategory,
        closeAddCategory,
        newCategoryName,
        setNewCategoryName,
        newCategoryDisplayType,
        setNewCategoryDisplayType,
        addCategory,
        removeCategory,
    };
}
