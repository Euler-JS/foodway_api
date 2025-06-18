const QRCode = require('qrcode');
const Table = require('../models/Table');
const Restaurant = require('../models/Restaurant');
const ApiResponse = require('../utils/response');
const { AppError } = require('../utils/errors');

class QRCodeController {
  /**
   * Gerar QR Code para restaurante
   * GET /api/v1/qr/restaurant/:restaurant_id
   */
  async generateRestaurantQR(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { format = 'png', size = 200 } = req.query;

      // Verificar se o restaurante existe
      const restaurant = await Restaurant.findById(restaurant_id);
      
      // Construir URL do menu
      // const baseUrl = process.env.WEBAPP_URL || req.protocol + '://' + req.get('host');
      const baseUrl = process.env.WEBAPP_URL || "https://euler-js.github.io/foodway";
      const menuUrl = `${baseUrl}/?restaurant=${restaurant.uuid}`;

      // Opções do QR Code
      const qrOptions = {
        type: format === 'svg' ? 'svg' : 'png',
        width: parseInt(size),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      // Gerar QR Code
      const qrCode = await QRCode.toString(menuUrl, qrOptions);

      // Resposta baseada no formato
      if (format === 'svg') {
        res.set('Content-Type', 'image/svg+xml');
        return res.send(qrCode);
      } else if (format === 'png') {
        const qrBuffer = await QRCode.toBuffer(menuUrl, qrOptions);
        res.set('Content-Type', 'image/png');
        return res.send(qrBuffer);
      } else {
        // Formato JSON com dados
        return ApiResponse.success(res, {
          restaurant: {
            id: restaurant.id,
            uuid: restaurant.uuid,
            name: restaurant.name
          },
          qr_code: {
            url: menuUrl,
            data_url: await QRCode.toDataURL(menuUrl, qrOptions),
            svg: await QRCode.toString(menuUrl, { ...qrOptions, type: 'svg' })
          }
        }, 'QR Code gerado com sucesso');
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Gerar QR Code para mesa específica
   * GET /api/v1/qr/restaurant/:restaurant_id/table/:table_number
   */
  async generateTableQR(req, res, next) {
    try {
      const { restaurant_id, table_number } = req.params;
      const { format = 'png', size = 200 } = req.query;

      // Verificar se o restaurante existe
      const restaurant = await Restaurant.findById(restaurant_id);
      
      // Verificar se a mesa existe
      const table = await Table.findByRestaurantAndNumber(restaurant_id, parseInt(table_number));

      // Construir URL do menu com mesa
      // const baseUrl = process.env.APP_URL || req.protocol + '://' + req.get('host');
      const baseUrl = process.env.WEBAPP_URL || "https://euler-js.github.io/foodway";
      const menuUrl = `${baseUrl}/?restaurant=${restaurant.uuid}?table=${table.table_number}`;

      // Opções do QR Code
      const qrOptions = {
        type: format === 'svg' ? 'svg' : 'png',
        width: parseInt(size),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      // Gerar QR Code
      const qrCode = await QRCode.toString(menuUrl, qrOptions);

      // Atualizar flag de QR gerado na mesa
      await Table.update(table.id, { 
        qr_code_generated: true,
        last_qr_generated_at: new Date().toISOString()
      });

      // Resposta baseada no formato
      if (format === 'svg') {
        res.set('Content-Type', 'image/svg+xml');
        return res.send(qrCode);
      } else if (format === 'png') {
        const qrBuffer = await QRCode.toBuffer(menuUrl, qrOptions);
        res.set('Content-Type', 'image/png');
        return res.send(qrBuffer);
      } else {
        // Formato JSON com dados
        return ApiResponse.success(res, {
          restaurant: {
            id: restaurant.id,
            uuid: restaurant.uuid,
            name: restaurant.name
          },
          table: {
            id: table.id,
            number: table.table_number,
            name: table.name,
            capacity: table.capacity
          },
          qr_code: {
            url: menuUrl,
            data_url: await QRCode.toDataURL(menuUrl, qrOptions),
            svg: await QRCode.toString(menuUrl, { ...qrOptions, type: 'svg' })
          }
        }, 'QR Code da mesa gerado com sucesso');
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Gerar QR Codes para múltiplas mesas
   * POST /api/v1/qr/restaurant/:restaurant_id/tables/batch
   */
  async generateBatchTableQR(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { table_numbers, format = 'json' } = req.body;

      if (!Array.isArray(table_numbers) || table_numbers.length === 0) {
        throw new AppError('Lista de números de mesa é obrigatória', 400);
      }

      if (table_numbers.length > 50) {
        throw new AppError('Máximo de 50 mesas por vez', 400);
      }

      // Verificar se o restaurante existe
      const restaurant = await Restaurant.findById(restaurant_id);
      
      // const baseUrl = process.env.APP_URL || req.protocol + '://' + req.get('host');
      const baseUrl = process.env.WEBAPP_URL || "https://euler-js.github.io/foodway";
      const qrResults = [];

      // Opções do QR Code
      const qrOptions = {
        type: 'png',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      // Processar cada mesa
      for (const tableNumber of table_numbers) {
        try {
          // Verificar se a mesa existe
          const table = await Table.findByRestaurantAndNumber(restaurant_id, tableNumber);
          
          // Construir URL
          const menuUrl = `${baseUrl}/?restaurant=${restaurant.uuid}?table=${table.table_number}`;
          
          // Gerar QR Code
          const dataUrl = await QRCode.toDataURL(menuUrl, qrOptions);
          const svg = await QRCode.toString(menuUrl, { ...qrOptions, type: 'svg' });

          // Atualizar mesa
          await Table.update(table.id, { 
            qr_code_generated: true,
            last_qr_generated_at: new Date().toISOString()
          });

          qrResults.push({
            table: {
              id: table.id,
              number: table.table_number,
              name: table.name,
              capacity: table.capacity
            },
            qr_code: {
              url: menuUrl,
              data_url: dataUrl,
              svg: svg
            },
            success: true
          });

        } catch (error) {
          qrResults.push({
            table_number: tableNumber,
            error: error.message,
            success: false
          });
        }
      }

      const successful = qrResults.filter(r => r.success).length;
      const failed = qrResults.filter(r => !r.success).length;

      return ApiResponse.success(res, {
        restaurant: {
          id: restaurant.id,
          uuid: restaurant.uuid,
          name: restaurant.name
        },
        results: qrResults,
        summary: {
          total_requested: table_numbers.length,
          successful: successful,
          failed: failed
        }
      }, `${successful} QR Codes gerados com sucesso`);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Gerar página de impressão para QR Codes
   * GET /api/v1/qr/restaurant/:restaurant_id/print
   */
  async generatePrintPage(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      const { table_numbers, layout = 'grid' } = req.query;

      // Verificar se o restaurante existe
      const restaurant = await Restaurant.findById(restaurant_id);
      
      // Processar números de mesa
      let tablesToPrint = [];
      
      if (table_numbers) {
        const numbers = table_numbers.split(',').map(n => parseInt(n.trim()));
        for (const number of numbers) {
          try {
            const table = await Table.findByRestaurantAndNumber(restaurant_id, number);
            tablesToPrint.push(table);
          } catch (error) {
            // Ignorar mesas que não existem
          }
        }
      } else {
        // Se não especificou mesas, pegar todas as ativas
        tablesToPrint = await Table.findByRestaurant(restaurant_id, { isActive: true });
      }

      if (tablesToPrint.length === 0) {
        throw new AppError('Nenhuma mesa encontrada para impressão', 404);
      }

      // Gerar HTML para impressão
      // const baseUrl = process.env.APP_URL || req.protocol + '://' + req.get('host');
      const baseUrl = process.env.WEBAPP_URL || "https://euler-js.github.io/foodway";
      
      const qrOptions = {
        type: 'svg',
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      let qrCodesHtml = '';
      
      for (const table of tablesToPrint) {
        const menuUrl = `${baseUrl}/?restaurant=${restaurant.uuid}?table=${table.table_number}`;
        const qrSvg = await QRCode.toString(menuUrl, qrOptions);
        
        qrCodesHtml += `
          <div class="qr-item">
            <div class="qr-code">${qrSvg}</div>
            <div class="qr-info">
              <h3>Mesa ${table.table_number}</h3>
              <p>${restaurant.name}</p>
              ${table.name ? `<p class="table-name">${table.name}</p>` : ''}
              <p class="capacity">${table.capacity} pessoas</p>
              <!--<p class="url">${menuUrl}</p>-->
            </div>
          </div>
        `;
      }

      const printHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Codes - ${restaurant.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            background: white;
            color: black;
        }
        
        .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border-bottom: 2px solid #333;
        }
        
        .print-header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .print-header p {
            font-size: 14px;
            color: #666;
        }
        
        .qr-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .qr-item {
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            page-break-inside: avoid;
            background: white;
        }
        
        .qr-code {
            margin-bottom: 15px;
        }
        
        .qr-code svg {
            max-width: 150px;
            height: auto;
        }
        
        .qr-info h3 {
            font-size: 18px;
            margin-bottom: 8px;
            color: #333;
        }
        
        .qr-info p {
            font-size: 12px;
            margin-bottom: 4px;
            color: #666;
        }
        
        .table-name {
            font-weight: bold;
            color: #333 !important;
        }
        
        .capacity {
            font-style: italic;
        }
        
        .url {
            font-size: 8px !important;
            word-break: break-all;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
        
        @media print {
            body { background: white; }
            .print-header { border-bottom: 2px solid #000; }
            .qr-item { border: 2px solid #000; }
            .url { display: none; }
        }
        
        @page {
            size: A4;
            margin: 15mm;
        }
    </style>
    <script>
        window.onload = function() {
            // Auto-print quando carregar (opcional)
            // window.print();
        }
        
        function printPage() {
            window.print();
        }
    </script>
</head>
<body>
    <div class="print-header">
        <h1>QR Codes do Menu</h1>
        <p><strong>${restaurant.name}</strong></p>
        <p>Total de mesas: ${tablesToPrint.length}</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <button onclick="printPage()" style="margin-top: 10px; padding: 10px 20px; background: #FF5722; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🖨️ Imprimir
        </button>
    </div>
    
    <div class="qr-container">
        ${qrCodesHtml}
    </div>
</body>
</html>
      `;

      res.set('Content-Type', 'text/html');
      return res.send(printHtml);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter informações de QR Code sem gerar
   * GET /api/v1/qr/restaurant/:restaurant_id/info
   */
  async getQRInfo(req, res, next) {
    try {
      const { restaurant_id } = req.params;
      
      // Verificar se o restaurante existe
      const restaurant = await Restaurant.findById(restaurant_id);
      
      // Buscar mesas com QR gerado
      const allTables = await Table.findByRestaurant(restaurant_id, { isActive: null });
      const tablesWithQR = allTables.filter(table => table.qr_code_generated);
      const tablesWithoutQR = allTables.filter(table => !table.qr_code_generated);

      // const baseUrl = process.env.APP_URL || req.protocol + '://' + req.get('host');
      const baseUrl = process.env.WEBAPP_URL || "https://euler-js.github.io/foodway";

      return ApiResponse.success(res, {
        restaurant: {
          id: restaurant.id,
          uuid: restaurant.uuid,
          name: restaurant.name
        },
        qr_urls: {
          restaurant: `${baseUrl}/menu/restaurant/${restaurant.uuid}`,
          api_restaurant: `${req.protocol}://${req.get('host')}/api/v1/qr/restaurant/${restaurant_id}`,
          api_table: `${req.protocol}://${req.get('host')}/api/v1/qr/restaurant/${restaurant_id}/table/{number}`,
          print_page: `${req.protocol}://${req.get('host')}/api/v1/qr/restaurant/${restaurant_id}/print`
        },
        statistics: {
          total_tables: allTables.length,
          tables_with_qr: tablesWithQR.length,
          tables_without_qr: tablesWithoutQR.length
        },
        tables_with_qr: tablesWithQR.map(table => ({
          number: table.table_number,
          name: table.name,
          last_generated: table.last_qr_generated_at
        })),
        tables_without_qr: tablesWithoutQR.map(table => table.table_number)
      }, 'Informações de QR Code obtidas com sucesso');

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QRCodeController();