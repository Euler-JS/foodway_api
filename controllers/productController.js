const Product = require('../models/Product');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/errors');

class ProductController {
  /**
   * Listar todos os produtos
   * GET /api/v1/products
   */
  async index(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        categoryId: req.query.category_id,
        restaurantId: req.query.restaurant_id,
        isAvailable: req.query.is_available,
        isOnPromotion: req.query.is_on_promotion,
        minPrice: req.query.min_price,
        maxPrice: req.query.max_price,
        search: req.query.search,
        sortBy: req.query.sort_by,
        sortOrder: req.query.sort_order
      };

      const result = await Product.findAll(options);

      return ApiResponse.success(res, result, 'Produtos listados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produto por ID
   * GET /api/v1/products/:id
   */
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      return ApiResponse.success(res, product, 'Produto encontrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produto por UUID
   * GET /api/v1/products/uuid/:uuid
   */
  async showByUuid(req, res, next) {
    try {
      const { uuid } = req.params;
      const product = await Product.findByUuid(uuid);

      return ApiResponse.success(res, product, 'Produto encontrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar produtos por categoria
   * GET /api/v1/categories/:category_id/products
   */
  async indexByCategory(req, res, next) {
    try {
      const { category_id } = req.params;
      
      // Verificar se a categoria existe
      await Category.findById(category_id);

      const options = {
        isAvailable: req.query.is_available,
        sortBy: req.query.sort_by || 'sort_order',
        sortOrder: req.query.sort_order || 'asc'
      };

      const products = await Product.findByCategory(category_id, options);

      return ApiResponse.success(
        res, 
        products, 
        'Produtos da categoria listados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar produtos por restaurante
   * GET /api/v1/restaurants/:restaurant_id/products
   */
  async indexByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const options = {
        isAvailable: req.query.is_available,
        isOnPromotion: req.query.is_on_promotion,
        categoryId: req.query.category_id,
        sortBy: req.query.sort_by || 'sort_order',
        sortOrder: req.query.sort_order || 'asc'
      };

      const products = await Product.findByRestaurant(restaurant_id, options);

      return ApiResponse.success(
        res, 
        products, 
        'Produtos do restaurante listados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo produto
   * POST /api/v1/products
   */
  async store(req, res, next) {
    try {
      const productData = req.body;

      // Verificar se a categoria existe
      await Category.findById(productData.category_id);

      const product = await Product.create(productData);

      return ApiResponse.success(
        res, 
        product, 
        'Produto criado com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar produto para uma categoria específica
   * POST /api/v1/categories/:category_id/products
   */
  async storeForCategory(req, res, next) {
    try {
      const { category_id } = req.params;
      const productData = { ...req.body, category_id: parseInt(category_id) };

      // Verificar se a categoria existe
      await Category.findById(category_id);

      const product = await Product.create(productData);

      return ApiResponse.success(
        res, 
        product, 
        'Produto criado com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar produto
   * PUT /api/v1/products/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Se está mudando a categoria, verificar se existe
      if (updateData.category_id) {
        await Category.findById(updateData.category_id);
      }

      const product = await Product.update(id, updateData);

      return ApiResponse.success(res, product, 'Produto atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar produto (soft delete)
   * DELETE /api/v1/products/:id
   */
  async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.delete(id);

      return ApiResponse.success(res, product, 'Produto indisponibilizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar produto permanentemente
   * DELETE /api/v1/products/:id/hard
   */
  async hardDestroy(req, res, next) {
    try {
      const { id } = req.params;
      await Product.hardDelete(id);

      return ApiResponse.success(res, null, 'Produto deletado permanentemente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reativar produto
   * PATCH /api/v1/products/:id/reactivate
   */
  async reactivate(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.reactivate(id);

      return ApiResponse.success(res, product, 'Produto reativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Aplicar/remover promoção
   * PATCH /api/v1/products/:id/promotion
   */
  async togglePromotion(req, res, next) {
    try {
      const { id } = req.params;
      const { promotion_price } = req.body;

      const product = await Product.togglePromotion(id, promotion_price);

      const message = promotion_price 
        ? 'Promoção aplicada com sucesso' 
        : 'Promoção removida com sucesso';

      return ApiResponse.success(res, product, message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Duplicar produto
   * POST /api/v1/products/:id/duplicate
   */
  async duplicate(req, res, next) {
    try {
      const { id } = req.params;
      const overrides = req.body;

      // Se mudando categoria, verificar se existe
      if (overrides.category_id) {
        await Category.findById(overrides.category_id);
      }

      const product = await Product.duplicate(id, overrides);

      return ApiResponse.success(
        res, 
        product, 
        'Produto duplicado com sucesso', 
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mover produto para outra categoria
   * PATCH /api/v1/products/:id/move
   */
  async moveToCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { category_id } = req.body;

      // Verificar se a nova categoria existe
      await Category.findById(category_id);

      const product = await Product.moveToCategory(id, category_id);

      return ApiResponse.success(
        res, 
        product, 
        'Produto movido para nova categoria com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reordenar produtos de uma categoria
   * PUT /api/v1/categories/:category_id/products/reorder
   */
  async reorder(req, res, next) {
    try {
      const { category_id } = req.params;
      const { products } = req.body;

      // Verificar se a categoria existe
      await Category.findById(category_id);

      const reorderedProducts = await Product.reorder(category_id, products);

      return ApiResponse.success(
        res, 
        reorderedProducts, 
        'Produtos reordenados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produtos em promoção
   * GET /api/v1/products/promotions
   */
  async promotions(req, res, next) {
    try {
      const restaurantId = req.query.restaurant_id;
      
      // Se fornecido restaurant_id, verificar se existe
      if (restaurantId) {
        await Restaurant.findById(restaurantId);
      }

      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        sortBy: req.query.sort_by || 'created_at',
        sortOrder: req.query.sort_order || 'desc'
      };

      const result = await Product.findPromotions(restaurantId, options);

      return ApiResponse.success(res, result, 'Produtos em promoção listados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produtos em promoção por restaurante
   * GET /api/v1/restaurants/:restaurant_id/products/promotions
   */
  async promotionsByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        sortBy: req.query.sort_by || 'created_at',
        sortOrder: req.query.sort_order || 'desc'
      };

      const result = await Product.findPromotions(restaurant_id, options);

      return ApiResponse.success(
        res, 
        result, 
        'Produtos em promoção do restaurante listados com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos produtos
   * GET /api/v1/products/stats
   */
  async stats(req, res, next) {
    try {
      const categoryId = req.query.category_id;
      const restaurantId = req.query.restaurant_id;
      
      // Verificar se os IDs existem
      if (categoryId) {
        await Category.findById(categoryId);
      }
      
      if (restaurantId) {
        await Restaurant.findById(restaurantId);
      }

      const stats = await Product.getStats(categoryId, restaurantId);

      return ApiResponse.success(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos produtos por categoria
   * GET /api/v1/categories/:category_id/products/stats
   */
  async statsByCategory(req, res, next) {
    try {
      const { category_id } = req.params;
      
      // Verificar se a categoria existe
      await Category.findById(category_id);

      const stats = await Product.getStats(category_id);

      return ApiResponse.success(
        res, 
        stats, 
        'Estatísticas dos produtos da categoria obtidas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos produtos por restaurante
   * GET /api/v1/restaurants/:restaurant_id/products/stats
   */
  async statsByRestaurant(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      await Restaurant.findById(restaurant_id);

      const stats = await Product.getStats(null, restaurant_id);

      return ApiResponse.success(
        res, 
        stats, 
        'Estatísticas dos produtos do restaurante obtidas com sucesso'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar produtos
   * GET /api/v1/products/search
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q || q.trim().length === 0) {
        throw new AppError('Parâmetro de busca é obrigatório', 400);
      }

      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 10,
        search: q.trim(),
        categoryId: req.query.category_id,
        restaurantId: req.query.restaurant_id,
        isAvailable: req.query.is_available !== undefined ? req.query.is_available : true,
        isOnPromotion: req.query.is_on_promotion,
        minPrice: req.query.min_price,
        maxPrice: req.query.max_price
      };

      const result = await Product.findAll(options);

      return ApiResponse.success(
        res, 
        result, 
        `Produtos encontrados para "${q}"`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar se produto existe
   * HEAD /api/v1/products/:id
   */
  async exists(req, res, next) {
    try {
      const { id } = req.params;
      await Product.findById(id);

      return res.status(200).end();
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).end();
      }
      next(error);
    }
  }
}

module.exports = new ProductController();