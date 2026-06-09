import { fetchCustomCategoriesPage } from '../api/productCategoriesApi';
import { applyCategoryPageData } from '../constants/productCategories';

export async function initProductCategories() {
    const page = await fetchCustomCategoriesPage();
    applyCategoryPageData(page);
}
