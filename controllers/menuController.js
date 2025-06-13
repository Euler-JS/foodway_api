const Menu = require('../models/Menu');
const ApiResponse = require('../utils/response');

class MenuController {
  /**
   * Buscar menu completo de um restaurante
   * GET /api/v1/menu/:restaurant_id
   */
  async getCompleteMenu(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const options = {
        includeInactive: req.query.include_inactive === 'true',
        includeUnavailable: req.query.include_unavailable === 'true',
        categoryId: req.query.category_id ? parseInt(req.query.category_id) : null
      };

      const menu = await Menu.getCompleteMenu(restaurant_id, options);

      return res.status(200).json(menu);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar menu por categoria específica
   * GET /api/v1/menu/:restaurant_id/category/:category_id
   */
  async getMenuByCategory(req, res, next) {
    try {
      const { restaurant_id, category_id } = req.params;

      const menu = await Menu.getMenuByCategory(restaurant_id, parseInt(category_id));

      return res.status(200).json(menu);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produtos em promoção
   * GET /api/v1/menu/:restaurant_id/promotions
   */
  async getPromotions(req, res, next) {
    try {
      const { restaurant_id } = req.params;

      const promotions = await Menu.getPromotions(restaurant_id);

      return ApiResponse.success(
        res, 
        promotions, 
        'Produtos em promoção listados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar item específico do menu
   * GET /api/v1/menu/:restaurant_id/item/:product_id
   */
  async getMenuItem(req, res, next) {
    try {
      const { restaurant_id, product_id } = req.params;

      const menuItem = await Menu.getMenuItem(restaurant_id, product_id);

      return res.status(200).json(menuItem);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar estatísticas do menu
   * GET /api/v1/menu/:restaurant_id/stats
   */
  async getMenuStats(req, res, next) {
    try {
      const { restaurant_id } = req.params;

      const stats = await Menu.getMenuStats(restaurant_id);

      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint compatível com o Flutter (formato original)
   * GET /api/v1/menu/restaurant/:restaurant_id
   */
  async getMenuForFlutter(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Usar as mesmas opções, mas garantir formato exato do Flutter
      const options = {
        includeInactive: false, // Sempre false para o app
        includeUnavailable: false, // Sempre false para o app
        categoryId: null
      };

      const menu = await Menu.getCompleteMenu(restaurant_id, options);

      // Retornar exatamente no formato que o Flutter espera
      return res.status(200).json(menu);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar item específico para o Flutter
   * GET /api/v1/menu/restaurant/:restaurant_id/item/:product_id
   */
  async getMenuItemForFlutter(req, res, next) {
    try {
      const { restaurant_id, product_id } = req.params;

      const menuItem = await Menu.getMenuItem(restaurant_id, product_id);

      return res.status(200).json(menuItem);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar categorias do menu (simplificado para o Flutter)
   * GET /api/v1/menu/:restaurant_id/categories
   */
  async getMenuCategories(req, res, next) {
    try {
      const { restaurant_id } = req.params;

      const menu = await Menu.getCompleteMenu(restaurant_id, {
        includeInactive: false,
        includeUnavailable: false
      });

      // Retornar apenas as categorias sem os produtos
      const categories = menu.menu.map(category => ({
        category_id: category.category_id,
        uuid: category.uuid,
        category_name: category.category_name,
        image_url: category.image_url,
        products_count: category.products.length
      }));

      return ApiResponse.success(
        res,
        {
          restaurant: menu.restaurant,
          categories: categories
        },
        'Categorias do menu listadas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produtos de uma categoria específica
   * GET /api/v1/menu/:restaurant_id/categories/:category_id/products
   */
  async getCategoryProducts(req, res, next) {
    try {
      const { restaurant_id, category_id } = req.params;

      const menu = await Menu.getMenuByCategory(restaurant_id, parseInt(category_id));

      if (!menu.menu || menu.menu.length === 0) {
        return ApiResponse.notFound(res, 'Categoria não encontrada ou sem produtos');
      }

      const category = menu.menu[0];

      return ApiResponse.success(
        res,
        {
          restaurant: menu.restaurant,
          category: {
            category_id: category.category_id,
            category_name: category.category_name,
            image_url: category.image_url
          },
          products: category.products
        },
        'Produtos da categoria listados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();