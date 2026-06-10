import { getPage, updatePage } from './pages';

const ENDPOINT = 'product-categories';

export async function fetchCustomCategoriesPage() {
    return getPage(ENDPOINT);
}

export async function saveCategorySettings({ customCategories, hiddenCategories }) {
    return updatePage(ENDPOINT, {
        customCategories: JSON.stringify(customCategories),
        hiddenCategories: JSON.stringify(hiddenCategories ?? []),
    });
}
